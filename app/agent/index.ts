import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { queues } from "./library/queue/config";
import { logger } from "./utils/logger";
import "./library/queue/workers";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

app.post("/monitor", async (req, res) => {
  try {
    await queues.pollMonitor.add(
      "check-new-polls",
      {}, // Initial data is empty, worker defaults lastProcessedCount to 0
      {
        // The repeat option is removed. The worker will schedule the next run.
        jobId: "poll-monitor-initial", // Unique ID for the initial job trigger
        removeOnComplete: true, // Remove job from queue once completed successfully
        removeOnFail: true, // Remove job if it fails after all attempts
      }
    );

    // // Add recurring job to monitor polls
    // await queues.pollMonitor.add(
    //   "",
    //   {},
    //   {
    //     repeat: {
    //       every: 60000, // Every 60 seconds because that's the smallest time it takes a pool to be created
    //       limit: 1, // Only one active recurring job at a time
    //     },
    //     jobId: "poll-monitor-recurring", // Unique ID to prevent duplicates
    //   }
    // );

    logger.info("Poll monitoring started");
    res.json({ status: "Monitoring started" });
  } catch (error) {
    logger.error("Failed to start monitoring:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: "Failed to start monitoring" });
  }
});

app.delete("/monitor", async (req, res) => {
  try {
    const repeatableJobs = await queues.pollMonitor.getJobSchedulers();
    await Promise.all(
      repeatableJobs.map((job) =>
        queues.pollMonitor.removeJobScheduler(job.key)
      )
    );

    logger.info("Poll monitoring stopped");
    res.json({ status: "Monitoring stopped" });
  } catch (error) {
    logger.error("Failed to stop monitoring:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: "Failed to stop monitoring" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
