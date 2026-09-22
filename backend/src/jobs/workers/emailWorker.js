import { Worker } from 'bullmq';
import { and, eq, isNull, gte } from 'drizzle-orm';
import { createBullMQConnection } from '../../config/bullmq.js';
import { sendMail } from '../../utils/mailer.js';
import { logger } from '../../utils/logger.js';
import { db } from '../../db/db.js';
import { notifications, users } from '../../db/schema/index.js';

// ─── Email HTML Templates ─────────────────────────────────────────────────────

const welcomeEmailHtml = ({ name }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Project Task Manager</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Project Task Manager</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 16px;">Welcome aboard, ${name}! 🎉</h2>
              <p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">
                Your account has been created successfully. You can now create workspaces, 
                invite your team, and start managing projects and tasks together.
              </p>
              <p style="color:#4a5568;line-height:1.6;margin:0 0 32px;">
                Get started by creating your first workspace from the dashboard.
              </p>
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                   style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;display:inline-block;">
                  Go to Dashboard →
                </a>
              </div>
              <p style="color:#a0aec0;font-size:13px;margin:0;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f7fafc;padding:24px 40px;text-align:center;">
              <p style="color:#a0aec0;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Project Task Manager. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const digestEmailHtml = ({ name, notificationList }) => {
  const rows = notificationList
    .map(
      (n) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
            <span style="display:inline-block;background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;text-transform:uppercase;margin-bottom:4px;">
              ${n.type}
            </span>
            <p style="margin:4px 0 0;color:#4a5568;font-size:14px;line-height:1.5;">
              ${JSON.stringify(n.payload ?? {})}
            </p>
            <p style="margin:4px 0 0;color:#a0aec0;font-size:12px;">
              ${new Date(n.createdAt).toLocaleString()}
            </p>
          </td>
        </tr>
      `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Project Task Manager</h1>
              <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Daily Notification Digest</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 8px;">Hi ${name},</h2>
              <p style="color:#4a5568;line-height:1.6;margin:0 0 24px;">
                You have <strong>${notificationList.length} unread notification${notificationList.length !== 1 ? 's' : ''}</strong> 
                from the last 24 hours.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
              <div style="text-align:center;margin-top:32px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                   style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;display:inline-block;">
                  View All Notifications →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f7fafc;padding:24px 40px;text-align:center;">
              <p style="color:#a0aec0;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Project Task Manager. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const inviteEmailHtml = ({ inviteeName, inviterName, workspaceName, role, acceptUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to ${workspaceName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Project Task Manager</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 16px;">You've been invited! 🎉</h2>
              <p style="color:#4a5568;line-height:1.6;margin:0 0 16px;">
                <strong>${inviterName}</strong> has invited ${inviteeName ? `<strong>${inviteeName}</strong>` : 'you'} to join the workspace
                <strong>&ldquo;${workspaceName}&rdquo;</strong> as a <strong>${role}</strong>.
              </p>
              <p style="color:#4a5568;line-height:1.6;margin:0 0 32px;">
                Click the button below to accept the invitation. This invite link expires in <strong>7 days</strong>.
              </p>
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${acceptUrl}"
                   style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;display:inline-block;">
                  Accept Invitation →
                </a>
              </div>
              <p style="color:#a0aec0;font-size:13px;margin:0;">
                If you were not expecting this invitation, you can safely ignore this email.
                The invite link will expire automatically.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f7fafc;padding:16px 40px;text-align:center;">
              <p style="color:#a0aec0;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Project Task Manager. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Processor ────────────────────────────────────────────────────────────────

/**
 * Handles jobs on the 'email' queue.
 *
 * Supported job names:
 *  - welcome_email             → sends a welcome email to a newly registered user
 *  - workspace_invite_email    → sends a branded invite email with an accept link
 *  - notification_digest_cron  → queries all users with unread notifications in
 *                                the last 24h and sends each a digest email
 */
const processEmailJob = async (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, 'Processing email job');

  // ── welcome_email ──────────────────────────────────────────────────────────
  if (job.name === 'welcome_email') {
    const { name, email } = job.data;

    await sendMail({
      to: email,
      subject: 'Welcome to Project Task Manager! 🎉',
      html: welcomeEmailHtml({ name }),
    });

    logger.info({ jobId: job.id, to: email }, 'welcome_email job completed');
    return { sent: true };
  }

  // ── notification_digest_cron ───────────────────────────────────────────────
  if (job.name === 'notification_digest_cron') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

    // Fetch all unread notifications created in the last 24h, joined with user info
    const rows = await db
      .select({
        userId: notifications.userId,
        userName: users.name,
        userEmail: users.email,
        notifId: notifications.id,
        notifType: notifications.type,
        notifPayload: notifications.payload,
        notifCreatedAt: notifications.createdAt,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .where(
        // unread (readAt IS NULL) AND created within last 24h
        and(isNull(notifications.readAt), gte(notifications.createdAt, since))
      );

    if (rows.length === 0) {
      logger.info({ jobId: job.id }, 'notification_digest_cron: no unread notifications found, skipping');
      return { usersEmailed: 0 };
    }

    // Group rows by userId
    const byUser = rows.reduce((acc, row) => {
      if (!acc[row.userId]) {
        acc[row.userId] = {
          userId: row.userId,
          name: row.userName,
          email: row.userEmail,
          notificationList: [],
        };
      }
      acc[row.userId].notificationList.push({
        type: row.notifType,
        payload: row.notifPayload,
        createdAt: row.notifCreatedAt,
      });
      return acc;
    }, {});

    const userGroups = Object.values(byUser);
    logger.info({ jobId: job.id, userCount: userGroups.length }, 'notification_digest_cron: sending digests');

    // Send digest to each user (sequential to avoid hammering SMTP rate limits)
    let successCount = 0;
    for (const group of userGroups) {
      try {
        await sendMail({
          to: group.email,
          subject: `You have ${group.notificationList.length} unread notification${group.notificationList.length !== 1 ? 's' : ''} — Project Task Manager`,
          html: digestEmailHtml({ name: group.name, notificationList: group.notificationList }),
        });
        successCount++;
      } catch (err) {
        // Log per-user failure but continue — one bad email shouldn't abort all others
        logger.error({ err, userId: group.userId, email: group.email }, 'Failed to send digest email to user');
      }
    }

    logger.info({ jobId: job.id, successCount, total: userGroups.length }, 'notification_digest_cron completed');
    return { usersEmailed: successCount };
  }

  // ── workspace_invite_email ─────────────────────────────────────────────────
  if (job.name === 'workspace_invite_email') {
    const { email, inviteeName, inviterName, workspaceName, role, token } = job.data;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const acceptUrl = `${frontendUrl}/accept-invite?token=${token}`;

    await sendMail({
      to: email,
      subject: `${inviterName} invited you to "${workspaceName}" on Project Task Manager`,
      html: inviteEmailHtml({ inviteeName, inviterName, workspaceName, role, acceptUrl }),
    });

    logger.info({ jobId: job.id, to: email, workspaceName }, 'workspace_invite_email job completed');
    return { sent: true };
  }

  logger.warn({ jobId: job.id, jobName: job.name }, 'emailWorker received unknown job name — skipping');
};

// ─── Worker Instance ──────────────────────────────────────────────────────────

export const emailWorker = new Worker('email', processEmailJob, {
  connection: createBullMQConnection(),
  concurrency: 5,
});

emailWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, jobName: job.name, result }, 'Email job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, jobName: job?.name, err }, 'Email job failed');
});

emailWorker.on('error', (err) => {
  logger.error({ err }, 'emailWorker encountered an error');
});

logger.info('emailWorker registered on queue: email');
