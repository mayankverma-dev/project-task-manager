import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { redisClient } from '../config/redis.js';
import { db } from '../db/db.js';
import { workspaceMembers } from '../db/schema/index.js';
import { and, eq } from 'drizzle-orm';

let io;

export const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

    // Client requests to join a specific workspace room.
    // Membership is verified against the DB before the socket is admitted.
    socket.on('join_workspace', async (workspaceId) => {
      try {
        const [membership] = await db
          .select({ id: workspaceMembers.id })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, workspaceId),
              eq(workspaceMembers.userId, socket.user.id)
            )
          )
          .limit(1);

        if (!membership) {
          socket.emit('error', { message: 'Forbidden: Not a member of this workspace' });
          logger.warn(`Socket ${socket.id} tried to join workspace ${workspaceId} but is not a member`);
          return;
        }

        const room = `workspace:${workspaceId}`;
        socket.join(room);
        logger.info(`Socket ${socket.id} joined ${room}`);
      } catch (err) {
        logger.error({ err }, 'Error during join_workspace membership check');
        socket.emit('error', { message: 'Internal error during workspace join' });
      }
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

