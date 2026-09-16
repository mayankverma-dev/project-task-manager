import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

/**
 * Creates a fresh IORedis connection suitable for BullMQ.
 *
 * BullMQ requires:
 *  - maxRetriesPerRequest: null  (so blocked commands like BRPOP never timeout)
 *  - enableReadyCheck: false     (so the connection can be used before Redis is ready)
 *
 * Each BullMQ Queue and Worker must call this to get its own dedicated connection.
 * Never share this connection with the cache or pub/sub redisClient.
 */
export const createBullMQConnection = () => {
  const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on('error', (err) => {
    logger.error({ err }, 'BullMQ Redis connection error');
  });

  connection.on('connect', () => {
    logger.info('BullMQ Redis connection established');
  });

  return connection;
};
