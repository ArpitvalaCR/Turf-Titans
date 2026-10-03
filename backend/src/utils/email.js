import { google } from 'googleapis';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

let gmailClient = null;
let resendClient = null;
let transporter = null;

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '***';
  return email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => `${first}***${domain}`);
};

const getGmailClient = () => {
  if (gmailClient) return gmailClient;

  const clientId = process.env.GMAIL_CLIENT_ID ? process.env.GMAIL_CLIENT_ID.trim() : '';
  const clientSecret = process.env.GMAIL_CLIENT_SECRET ? process.env.GMAIL_CLIENT_SECRET.trim() : '';
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN ? process.env.GMAIL_REFRESH_TOKEN.trim() : '';

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
  return gmailClient;
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
  const from = process.env.MAIL_FROM || 'Turf Titans <turftitans28@gmail.com>';
  let lastError = null;
  let attemptedProvider = false;

  // 1. Primary: Gmail API over HTTPS (OAuth2)
  const gmail = getGmailClient();
  if (gmail) {
    attemptedProvider = true;
    try {
      const mail = new MailComposer({
        from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      });
      const messageBuffer = await mail.compile().build();
      const raw = messageBuffer.toString('base64url');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      console.log(`[EMAIL] Email sent successfully via Gmail API to ${maskEmail(to)}`);
      return response.data;
    } catch (err) {
      console.error(`[EMAIL ERROR] Gmail API delivery failed for ${maskEmail(to)}:`, err.message || err.name);
      lastError = err;
    }
  }

  // 2. Fallback: Resend HTTPS API (if RESEND_API_KEY is configured)
  const resend = getResendClient();
  if (resend) {
    attemptedProvider = true;
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (error) {
        console.error(`[EMAIL ERROR] Resend delivery failed for ${maskEmail(to)}:`, error.message || error.name);
        lastError = new Error(`Email delivery failed: ${error.message || 'Provider error'}`);
      } else {
        console.log(`[EMAIL] Email sent successfully via Resend to ${maskEmail(to)}`);
        return data;
      }
    } catch (err) {
      console.error(`[EMAIL ERROR] Resend API exception for ${maskEmail(to)}:`, err.message || err.name);
      lastError = err;
    }
  }

  // 3. Fallback: SMTP / Nodemailer (if configured)
  const smtpTransporter = getTransporter();
  if (smtpTransporter) {
    attemptedProvider = true;
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || process.env.SMTP_USER || from,
        to,
        subject,
        html,
      };
      const info = await smtpTransporter.sendMail(mailOptions);
      console.log(`[EMAIL] Email sent successfully via SMTP to ${maskEmail(to)}`);
      return info;
    } catch (smtpErr) {
      console.error(`[EMAIL ERROR] SMTP delivery failed for ${maskEmail(to)}:`, smtpErr.message || smtpErr.name);
      lastError = smtpErr;
    }
  }

  if (attemptedProvider && lastError) {
    throw lastError;
  }

  console.warn(`[EMAIL WARN] No email provider configured (GMAIL_*, RESEND_API_KEY, or SMTP_HOST missing). Skipping email delivery to ${maskEmail(to)}`);
  return null;
};

export default sendEmail;
