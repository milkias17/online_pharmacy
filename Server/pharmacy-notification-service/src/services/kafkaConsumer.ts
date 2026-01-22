import { Kafka } from 'kafkajs';
import { addNotificationJob } from './queueService';

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['kafka-service:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

export const initKafka = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['order_events', 'payment_events', 'inventory_events'] });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value!.toString());
      
      if (data.event === 'ORDER_CREATED') {
        await addNotificationJob({ userId: data.user_id, title: "Order Received", body: "We are checking stock..." });
      }
      if (data.event === 'PAYMENT_SUCCESS') {
        await addNotificationJob({ userId: data.user_id, title: "Order Confirmed", body: "Payment successful!" });
      }
    },
  });
};