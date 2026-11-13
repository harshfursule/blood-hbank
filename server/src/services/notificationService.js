const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");

/**
 * Core helper to create an in-app notification (and dispatch email if configured)
 */
const notifyUser = async ({
  userId,
  title,
  message,
  type = "general",
  channel = "in-app",
  relatedEntity = null,
  recipientEmail = null,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      channel,
      relatedEntity,
    });

    // If channel includes email and recipient email is provided
    if ((channel === "email" || channel === "all") && recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: `🩸 BloodBank: ${title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
            <h2 style="color:#dc2626;margin-top:0">🩸 BloodBank Alert</h2>
            <h3 style="color:#1e293b">${title}</h3>
            <p style="color:#475569;line-height:1.6">${message}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
            <p style="color:#94a3b8;font-size:12px">BloodBank Automated Notification System</p>
          </div>
        `,
      }).catch((err) => {
        console.warn("⚠️ Notification email failed to send:", err.message);
      });
    }

    return notification;
  } catch (err) {
    console.error("❌ Failed to create notification:", err.message);
    return null;
  }
};

module.exports = { notifyUser };
