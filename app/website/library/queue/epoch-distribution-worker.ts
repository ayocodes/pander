import { Job, Worker } from "bullmq";
import { type Hash } from "viem";
import { ContractService } from "../services/contracts.js";
import { connection, queues } from "./config.js";
import { logger } from "../utils/logger.js";

interface EpochDistributionJobData {
  pollAddress: Hash;
  epochNumber: number;
  batchSize?: number;
  offset?: number;
}

interface EpochDistributionResult {
  processed: number;
  total: number;
  complete: boolean;
  nextBatch?: number;
}

// Create a worker dedicated to epoch distribution
export const epochDistributionWorker = new Worker<
  EpochDistributionJobData,
  EpochDistributionResult
>(
  "epoch-distribution",
  async (job: Job<EpochDistributionJobData>) => {
    const { pollAddress, epochNumber, batchSize = 100, offset = 0 } = job.data;
    const contractService = new ContractService();
    const workerLogger = logger.child({
      component: "EpochDistributionWorker",
      jobId: job.id,
      pollAddress,
      epochNumber,
    });

    try {
      workerLogger.info("Processing epoch distribution", {
        batchSize,
        offset,
      });

      // Get total participants count for this epoch
      const participantCount = await contractService.getEpochParticipantCount(
        pollAddress,
        epochNumber
      );

      if (participantCount === 0) {
        workerLogger.info("No participants found");
        return { processed: 0, total: 0, complete: true };
      }

      workerLogger.info(`Found ${participantCount} participants`);

      // Process current batch
      const currentBatchSize = Math.min(batchSize, participantCount - offset);

      if (currentBatchSize <= 0) {
        workerLogger.info("All batches processed");

        // Queue next epoch if not the last one
        if (epochNumber < 4) {
          await queueNextEpoch(pollAddress, epochNumber);
        }

        return { processed: 0, total: participantCount, complete: true };
      }

      // Process the current batch
      const txHash = await contractService.distributeEpochRewards(
        pollAddress,
        epochNumber,
        offset,
        currentBatchSize
      );

      workerLogger.info("Processed batch", {
        start: offset,
        end: offset + currentBatchSize,
        txHash,
      });

      // If there are more participants to process, queue the next batch
      const newOffset = offset + currentBatchSize;
      if (newOffset < participantCount) {
        await queues.epochDistribution.add(
          `epoch-${pollAddress}-${epochNumber}-batch-${newOffset}`,
          {
            pollAddress,
            epochNumber,
            batchSize,
            offset: newOffset,
          },
          {
            delay: 5000, // 5 second delay between batches for local development
            attempts: 3,
          }
        );

        return {
          processed: currentBatchSize,
          total: participantCount,
          complete: false,
          nextBatch: newOffset,
        };
      }

      // This was the last batch, queue the next epoch if not the last one
      if (epochNumber < 4) {
        await queueNextEpoch(pollAddress, epochNumber);
      }

      return {
        processed: currentBatchSize,
        total: participantCount,
        complete: true,
      };
    } catch (error) {
      workerLogger.error("Failed to distribute epoch rewards", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process up to 2 distribution jobs at once
    limiter: {
      max: 5,
      duration: 60000, // Process max 5 jobs per minute
    },
  }
);

// Helper function to queue the next epoch
async function queueNextEpoch(
  pollAddress: Hash,
  epochNumber: number
): Promise<void> {
  const contractService = new ContractService();
  const pollDetails = await contractService.getPollDetails(pollAddress);

  // Calculate when the next epoch will end
  const nextEpochNumber = epochNumber + 1;
  const epochDuration = Math.floor(
    (Number(pollDetails.endTimestamp) - pollDetails.startDate) / 4
  );
  const nextEpochEnd = pollDetails.startDate + nextEpochNumber * epochDuration;

  // Calculate delay until next epoch ends
  const now = Math.floor(Date.now() / 1000);
  const delay = Math.max(0, (nextEpochEnd - now) * 1000);

  logger.info("Queueing next epoch", {
    pollAddress,
    nextEpochNumber,
    delay,
  });

  // Queue the next epoch distribution
  await queues.epochDistribution.add(
    `epoch-${pollAddress}-${nextEpochNumber}`,
    {
      pollAddress,
      epochNumber: nextEpochNumber,
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
}

// Set up event handlers
epochDistributionWorker.on("ready", () => {
  logger.info("Epoch distribution worker is ready");
});

epochDistributionWorker.on("active", (job: Job<EpochDistributionJobData>) => {
  logger.info(`Processing job ${job.id}`);
});

epochDistributionWorker.on(
  "completed",
  (job: Job<EpochDistributionJobData>, result: EpochDistributionResult) => {
    logger.info(`Job ${job.id} completed successfully`, { result });
  }
);

epochDistributionWorker.on(
  "failed",
  (job: Job<EpochDistributionJobData> | undefined, err: Error) => {
    logger.error(`Job ${job?.id} failed:`, {
      error: err.message,
      stack: err.stack,
    });
  }
);

epochDistributionWorker.on("error", (err: Error) => {
  logger.error("Worker error:", {
    error: err.message,
    stack: err.stack,
  });
});
