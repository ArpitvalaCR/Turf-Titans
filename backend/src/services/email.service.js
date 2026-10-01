import { sendEmail } from '../utils/email.js';

const formatEventDetails = (event) => {
  if (!event) return '';
  return `
    <p><strong>Event:</strong> ${event.title || 'General inquiry'}</p>
    <p><strong>Sport:</strong> ${event.sport || 'N/A'}</p>
    <p><strong>Venue:</strong> ${event.venue || 'N/A'}</p>
  `;
};

export const sendRegistrationSubmittedEmail = async (registration, event) =>
  sendEmail({
    to: registration.captainEmail,
    subject: `Turf Titans — Registration Submitted (Awaiting Verification) — ${registration.teamName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080e1e; color: #ffffff; padding: 32px 24px; border-radius: 16px; border: 1px solid #74c004;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #74c004; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">TURF TITANS</h1>
          <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">TOURNAMENT REGISTRATION SYSTEM</p>
        </div>
        
        <div style="background: #0f182e; padding: 22px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
          <div style="display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
            Registration Received • Awaiting Verification
          </div>
          <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 18px; font-weight: 800;">Registration Submitted Successfully</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            Dear Captain <strong>${registration.captainName}</strong>,
          </p>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
            Your squad registration for <strong>${registration.teamName}</strong> has been successfully received by the Turf Titans tournament administration.
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">Registration ID:</td>
              <td style="padding: 10px 0; color: #74c004; font-weight: 800; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">${registration.registrationId || registration._id}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">Team Name:</td>
              <td style="padding: 10px 0; color: #ffffff; font-weight: 700; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">${registration.teamName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">Captain:</td>
              <td style="padding: 10px 0; color: #ffffff; font-weight: 700; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">${registration.captainName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">Status:</td>
              <td style="padding: 10px 0; color: #f59e0b; font-weight: 800; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">PENDING ADMIN VERIFICATION</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8;">Squad Size:</td>
              <td style="padding: 10px 0; color: #ffffff; font-weight: 600; text-align: right;">${registration.players?.length || 12} Players (11 Playing + 1 Substitute)</td>
            </tr>
          </table>
        </div>
        
        <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 24px;">
          <p style="color: #f59e0b; font-size: 13px; font-weight: 800; margin: 0 0 6px 0; text-transform: uppercase;">
            Next Steps & Important Information:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
            <li>Your payment details and player roster have been submitted for admin verification.</li>
            <li>Your team is <strong>NOT yet approved</strong>.</li>
            <li>The tournament administrators will review and verify your transaction proof and roster.</li>
            <li>Once approved, you will receive a separate <strong>Official Confirmation Email</strong> with your tournament seed and group draw details.</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #64748b; font-size: 11px; margin: 0;">
            This is an automated notification from Turf Titans Tournament Administration.<br/>
            Please keep your Registration ID for future correspondence.
          </p>
        </div>
      </div>
    `,
  });

export const sendRegistrationApprovedEmail = async (registration, event) =>
  sendEmail({
    to: registration.captainEmail,
    subject: `Turf Titans — Registration Approved (${registration.teamName})`,
    html: `
      <h2>Registration Approved & Confirmed!</h2>
      <p>Hi <strong>${registration.captainName}</strong>,</p>
      <p>Great news! Your squad registration for <strong>${registration.teamName}</strong> has been officially verified and approved by the Tournament Administration.</p>
      <div style="background: #f4f6f8; padding: 12px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Registration ID:</strong> ${registration.registrationId || registration._id}</p>
        <p style="margin: 4px 0;"><strong>Team Name:</strong> ${registration.teamName}</p>
        <p style="margin: 4px 0;"><strong>Captain:</strong> ${registration.captainName}</p>
      </div>
      ${formatEventDetails(event)}
      <p>Your team is now eligible for tournament group draws and official match fixtures.</p>
      <p>See you on the turf!</p>
      <p>— Turf Titans Administration</p>
    `,
  });

export const sendRegistrationRejectedEmail = async (registration, event) =>
  sendEmail({
    to: registration.captainEmail,
    subject: 'Turf Titans — Registration Update',
    html: `
      <h2>Registration Update</h2>
      <p>Hi ${registration.captainName},</p>
      <p>Unfortunately, your registration for <strong>${registration.teamName}</strong> could not be approved.</p>
      ${registration.rejectionReason ? `<p><strong>Reason:</strong> ${registration.rejectionReason}</p>` : ''}
      ${formatEventDetails(event)}
      <p>Contact us if you have questions.</p>
      <p>— Turf Titans</p>
    `,
  });

export const sendPaymentVerifiedEmail = async (registration, event) =>
  sendEmail({
    to: registration.captainEmail,
    subject: 'Turf Titans — Payment Verified',
    html: `
      <h2>Payment Verified</h2>
      <p>Hi ${registration.captainName},</p>
      <p>Your payment for <strong>${registration.teamName}</strong> has been verified.</p>
      ${formatEventDetails(event)}
      <p>— Turf Titans</p>
    `,
  });

export const sendPaymentRejectedEmail = async (registration, event, reason) =>
  sendEmail({
    to: registration.captainEmail,
    subject: 'Turf Titans — Payment Issue',
    html: `
      <h2>Payment Not Verified</h2>
      <p>Hi ${registration.captainName},</p>
      <p>We could not verify the payment for <strong>${registration.teamName}</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${formatEventDetails(event)}
      <p>Please resubmit or contact us for help.</p>
      <p>— Turf Titans</p>
    `,
  });
