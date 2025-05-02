import { Queue } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../utils/logger.js";

interface PollMonitorJobData {
  lastProcessedCount?: number;
}

interface EpochDistributionJobData {
  pollAddress: `0x${string}`;
  epochNumber: number;
  batchSize: number;
  offset: number;
}

interface PollResolutionJobData {
  pollAddress: `0x${string}`;
  question: string;
  startDate: number;
}

// Redis connection with retry strategy
export const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      logger.info(`Retrying Redis connection in ${delay}ms`);
      return delay;
    },
  }
);

// Log Redis connection events
connection.on("connect", () => {
  logger.info("Connected to Redis");
});

connection.on("error", (error: Error) => {
  logger.error("Redis connection error:", {
    error: error.message,
    stack: error.stack,
  });
});

// Queue definitions with default options
export const queues = {
  pollMonitor: new Queue<PollMonitorJobData>("poll-monitor", {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  }),

  epochDistribution: new Queue<EpochDistributionJobData>("epoch-distribution", {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  }),

  pollResolution: new Queue<PollResolutionJobData>("poll-resolution", {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  }),
};
