// scripts/startWorkers.ts
import "dotenv/config";
import {
  pollMonitorWorker,
  epochDistributionWorker,
  pollResolutionWorker,
} from "../library/queue/workers.js";
import { Job, Worker } from "bullmq";
import { logger } from "../library/utils/logger.js";

async function startWorkers() {
  logger.info("Starting workers...");

  // Error handling
  const workers = [
    pollMonitorWorker,
    epochDistributionWorker,
    pollResolutionWorker,
  ];

  workers.forEach((worker) => {
    worker.on("completed", (job: Job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job: Job | undefined, err: Error) => {
      logger.error(`Job ${job?.id} failed:`, {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    });

    worker.on("error", (err: Error) => {
      logger.error("Worker error:", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down workers...");
    try {
      await Promise.all(workers.map((worker) => worker.close()));
      logger.info("All workers shut down successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  logger.info("All workers started successfully");
}

startWorkers().catch((error) => {
  logger.error("Failed to start workers:", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
