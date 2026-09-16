import crypto from 'crypto';
import { db } from '../db/db.js';
import { idempotencyKeys } from '../db/schema/system.js';
import { and, eq } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const idempotency = async (req, res, next) => {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return next();
  }

  const key = req.headers['idempotency-key'];
  if (!key) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Idempotency-Key header is required'));
  }

  const userId = req.user?.id;
  if (!userId) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'User must be authenticated for idempotency'));
  }

  const endpoint = req.originalUrl;
  const requestBodyStr = req.body ? JSON.stringify(req.body) : '';
  const requestHash = crypto.createHash('sha256').update(requestBodyStr).digest('hex');

  try {
    // Check if key exists
    const [existingKey] = await db
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.key, key),
          eq(idempotencyKeys.userId, userId),
          eq(idempotencyKeys.endpoint, endpoint)
        )
      )
      .limit(1);

    if (existingKey) {
      if (existingKey.requestHash !== requestHash) {
        return next(new ApiError(409, 'CONFLICT', 'Idempotency key reused with different request body'));
      }

      if (existingKey.responseStatus) {
        logger.info(`Returning cached response for idempotency key ${key}`);
        return res.status(existingKey.responseStatus).json(existingKey.responseBody);
      } else {
        return next(new ApiError(409, 'CONFLICT', 'Request is already in progress'));
      }
    }

    // Insert pending state
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    await db.insert(idempotencyKeys).values({
      key,
      userId,
      endpoint,
      requestHash,
      expiresAt,
    });

    // Intercept res.json to save response
    const originalJson = res.json;
    res.json = function (body) {
      // Restore original to avoid double calling
      res.json = originalJson;

      // Update DB asynchronously, don't wait for it to return response
      const status = res.statusCode;
      db.update(idempotencyKeys)
        .set({
          responseStatus: status,
          responseBody: body,
        })
        .where(
          and(
            eq(idempotencyKeys.key, key),
            eq(idempotencyKeys.userId, userId),
            eq(idempotencyKeys.endpoint, endpoint)
          )
        )
        .catch(err => {
          logger.error({ err, key }, 'Failed to save idempotency response');
        });

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    if (error.code === '23505') { // Unique violation, another request got here first
      return next(new ApiError(409, 'CONFLICT', 'Request is already in progress'));
    }
    next(error);
  }
};
