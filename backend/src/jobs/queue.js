import { Queue } from 'bullmq';
import { createBullMQConnection } from '../config/bullmq.js';
import { logger } from '../utils/logger.js';

/**
 * Shared default job options applied to every job added to any queue.
 *
 * - attempts: 3          → retry up to 3 times on failure
 * - backoff exponential  → 5s, 10s, 20s delays between retries
 * - removeOnComplete     → keep last 100 completed jobs for inspection
 * - removeOnFail         → keep last 200 failed jobs for debugging
 */
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
};

/**
 * emailQueue — handles welcome emails and notification digest emails.
 * Job names processed: 'welcome_email', 'notification_digest', 'notification_digest_cron'
 */
export const emailQueue = new Queue('email', {
  connection: createBullMQConnection(),
  defaultJobOptions,
});

/**
 * cleanupQueue — handles periodic hard-deletion of expired DB records.
 * Job names processed: 'cleanup_expired'
 */
export const cleanupQueue = new Queue('cleanup', {
  connection: createBullMQConnection(),
  defaultJobOptions,
});

emailQueue.on('error', (err) => {
  logger.error({ err }, 'emailQueue error');
});

cleanupQueue.on('error', (err) => {
  logger.error({ err }, 'cleanupQueue error');
});

logger.info('BullMQ queues initialized: [email, cleanup]');
