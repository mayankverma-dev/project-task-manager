import nodemailer from 'nodemailer';
import { logger } from './logger.js';

/**
 * Lazily-created Nodemailer transporter singleton.
 * Built from SMTP_* environment variables.
 * Returns null if credentials are not configured (dev without real SMTP).
 */
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    logger.warn(
      'SMTP credentials are not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). ' +
      'Emails will be skipped. Set these env vars to enable real email sending.'
    );
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465, // true only for port 465
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return _transporter;
};

/**
 * Sends an email via SMTP.
 *
 * @param {object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html    - HTML body of the email
 *
 * Fail-open: if SMTP is not configured, logs a warning and returns without throwing.
 * This ensures a missing SMTP config never crashes the worker process.
 */
export const sendMail = async ({ to, subject, html }) => {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn({ to, subject }, 'Email skipped — no SMTP transporter configured');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    logger.info({ to, subject, messageId: info.messageId }, 'Email sent successfully');
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    throw err; // Re-throw so BullMQ can apply retry logic
  }
};
