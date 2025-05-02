import { ContractService } from "./contracts.js";
import { queues } from "../queue/config.js";
import { connection } from "../queue/config.js";
import { resolveWithAI } from "@/library/utils/poll-resolution-service.js";
import { logger } from "../utils/logger.js";

interface PollDetails {
  description: string;
  startDate: number;
  endTimestamp: bigint;
  currentEpochEnd?: number;
}

export class MonitoringService {
  private contractService: ContractService;
  private readonly LAST_PROCESSED_COUNT_KEY = "poll:lastProcessedCount";
  private readonly BATCH_SIZE = 100;
  private readonly serviceLogger = logger.child({
    component: "MonitoringService",
  });

  constructor() {
    this.contractService = new ContractService();
  }

  /**
   * Check for new polls and initialize monitoring for them
   */
  async monitorNewPolls() {
    try {
      const currentCount = await this.contractService.getPollCount();
      const lastProcessedCount = await this.getLastProcessedCount();

      this.serviceLogger.info("Checking for new polls", {
        currentCount,
        lastProcessedCount,
      });

      if (currentCount > lastProcessedCount) {
        this.serviceLogger.info(
          `Found ${currentCount - lastProcessedCount} new polls`
        );

        const newPolls = await this.contractService.getNewPolls(
          lastProcessedCount,
          currentCount
        );

        // Process each new poll
        for (const pollAddress of newPolls) {
          try {
            await this.initializePollMonitoring(pollAddress as `0x${string}`);
            this.serviceLogger.info(
              `Initialized monitoring for poll: ${pollAddress}`
            );
          } catch (error) {
            this.serviceLogger.error(
              `Failed to initialize monitoring for poll ${pollAddress}:`,
              error
            );
            // Continue with other polls even if one fails
          }
        }

        // Update the last processed count
        await this.setLastProcessedCount(currentCount);
      } else {
        this.serviceLogger.info("No new polls found");
      }
    } catch (error) {
      this.serviceLogger.error("Error in monitorNewPolls:", error);
      throw error;
    }
  }

  /**
   * Get the last processed poll count from Redis
   */
  private async getLastProcessedCount(): Promise<number> {
    const count = await connection.get(this.LAST_PROCESSED_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Set the last processed poll count in Redis
   */
  private async setLastProcessedCount(count: number): Promise<void> {
    await connection.set(this.LAST_PROCESSED_COUNT_KEY, count.toString());
  }

  /**
   * Initialize monitoring for a specific poll
   */
  private async initializePollMonitoring(pollAddress: `0x${string}`) {
    try {
      const pollDetails = await this.contractService.getPollDetails(
        pollAddress
      );
      const currentEpoch = await this.contractService.getCurrentEpoch(
        pollAddress
      );

      this.serviceLogger.info(`Initializing poll monitoring`, {
        pollAddress,
        currentEpoch: Number(currentEpoch),
        endTimestamp: Number(pollDetails.endTimestamp),
      });

      // Queue epoch distribution monitoring
      await this.scheduleEpochDistribution(
        pollAddress,
        Number(currentEpoch),
        pollDetails
      );

      // Queue poll resolution monitoring
      await this.schedulePollResolution(pollAddress, pollDetails);
    } catch (error) {
      this.serviceLogger.error(
        `Error initializing poll ${pollAddress}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Schedule the epoch distribution job
   */
  private async scheduleEpochDistribution(
    pollAddress: `0x${string}`,
    epochNumber: number,
    pollDetails: any
  ) {
    const delay = this.calculateDelayToEpochEnd(pollDetails);
    const jobId = `epoch-${pollAddress}-${epochNumber}`;

    this.serviceLogger.info(`Scheduling epoch distribution`, {
      pollAddress,
      epochNumber,
      delay,
    });

    // Queue the job with the appropriate delay
    await queues.epochDistribution.add(
      jobId,
      {
        pollAddress,
        epochNumber,
        batchSize: this.BATCH_SIZE,
        offset: 0,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 5, // Keep last 5 failed jobs
      }
    );
  }

  /**
   * Schedule the poll resolution job
   */
  private async schedulePollResolution(
    pollAddress: `0x${string}`,
    pollDetails: any
  ) {
    const delay = this.calculateDelayToPollEnd(pollDetails);
    const jobId = `resolve-${pollAddress}`;

    this.serviceLogger.info(`Scheduling poll resolution`, {
      pollAddress,
      delay,
    });

    // Queue the job with the appropriate delay
    await queues.pollResolution.add(
      jobId,
      {
        pollAddress,
        question: pollDetails.description,
        startDate: pollDetails.startDate,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 5,
      }
    );
  }

  /**
   * Calculate delay in milliseconds until the current epoch ends
   */
  private calculateDelayToEpochEnd(pollInfo: any): number {
    const epochEnd = Number(pollInfo.currentEpochEnd);
    const now = Math.floor(Date.now() / 1000);

    // If epoch already ended, return 0 delay
    if (epochEnd <= now) {
      return 0;
    }

    // Convert seconds to milliseconds
    return (epochEnd - now) * 1000;
  }

  /**
   * Calculate delay in milliseconds until the poll ends
   */
  private calculateDelayToPollEnd(pollInfo: any): number {
    const pollEnd = Number(pollInfo.endTimestamp);
    const now = Math.floor(Date.now() / 1000);

    // If poll already ended, return 0 delay
    if (pollEnd <= now) {
      return 0;
    }

    // Convert seconds to milliseconds
    return (pollEnd - now) * 1000;
  }
}
