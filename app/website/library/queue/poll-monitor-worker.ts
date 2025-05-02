import { Worker, Job } from "bullmq";
import { type Hash } from "viem";
import { ContractService } from "../services/contracts.js";
import { connection, queues } from "./config.js";
import { logger } from "../utils/logger.js";

interface PollMonitorJobData {
  lastProcessedCount?: number;
}

interface PollMonitorResult {
  newPolls: `0x${string}`[];
  totalPolls: number;
  lastProcessedCount: number;
}

// Create a worker dedicated to monitoring new polls
export const pollMonitorWorker = new Worker<
  PollMonitorJobData,
  PollMonitorResult
>(
  "poll-monitor",
  async (job: Job<PollMonitorJobData>) => {
    const contractService = new ContractService();
    const workerLogger = logger.child({
      component: "PollMonitorWorker",
      jobId: job.id,
    });

    try {
      // Get current poll count
      const currentCount = await contractService.getPollCount();
      const lastProcessedCount = job.data.lastProcessedCount || 0;

      workerLogger.info("Checking for new polls", {
        currentCount,
        lastProcessedCount,
      });

      if (currentCount > lastProcessedCount) {
        // Get new polls
        const newPolls = await contractService.getNewPolls(
          lastProcessedCount,
          currentCount
        );

        workerLogger.info(`Found ${newPolls.length} new polls`);

        // Queue epoch distribution for each new poll
        for (const pollAddress of newPolls) {
          const pollDetails = await contractService.getPollDetails(
            pollAddress as `0x${string}`
          );
          const epochDuration = Math.floor(
            (Number(pollDetails.endTimestamp) - pollDetails.startDate) / 4
          );

          // Calculate when first epoch will end
          const firstEpochEnd = pollDetails.startDate + epochDuration;
          const now = Math.floor(Date.now() / 1000);
          const delay = Math.max(0, (firstEpochEnd - now) * 1000);

          // Queue first epoch distribution
          await queues.epochDistribution.add(
            `epoch-${pollAddress}-1`,
            {
              pollAddress: pollAddress as `0x${string}`,
              epochNumber: 1,
              batchSize: 100,
              offset: 0,
            },
            {
              delay,
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
            }
          );

          // Queue poll resolution
          await queues.pollResolution.add(
            `resolve-${pollAddress}`,
            {
              pollAddress: pollAddress as `0x${string}`,
              question: pollDetails.description,
              startDate: pollDetails.startDate,
            },
            {
              delay: Math.max(
                0,
                (Number(pollDetails.endTimestamp) - now) * 1000
              ),
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
            }
          );
        }

        return {
          newPolls: newPolls as `0x${string}`[],
          totalPolls: currentCount,
          lastProcessedCount: currentCount,
        };
      }

      return {
        newPolls: [],
        totalPolls: currentCount,
        lastProcessedCount,
      };
    } catch (error) {
      workerLogger.error("Failed to monitor polls", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Only one monitoring job at a time
  }
);

// Set up event handlers
pollMonitorWorker.on("ready", () => {
  logger.info("Poll monitor worker is ready");
});

pollMonitorWorker.on("active", (job: Job<PollMonitorJobData>) => {
  logger.info(`Processing job ${job.id}`);
});

pollMonitorWorker.on(
  "completed",
  (job: Job<PollMonitorJobData>, result: PollMonitorResult) => {
    logger.info(`Job ${job.id} completed successfully`, { result });
  }
);

pollMonitorWorker.on(
  "failed",
  (job: Job<PollMonitorJobData> | undefined, err: Error) => {
    logger.error(`Job ${job?.id} failed:`, {
      error: err.message,
      stack: err.stack,
    });
  }
);

pollMonitorWorker.on("error", (err: Error) => {
  logger.error("Worker error:", {
    error: err.message,
    stack: err.stack,
  });
});
