import { Worker } from 'bullmq';
import { lt, or, isNotNull } from 'drizzle-orm';
import { createBullMQConnection } from '../../config/bullmq.js';
import { logger } from '../../utils/logger.js';
import { db } from '../../db/db.js';
import { idempotencyKeys, refreshTokens } from '../../db/schema/index.js';

// ─── Processor ────────────────────────────────────────────────────────────────

/**
 * Handles jobs on the 'cleanup' queue.
 *
 * Supported job names:
 *  - cleanup_expired → hard-deletes:
 *      1. idempotency_keys where expires_at < NOW()
 *      2. refresh_tokens where revoked_at IS NOT NULL OR expires_at < NOW()
 */
const processCleanupJob = async (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, 'Processing cleanup job');

  if (job.name === 'cleanup_expired') {
    const now = new Date();

    // ── 1. Expired idempotency keys ──────────────────────────────────────────
    const deletedIdempotencyKeys = await db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.expiresAt, now))
      .returning({ id: idempotencyKeys.id });

    logger.info(
      { jobId: job.id, count: deletedIdempotencyKeys.length },
      'Cleaned up expired idempotency_keys'
    );

    // ── 2. Revoked or expired refresh tokens ─────────────────────────────────
    const deletedRefreshTokens = await db
      .delete(refreshTokens)
      .where(
        or(
          isNotNull(refreshTokens.revokedAt),   // already revoked
          lt(refreshTokens.expiresAt, now)       // naturally expired
        )
      )
      .returning({ id: refreshTokens.id });

    logger.info(
      { jobId: job.id, count: deletedRefreshTokens.length },
      'Cleaned up expired/revoked refresh_tokens'
    );

    const result = {
      idempotencyKeysDeleted: deletedIdempotencyKeys.length,
      refreshTokensDeleted: deletedRefreshTokens.length,
    };

    logger.info({ jobId: job.id, result }, 'cleanup_expired job completed');
    return result;
  }

  logger.warn({ jobId: job.id, jobName: job.name }, 'cleanupWorker received unknown job name — skipping');
};

// ─── Worker Instance ──────────────────────────────────────────────────────────

export const cleanupWorker = new Worker('cleanup', processCleanupJob, {
  connection: createBullMQConnection(),
  concurrency: 1, // cleanup should never run in parallel — prevents double deletes
});

cleanupWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, jobName: job.name, result }, 'Cleanup job completed');
});

cleanupWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, jobName: job?.name, err }, 'Cleanup job failed');
});

cleanupWorker.on('error', (err) => {
  logger.error({ err }, 'cleanupWorker encountered an error');
});

logger.info('cleanupWorker registered on queue: cleanup');
