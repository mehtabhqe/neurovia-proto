import logger from "../utils/logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.FROM_EMAIL || "onboarding@resend.dev";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// Send via Resend HTTP API directly — no nodemailer needed
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_your_actual_key_here") {
    logger.warn("Email skipped — RESEND_API_KEY not configured");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${res.status} — ${err}`);
  }

  logger.info(`✉️  Email sent to ${to}: ${subject}`);
}

// ── Booking Confirmation ──
export const sendBookingConfirmation = async (data: {
  bookingNumber: string;
  customerName: string;
  email: string;
  deviceType: string;
  supportType: string;
  issueDescription: string;
}): Promise<void> => {
  try {
    await sendEmail(
      data.email,
      `Booking Confirmed — ${data.bookingNumber} | Neurovia Nexus`,
      `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#111827;color:#fff;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#3B82F6,#6366F1);padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;">Booking Confirmed ✓</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#CBD5E1;">Hi ${data.customerName},</p>
          <p style="color:#CBD5E1;">Your IT support request has been received. Our team will reach out within 30 minutes.</p>
          <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:#3B82F6;">${data.bookingNumber}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#94A3B8;font-size:14px;width:40%;">Device</td><td style="padding:8px 0;color:#fff;font-size:14px;">${data.deviceType}</td></tr>
            <tr><td style="padding:8px 0;color:#94A3B8;font-size:14px;">Support Type</td><td style="padding:8px 0;color:#fff;font-size:14px;text-transform:capitalize;">${data.supportType}</td></tr>
            <tr><td style="padding:8px 0;color:#94A3B8;font-size:14px;">Issue</td><td style="padding:8px 0;color:#fff;font-size:14px;">${data.issueDescription.slice(0, 100)}...</td></tr>
          </table>
        </div>
        <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
          <p style="color:#94A3B8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Neurovia Nexus Pvt. Ltd. | Mumbai, India</p>
        </div>
      </div>
      `
    );
  } catch (error) {
    logger.error("Booking confirmation email failed:", error);
  }
};

// ── Admin Booking Alert ──
export const sendAdminBookingAlert = async (data: {
  bookingNumber: string;
  customerName: string;
  email: string;
  deviceType: string;
  supportType: string;
  issueDescription: string;
}): Promise<void> => {
  if (!ADMIN_EMAIL) return;
  try {
    await sendEmail(
      ADMIN_EMAIL,
      `🔔 New Booking: ${data.bookingNumber}`,
      `
      <div style="font-family:sans-serif;max-width:500px;">
        <h2>New Booking Received</h2>
        <p><strong>Number:</strong> ${data.bookingNumber}</p>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Device:</strong> ${data.deviceType}</p>
        <p><strong>Support Type:</strong> ${data.supportType}</p>
        <p><strong>Issue:</strong> ${data.issueDescription}</p>
      </div>
      `
    );
  } catch (error) {
    logger.error("Admin booking alert email failed:", error);
  }
};

// ── Contact Confirmation ──
export const sendContactConfirmation = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> => {
  try {
    await sendEmail(
      data.email,
      `We received your message | Neurovia Nexus`,
      `
      <div style="font-family:sans-serif;max-width:500px;">
        <h2>Thank you, ${data.name}!</h2>
        <p>We've received your message about "<strong>${data.subject}</strong>" and will respond within 24 hours.</p>
        <p style="color:#666;">Your message:</p>
        <blockquote style="border-left:3px solid #3B82F6;padding-left:12px;color:#444;">${data.message}</blockquote>
        <p>— Neurovia Nexus Team</p>
      </div>
      `
    );
  } catch (error) {
    logger.error("Contact confirmation email failed:", error);
  }
};
