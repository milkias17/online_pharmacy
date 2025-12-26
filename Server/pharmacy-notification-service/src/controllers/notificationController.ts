import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { addNotificationJob } from '../services/queueService';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

/**
 * 1. Ingest Notification
 * Called by Order/Inventory Services via HTTP
 */
export const sendNotification = async (req: Request, res: Response) => {
  try {
    // Security Check
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.SERVICE_API_KEY) {
      logger.warn(`Unauthorized notification attempt from IP: ${req.ip}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validation
    const { userId, title, body, type, metadata } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields (userId, title, body)' });
    }

    // Add to Redis Queue (Async processing)
    await addNotificationJob({ userId, title, body, type, metadata });

    return res.status(202).json({ 
      status: 'queued', 
      message: 'Notification scheduled for delivery' 
    });

  } catch (error) {
    logger.error('Error in sendNotification controller', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * 2. Register Device Token
 * Called by Frontend (Mobile/Web) to register FCM Token
 */
export const registerDevice = async (req: Request, res: Response) => {
  try {
    // In a real app, userId comes from JWT Middleware (req.user.id)
    // For now, we accept it from header or body
    const userId = (req.headers['x-user-id'] as string) || req.body.userId;
    const { fcmToken, platform } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ error: 'Missing userId or fcmToken' });
    }

    // Upsert: Create if new, Update if exists
    await prisma.deviceToken.upsert({
      where: { token: fcmToken },
      update: { userId, platform: platform || 'web', updatedAt: new Date() },
      create: { userId, token: fcmToken, platform: platform || 'web' },
    });

    logger.info(`Device registered for user: ${userId}`);
    return res.json({ success: true, message: 'Device token registered' });

  } catch (error) {
    logger.error('Error in registerDevice', error);
    return res.status(500).json({ error: 'Database error' });
  }
};

/**
 * 3. Get User Notifications
 * Called by Frontend to show notification history list
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing User ID' });
    }

    const limit = 50;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json(notifications);

  } catch (error) {
    logger.error('Error fetching notifications', error);
    return res.status(500).json({ error: 'Database error' });
  }
};