import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

let gmailClient = null;

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '***';
  return email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => `${first}***${domain}`);
};

const getGmailClient = () => {
  if (gmailClient) return gmailClient;

  const clientId = process.env.GMAIL_CLIENT_ID ? process.env.GMAIL_CLIENT_ID.trim() : '';
  const clientSecret = process.env.GMAIL_CLIENT_SECRET ? process.env.GMAIL_CLIENT_SECRET.trim() : '';
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN ? process.env.GMAIL_REFRESH_TOKEN.trim() : '';

  const hasClientId = Boolean(clientId);
  const hasClientSecret = Boolean(clientSecret);
  const hasRefreshToken = Boolean(refreshToken);

  console.log(`[GMAIL CONFIG] clientId: ${hasClientId}, clientSecret: ${hasClientSecret}, refreshToken: ${hasRefreshToken}`);

  if (!hasClientId || !hasClientSecret || !hasRefreshToken) {
    const missing = [];
    if (!hasClientId) missing.push('GMAIL_CLIENT_ID');
    if (!hasClientSecret) missing.push('GMAIL_CLIENT_SECRET');
    if (!hasRefreshToken) missing.push('GMAIL_REFRESH_TOKEN');
    throw new Error(`Gmail API configuration missing required environment variable(s): ${missing.join(', ')}`);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
  return gmailClient;
};

export const sendEmail = async ({ to, subject, html }) => {
  const from = process.env.MAIL_FROM || 'Turf Titans <turftitans28@gmail.com>';

  const gmail = getGmailClient();

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
    throw err;
  }
};

export default sendEmail;

