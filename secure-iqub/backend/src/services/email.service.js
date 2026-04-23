'use strict';

/**
 * Email Service — Secure Iqub
 *
 * Sends transactional emails using nodemailer.
 * If SMTP is not configured (EMAIL_HOST not set in .env), logs emails to console
 * so the app works in development without a real mail server.
 *
 * Add to .env to enable real sending:
 *   EMAIL_HOST=smtp.example.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=you@example.com
 *   EMAIL_PASS=yourpassword
 *   EMAIL_FROM="Secure Iqub <no-reply@secureiqub.com>"
 */

const logger = require('../utils/logger');

// Lazily require nodemailer so the app doesn't crash if it's not installed yet
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

// ── Transporter ───────────────────────────────────────────────────────────────

let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;
  if (!nodemailer) return null;
  if (!process.env.EMAIL_HOST) return null;

  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
};

// ── Template helpers ──────────────────────────────────────────────────────────

/**
 * Replace {{placeholders}} in a template string with actual values.
 * @param {string} template
 * @param {Record<string, string>} vars
 */
const renderTemplate = (template, vars) => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
};

// ── HTML email templates ───────────────────────────────────────────────────────

const TEMPLATES = {
  /**
   * Sent to a newly approved admin when their account is created.
   * Placeholders: {{fullName}}, {{email}}, {{temporaryPassword}}, {{approvedBy}}, {{loginUrl}}
   */
  WELCOME_ADMIN: {
    subject: 'Welcome to Secure-Iqub — Your Admin Access Is Ready',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a237e,#1565c0);padding:32px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:28px;font-weight:700;">Secure Iqub</h1>
              <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px;">Community-Powered Rotating Savings Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#333;font-size:16px;margin:0 0 16px;">Hello <strong>{{fullName}}</strong>,</p>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Welcome to <strong>Secure-Iqub</strong>! You have been granted admin access by
                <strong>{{approvedBy}}</strong> to manage your own Iqub (እቁብ) members and groups.
              </p>

              <!-- Credentials box -->
              <div style="background:#f0f4ff;border-left:4px solid #1565c0;border-radius:8px;padding:20px;margin:0 0 24px;">
                <p style="margin:0 0 12px;font-weight:700;color:#1a237e;font-size:14px;text-transform:uppercase;letter-spacing:.5px;">Your Login Details</p>
                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Email:</strong> {{email}}</p>
                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Temporary Password:</strong>
                  <code style="background:#e8eaf6;padding:3px 8px;border-radius:4px;font-size:13px;">{{temporaryPassword}}</code>
                </p>
              </div>

              <div style="background:#fff8e1;border:1px solid #ffd54f;border-radius:8px;padding:16px;margin:0 0 24px;">
                <p style="margin:0;font-size:13px;color:#e65100;">
                  ⚠️ <strong>Important:</strong> Please log in and change your password immediately after your first login.
                </p>
              </div>

              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Once you log in, you can:
              </p>
              <ul style="color:#555;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
                <li>Create your Iqub group</li>
                <li>Register and invite members</li>
                <li>Build shared contribution slots</li>
                <li>Manage monthly payments</li>
                <li>Run the monthly Lucky Spin</li>
              </ul>

              <!-- CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="{{loginUrl}}" style="background:linear-gradient(135deg,#1a237e,#1565c0);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block;">
                  Log In to Secure-Iqub →
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                Secure-Iqub Team · Community-Powered Rotating Savings<br>
                If you did not request this access, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  },

  /**
   * Confirmation sent to someone who submitted a leader application.
   * Placeholders: {{fullName}}
   */
  APPLICATION_RECEIVED: {
    subject: 'We received your Iqub Leader application',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a237e,#1565c0);padding:28px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">Application Received</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="color:#333;font-size:16px;margin:0 0 16px;">Hello <strong>{{fullName}}</strong>,</p>
            <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">
              Thank you for your interest in becoming a Secure-Iqub Leader (እቁብ ሃላፊ).
              We have received your application and our team will review it shortly.
            </p>
            <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">
              You will hear from us via your preferred contact method once your application is reviewed.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:16px 36px;border-top:1px solid #eee;text-align:center;">
            <p style="color:#aaa;font-size:12px;margin:0;">Secure-Iqub Team</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  },
};

// ── Send function ─────────────────────────────────────────────────────────────

/**
 * Send an email.
 * @param {{ to: string, templateKey: string, vars: Record<string, string> }} opts
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
const sendEmail = async ({ to, templateKey, vars }) => {
  const template = TEMPLATES[templateKey];
  if (!template) {
    const msg = `Unknown email template: ${templateKey}`;
    logger.error(msg);
    return { success: false, error: msg };
  }

  const subject = renderTemplate(template.subject, vars);
  const html = renderTemplate(template.html, vars);

  const transporter = getTransporter();

  if (!transporter) {
    // Development fallback: log to console instead of sending
    logger.info('📧 [EMAIL MOCK — no SMTP configured]');
    logger.info(`   To: ${to}`);
    logger.info(`   Subject: ${subject}`);
    logger.info(`   Vars: ${JSON.stringify(vars)}`);
    return { success: true, messageId: 'mock-no-smtp' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Secure Iqub" <no-reply@secureiqub.com>',
      to,
      subject,
      html,
    });
    logger.info(`📧 Email sent to ${to} [${templateKey}] — messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`📧 Email send failed to ${to} [${templateKey}]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ── Convenience wrappers ──────────────────────────────────────────────────────

/**
 * Send the welcome email to a newly approved admin.
 */
const sendAdminWelcomeEmail = async ({ to, fullName, email, temporaryPassword, approvedBy }) => {
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:4200'}/auth/login`;
  return sendEmail({
    to,
    templateKey: 'WELCOME_ADMIN',
    vars: { fullName, email, temporaryPassword, approvedBy, loginUrl },
  });
};

/**
 * Send an application-received confirmation to a leader applicant.
 */
const sendApplicationConfirmation = async ({ to, fullName }) => {
  return sendEmail({ to, templateKey: 'APPLICATION_RECEIVED', vars: { fullName } });
};

module.exports = {
  sendEmail,
  sendAdminWelcomeEmail,
  sendApplicationConfirmation,
  TEMPLATES,
};
