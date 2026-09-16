import { redisClient } from '../config/redis.js';
import { logger } from './logger.js';

export const getOrSetCache = async (key, ttl, fetchFn) => {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    logger.error({ error, key }, 'Error reading from Redis cache');
    // On cache error, fallback to fetching from DB
  }

  const freshData = await fetchFn();

  try {
    await redisClient.set(key, JSON.stringify(freshData), 'EX', ttl);
  } catch (error) {
    logger.error({ error, key }, 'Error writing to Redis cache');
  }

  return freshData;
};

export const invalidateCache = async (pattern) => {
  try {
    let cursor = '0';
    let count = 0;
    do {
      const [newCursor, keys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        '100'
      );
      cursor = newCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
        count += keys.length;
      }
    } while (cursor !== '0');
    logger.info({ pattern, count }, 'Invalidated cache keys');
  } catch (error) {
    logger.error({ error, pattern }, 'Error invalidating Redis cache');
  }
};
