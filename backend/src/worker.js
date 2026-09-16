/**
 * worker.js — Standalone BullMQ Worker Process
 *
 * This is an entirely separate process from the Express API server (server.js).
 * It boots no HTTP server, no Socket.IO, no Express app.
 * Its only jobs are:
 *   1. Register BullMQ workers (emailWorker, cleanupWorker)
 *   2. Register repeatable cron job schedulers
 *   3. Handle graceful shutdown on SIGTERM / SIGINT
 *
 * Start it independently:
 *   npm run worker
 *
 * In production, run this as a separate process/container alongside the API.
 */

import 'dotenv/config';
import { logger } from './utils/logger.js';

// Import workers (side-effect: registers each Worker instance on its queue)
import { emailWorker } from './jobs/workers/emailWorker.js';
import { cleanupWorker } from './jobs/workers/cleanupWorker.js';

// Import repeatable job registration
import { registerRepeatableJobs } from './jobs/schedulers/repeatable.js';

const startWorker = async () => {
  try {
    // Register repeatable/cron jobs (idempotent — safe on every boot)
    await registerRepeatableJobs();

    logger.info(
      {
        workers: ['emailWorker (queue: email)', 'cleanupWorker (queue: cleanup)'],
        schedulers: ['digest-daily (08:00 UTC)', 'cleanup-hourly (every hour)'],
      },
      '✅ Worker process started — all workers and schedulers are active'
    );
  } catch (err) {
    logger.error({ err }, 'Worker process failed to start');
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info({ signal }, 'Worker process received shutdown signal — closing workers gracefully');

  try {
    // close() waits for active jobs to finish before closing the connection
    await Promise.all([
      emailWorker.close(),
      cleanupWorker.close(),
    ]);
    logger.info('All workers closed cleanly. Worker process exiting.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during worker shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection in worker process');
  // Do NOT exit — let BullMQ retry logic handle job-level failures
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

startWorker();
