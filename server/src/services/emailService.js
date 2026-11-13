const nodemailer = require("nodemailer");

let transporter = null;

/**
 * Initialize nodemailer transporter.
 * Gracefully skips if SMTP credentials are not configured.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER || process.env.SMTP_USER === "your_email@gmail.com") {
    console.warn("⚠️  Email service not configured (SMTP_USER missing). Emails will be logged to console.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send an email.
 * Falls back to console log in development if SMTP is not configured.
 */
const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();

  if (!transport) {
    // Dev fallback: print email content to console
    console.log("\n📧 ──── EMAIL (dev mode — not sent) ────");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]+>/g, "")}`); // strip HTML tags
    console.log("────────────────────────────────────────\n");
    return;
  }

  await transport.sendMail({
    from: `"BloodBank 🩸" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

// ─── Email Templates ───────────────────────────────────────────────────────────

const sendVerificationEmail = async (to, name, verificationUrl) => {
  await sendEmail({
    to,
    subject: "🩸 Verify your BloodBank account",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
        <h2 style="color:#dc2626">🩸 BloodBank</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Welcome! Please verify your email address to activate your account.</p>
        <a href="${verificationUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
          Verify Email
        </a>
        <p style="color:#64748b;font-size:13px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        <hr style="border-color:#e2e8f0">
        <p style="color:#94a3b8;font-size:12px">BloodBank — Saving lives, one drop at a time.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (to, name, resetUrl) => {
  await sendEmail({
    to,
    subject: "🔐 Reset your BloodBank password",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
        <h2 style="color:#dc2626">🩸 BloodBank</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You requested to reset your password. Click the button below:</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
        <hr style="border-color:#e2e8f0">
        <p style="color:#94a3b8;font-size:12px">BloodBank — Saving lives, one drop at a time.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
