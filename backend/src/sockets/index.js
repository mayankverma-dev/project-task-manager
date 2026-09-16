import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { redisClient } from '../config/redis.js';

let io;

export const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Setup Redis adapter for multi-instance scaling
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  
  pubClient.on('error', (err) => logger.error({ err }, 'Redis PubClient Error'));
  subClient.on('error', (err) => logger.error({ err }, 'Redis SubClient Error'));

  io.adapter(createAdapter(pubClient, subClient));

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload; // { id: userId }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.id})`);

    // Client can request to join specific workspace rooms
    socket.on('join_workspace', (workspaceId) => {
      // In a real production app, we would verify the user is a member of this workspace
      // by querying the DB before letting them join. 
      // For this learning project's real-time layer, we'll allow joining the requested room.
      const room = `workspace:${workspaceId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined ${room}`);
    });

    socket.on('leave_workspace', (workspaceId) => {
      const room = `workspace:${workspaceId}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitToWorkspace = (workspaceId, event, payload) => {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event, payload);
  } else {
    logger.warn('Tried to emit socket event but io is not initialized');
  }
};
