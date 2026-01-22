import dotenv from 'dotenv';
dotenv.config();
import { initEventBus } from './services/eventBus';

import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSocket } from './services/socketService';
import { logger } from './config/logger';

// Import Controllers
import * as NotificationController from './controllers/notificationController';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.IO
initSocket(server);
initEventBus();

// --- ROUTES ---

// 1. Internal API: Other services call this to trigger alerts
app.post('/v1/notify', NotificationController.sendNotification);

// 2. Client API: Frontend registers device for Push Notifications
app.post('/v1/devices', NotificationController.registerDevice);

// 3. Client API: Frontend fetches history
app.get('/v1/notifications', NotificationController.getUserNotifications);

// Health Check
app.get('/health', (req, res) => res.send('Notification Service is Healthy 🚀'));

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`);
});