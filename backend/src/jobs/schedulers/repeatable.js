import { emailQueue, cleanupQueue } from '../queue.js';
import { logger } from '../../utils/logger.js';

/**
 * Registers all repeatable (cron) jobs using BullMQ's upsertJobScheduler API.
 *
 * upsertJobScheduler is idempotent — safe to call on every worker boot.
 * If a scheduler with the same key already exists it will be updated, not duplicated.
 *
 * Schedules:
 *  - digest-daily:    daily at 08:00 UTC → fans out digest email to all users
 *                     with unread notifications from the last 24h
 *  - cleanup-hourly:  every hour → hard-deletes expired idempotency_keys
 *                     and revoked/expired refresh_tokens
 */
export const registerRepeatableJobs = async () => {
  // ── Daily Digest — 08:00 UTC every day ──────────────────────────────────────
  await emailQueue.upsertJobScheduler(
    'digest-daily',                  // unique scheduler key (idempotent)
    { pattern: '0 8 * * *' },        // cron: 08:00 UTC daily
    {
      name: 'notification_digest_cron',
      data: {},                       // no payload needed — worker fans out to all users
      opts: {
        attempts: 2,                  // digest cron: fewer retries (non-critical)
        backoff: { type: 'fixed', delay: 60000 }, // 1 min delay between attempts
        removeOnComplete: { count: 30 },
        removeOnFail: { count: 30 },
      },
    }
  );

  logger.info(
    { scheduler: 'digest-daily', cron: '0 8 * * *' },
    'Registered repeatable job: notification_digest_cron'
  );

  // ── Hourly Cleanup — top of every hour ─────────────────────────────────────
  await cleanupQueue.upsertJobScheduler(
    'cleanup-hourly',                // unique scheduler key (idempotent)
    { pattern: '0 * * * *' },        // cron: every hour on the hour
    {
      name: 'cleanup_expired',
      data: {},
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { count: 48 }, // keep ~2 days of hourly history
        removeOnFail: { count: 48 },
      },
    }
  );

  logger.info(
    { scheduler: 'cleanup-hourly', cron: '0 * * * *' },
    'Registered repeatable job: cleanup_expired'
  );

  logger.info('All repeatable BullMQ job schedulers registered');
};
