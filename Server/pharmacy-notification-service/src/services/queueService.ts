import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { sendPushNotification } from "./fcmService";
import { emitRealTime } from "./socketService";
import { logger } from "../config/logger";
import { NotificationPayload } from "../types";

const prisma = new PrismaClient();

const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
});

// The Worker Processor
const worker = new Worker<NotificationPayload>(
  "notifications",
  async (job: Job<NotificationPayload>) => {
    const { userId, title, body, type, metadata } = job.data;
    logger.info(`Processing job ${job.id} for User: ${userId}`);

    // 1. Persist to Postgres
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type: type || "info",
        metadata: metadata || {},
      },
    });

    // 2. Real-time Delivery (In-App)
    emitRealTime(userId, "notification_received", notification);

    // 3. Push Delivery (FCM)
    const devices = await prisma.deviceToken.findMany({
      where: { userId },
    });

    if (devices.length > 0) {
      const pushPromises = devices.map((device: { token: string; }) =>
        sendPushNotification(device.token, title, body, metadata)
      );
      await Promise.all(pushPromises);
    }
  },
  { connection: redisConnection }
);

worker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed`, err);
});

export const addNotificationJob = async (payload: NotificationPayload) => {
  await notificationQueue.add("send_notification", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  });
};
