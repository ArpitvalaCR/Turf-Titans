import { Resend } from 'resend';
import nodemailer from 'nodemailer';

let resendClient = null;
let transporter = null;

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '***';
  return email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => `${first}***${domain}`);
};

const getResendClient = () => {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (apiKey) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10000, // 10s timeout
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const from = process.env.MAIL_FROM || 'Turf Titans <onboarding@resend.dev>';

  // 1. Primary: Use Resend HTTPS API if RESEND_API_KEY is configured
  const resend = getResendClient();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (error) {
        console.error(`[EMAIL ERROR] Resend delivery failed for ${maskEmail(to)}:`, error.message || error.name);
        throw new Error(`Email delivery failed: ${error.message || 'Provider error'}`);
      }

      console.log(`[EMAIL] Email sent successfully via Resend to ${maskEmail(to)}`);
      return data;
    } catch (err) {
      console.error(`[EMAIL ERROR] Resend API exception for ${maskEmail(to)}:`, err.message);
      throw err;
    }
  }

  // 2. Fallback: SMTP / Nodemailer (if configured)
  const smtpTransporter = getTransporter();
  if (smtpTransporter) {
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      };
      const info = await smtpTransporter.sendMail(mailOptions);
      console.log(`[EMAIL] Email sent successfully via SMTP to ${maskEmail(to)}`);
      return info;
    } catch (smtpErr) {
      console.error(`[EMAIL ERROR] SMTP delivery failed for ${maskEmail(to)}:`, smtpErr.message);
      throw smtpErr;
    }
  }

  console.warn(`[EMAIL WARN] No email provider configured (RESEND_API_KEY or SMTP_HOST missing). Skipping email delivery to ${maskEmail(to)}`);
  return null;
};

export default sendEmail;
