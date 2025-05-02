import { Worker } from "bullmq";
import { ContractService } from "../services/contracts.js";
import { connection } from "./config.js";
import { logger } from "../utils/logger.js";
import { resolveWithAI } from "../utils/poll-resolution-service.js";

// Create a worker dedicated to poll resolution
export const pollResolutionWorker = new Worker(
  "poll-resolution",
  async (job) => {
    const { pollAddress, question, startDate } = job.data;
    const contractService = new ContractService();
    const workerLogger = logger.child({
      component: "PollResolutionWorker",
      jobId: job.id,
      pollAddress,
    });

    try {
      workerLogger.info("Processing poll resolution", {
        question,
        startDate,
      });

      // Check if poll is ready to be resolved
      const pollInfo = await contractService.getPollInfo(pollAddress);
      const currentTime = Math.floor(Date.now() / 1000);

      if (Number(pollInfo.endTimestamp) > currentTime) {
        const waitTime = Number(pollInfo.endTimestamp) - currentTime;
        workerLogger.info(
          `Poll not ready for resolution, waiting ${waitTime} seconds`
        );

        // Requeue the job with appropriate delay
        throw new Error(
          `Poll not ready for resolution. Retry after ${waitTime} seconds`
        );
      }

      if (pollInfo.isResolved) {
        workerLogger.info("Poll already resolved");
        return { status: "already_resolved" };
      }

      // Get AI resolution
      const resolution = await resolveWithAI(question, startDate);
      workerLogger.info("Received AI resolution", { resolution });

      // Resolve the poll
      const txHash = await contractService.resolvePoll(
        pollAddress,
        resolution.winningPosition
      );

      workerLogger.info("Poll resolved successfully", {
        txHash,
        resolution,
      });

      return {
        status: "resolved",
        txHash,
        resolution,
      };
    } catch (error) {
      workerLogger.error("Failed to resolve poll", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // If poll is not ready, requeue with backoff
      if (
        error instanceof Error &&
        error.message.includes("Poll not ready for resolution")
      ) {
        throw error; // This will trigger the backoff strategy
      }

      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Process one resolution at a time
    limiter: {
      max: 2,
      duration: 60000, // Max 2 resolutions per minute
    },
  }
);

// Set up event handlers
pollResolutionWorker.on("ready", () => {
  logger.info("Poll resolution worker is ready");
});

pollResolutionWorker.on("active", (job) => {
  logger.info(`Processing job ${job.id}`);
});

pollResolutionWorker.on("completed", (job, result) => {
  logger.info(`Job ${job.id} completed successfully`, { result });
});

pollResolutionWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed:`, {
    error: err.message,
    stack: err.stack,
  });
});

pollResolutionWorker.on("error", (err) => {
  logger.error("Worker error:", {
    error: err.message,
    stack: err.stack,
  });
});
