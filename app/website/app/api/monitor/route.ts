import { NextResponse } from "next/server";
import { type RepeatableJob } from "bullmq";
import { queues } from "@/library/queue/config";
import { logger } from "@/library/utils/logger";

export async function POST() {
  try {
    // Add recurring job to monitor polls
    await queues.pollMonitor.add(
      "check-new-polls",
      {},
      {
        repeat: {
          every: 10000, // Every 10 seconds for local development
          limit: 1, // Only one active recurring job at a time
        },
        jobId: "poll-monitor-recurring", // Unique ID to prevent duplicates
      }
    );

    logger.info("Poll monitoring started");
    return NextResponse.json({ status: "Monitoring started" });
  } catch (error) {
    logger.error("Failed to start monitoring:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to start monitoring" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const repeatableJobs = await queues.pollMonitor.getRepeatableJobs();
    await Promise.all(
      repeatableJobs.map((job) =>
        queues.pollMonitor.removeRepeatableByKey(job.key)
      )
    );

    logger.info("Poll monitoring stopped");
    return NextResponse.json({ status: "Monitoring stopped" });
  } catch (error) {
    logger.error("Failed to stop monitoring:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to stop monitoring" },
      { status: 500 }
    );
  }
}
