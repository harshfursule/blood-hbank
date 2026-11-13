const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g. "BLOOD_UNIT_STATUS_CHANGED", "REQUEST_APPROVED", "DONOR_CREATED"
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["User", "Donor", "BloodUnit", "BloodRequest", "Dispatch", "Donation", "Hospital"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Snapshot of changes: { field: { from: oldValue, to: newValue } }
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No timestamps plugin — we use our own 'timestamp' field
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
