import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter'; // <--- NEW
import { createClient } from 'redis'; // <--- NEW
import { logger } from '../config/logger';
import { JwtPayload } from '../types';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initSocket = async (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // === 1. SETUP REDIS ADAPTER FOR SCALING ===
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));
  logger.info("Socket.IO Redis Adapter connected");
  // ==========================================

  // Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: No token"));

    try {
      const secret = process.env.JWT_SECRET || 'default_secret';
      const decoded = jwt.verify(token, secret) as JwtPayload;
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (socket.userId) {
      logger.info(`User connected via Socket: ${socket.userId}`);
      socket.join(socket.userId); 
    }
  });
};

export const emitRealTime = (userId: string, event: string, data: any) => {
  if (io) {
    // With Redis Adapter, this now works across ALL pods/containers
    io.to(userId).emit(event, data);
    logger.info(`Real-time event '${event}' sent to user ${userId}`);
  }
};