import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';
import { ApiError } from '../utils/ApiError.js';

const createRateLimiter = (options) => rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  handler: (req, res, next) => {
    next(new ApiError(429, 'RATE_LIMITED', 'Too many requests, please try again later.'));
  },
  ...options
});

export const authRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
