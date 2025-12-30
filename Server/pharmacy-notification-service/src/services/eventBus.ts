import { createClient } from 'redis';
import { addNotificationJob } from './queueService';
import { logger } from '../config/logger';

export const initEventBus = async () => {
  const subscriber = createClient({ url: process.env.REDIS_URL });
  await subscriber.connect();

  // SUBSCRIBE to the channel
  await subscriber.subscribe('global_events', (message) => {
    try {
      const event = JSON.parse(message);
      logger.info(`Received Event: ${event.type}`);

      // LOGIC: Decide what to do based on event type
      if (event.type === 'ORDER_CREATED') {
        // Add to the processing queue (BullMQ)
        addNotificationJob({
            userId: event.data.userId,
            title: "Order Created",
            body: `Order #${event.data.id} received.`
        });
      }
      
      if (event.type === 'STOCK_LOW') {
         addNotificationJob({
            userId: event.data.pharmacistId,
            title: "Low Stock Alert",
            body: `${event.data.medicineName} is low.`
        });
      }

    } catch (err) {
      logger.error("Failed to parse event message", err);
    }
  });

  logger.info("📡 Event Bus Subscribed to 'global_events'");
};