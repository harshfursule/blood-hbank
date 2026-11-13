const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "low_stock",
        "eligibility_reminder",
        "request_approved",
        "request_rejected",
        "dispatch_confirmed",
        "unit_expiring",
        "emergency_alert",
        "general",
      ],
      default: "general",
    },
    channel: {
      type: String,
      enum: ["email", "sms", "in-app", "all"],
      default: "in-app",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Link to related entity
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["BloodRequest", "BloodUnit", "Donation", "Dispatch", null],
        default: null,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    isFailed: {
      type: Boolean,
      default: false,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ sentAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
