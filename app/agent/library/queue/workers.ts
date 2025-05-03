import { logger } from "../../utils/logger.js";
import { epochDistributionWorker } from "./epoch-distribution-worker.js";
import { pollMonitorWorker } from "./poll-monitor-worker.js";
import { pollResolutionWorker } from "./poll-resolution-worker.js";

export { epochDistributionWorker, pollMonitorWorker, pollResolutionWorker };

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down workers...");
  try {
    await Promise.all([
      pollMonitorWorker.close(),
      epochDistributionWorker.close(),
      pollResolutionWorker.close(),
    ]);
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
