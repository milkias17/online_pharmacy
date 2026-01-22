import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSocket } from './services/socketService';
import { initEventBus } from './services/eventBus';
import { initKafka } from './services/kafkaConsumer'; // <--- 1. ADD THIS IMPORT
import { logger } from './config/logger';
import * as NotificationController from './controllers/notificationController';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Initialize Asynchronous Logic
initSocket(server);
initEventBus(); 
initKafka().catch(err => logger.error("Kafka Startup Failed", err)); // <--- 2. START THE KAFKA LISTENER

// Routes
app.post('/v1/notify', NotificationController.sendNotification);
app.post('/v1/devices', NotificationController.registerDevice);
app.get('/v1/notifications', NotificationController.getUserNotifications);

// Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`);
});
