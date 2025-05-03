import { Job, Worker } from "bullmq";

import { logger } from "../../utils/logger.js";
import { ContractService } from "../services/contracts.js";
import { connection, queues } from "./config.js";

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

    // Define delay for the next check (e.g., 60 seconds)
    const nextCheckDelay = 60000;
    let result: PollMonitorResult;
    let nextJobLastProcessedCount: number;

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

        // Queue epoch distribution and poll resolution for each new poll
        for (const pollAddress of newPolls) {
          const pollDetails = await contractService.getPollDetails(
            pollAddress as `0x${string}`
          );
          const epochDuration = Math.floor(
            (Number(pollDetails.endDate) - pollDetails.startDate) / 4
          );

          // Calculate when first epoch will end
          const firstEpochEnd = pollDetails.startDate + epochDuration;
          const now = Math.floor(Date.now() / 1000);
          const firstEpochDelay = Math.max(0, (firstEpochEnd - now) * 1000);
          const resolutionDelay = Math.max(
            0,
            (Number(pollDetails.endDate) - now) * 1000
          );

          // Queue first epoch distribution
          await queues.epochDistribution.add(
            `epoch-${pollAddress}-1`,
            {
              pollAddress: pollAddress as `0x${string}`,
              epochNumber: 1,
              batchSize: 100, // Consider making this configurable
              offset: 0,
            },
            {
              delay: firstEpochDelay,
              // Default options from config.ts will apply (attempts, backoff)
            }
          );

          // Queue poll resolution
          await queues.pollResolution.add(
            `resolve-${pollAddress}`,
            {
              pollAddress: pollAddress as `0x${string}`,
              question: pollDetails.question + " " + pollDetails.description,
              startDate: pollDetails.startDate,
            },
            {
              delay: resolutionDelay,
              // Default options from config.ts will apply (attempts, backoff)
            }
          );
        }

        result = {
          newPolls: newPolls as `0x${string}`[],
          totalPolls: currentCount,
          lastProcessedCount: currentCount,
        };
        nextJobLastProcessedCount = currentCount;
      } else {
        workerLogger.info("No new polls found.");
        result = {
          newPolls: [],
          totalPolls: currentCount,
          lastProcessedCount,
        };
        nextJobLastProcessedCount = lastProcessedCount;
      }

      // Schedule the next poll check
      await queues.pollMonitor.add(
        "check-new-polls", // Consistent job name
        { lastProcessedCount: nextJobLastProcessedCount },
        {
          delay: nextCheckDelay,
          removeOnComplete: true, // Keep queue clean
          removeOnFail: true, // Keep queue clean after failures
          // Default options from config.ts will also apply (attempts, backoff)
        }
      );
      workerLogger.info(`Scheduled next poll check in ${nextCheckDelay}ms`, {
        nextLastProcessedCount: nextJobLastProcessedCount,
      });

      return result;
    } catch (error) {
      workerLogger.error("Failed to monitor polls", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Do not schedule the next job if an error occurred.
      // BullMQ's retry mechanism will handle retrying the current job.
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Only one monitoring job at a time
    // Removed autorun: true if it was implicitly there, job is started via API
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
