const mongoose = require("mongoose");

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS   = ["Whole Blood", "RBC", "Plasma", "Platelets", "FFP", "Cryoprecipitate"];
const URGENCIES    = ["routine", "urgent", "emergency"];
const STATUSES     = ["pending", "approved", "rejected", "dispatched", "received", "cancelled"];

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "Hospital ID is required"],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Hospital staff user who submitted
      required: true,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: { values: BLOOD_GROUPS, message: "{VALUE} is not a valid blood group" },
    },
    component: {
      type: String,
      required: [true, "Blood component is required"],
      enum: { values: COMPONENTS, message: "{VALUE} is not a valid component" },
      default: "Whole Blood",
    },
    unitsNeeded: {
      type: Number,
      required: [true, "Units needed is required"],
      min: [1, "At least 1 unit is required"],
      max: [50, "Cannot request more than 50 units at once"],
    },
    urgency: {
      type: String,
      enum: { values: URGENCIES, message: "{VALUE} is not a valid urgency level" },
      default: "routine",
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: "{VALUE} is not a valid status" },
      default: "pending",
    },
    // Patient info (optional, for record keeping)
    patientName: {
      type: String,
      default: null,
    },
    patientAge: {
      type: Number,
      default: null,
    },
    diagnosis: {
      type: String,
      default: null,
    },
    // Processing info
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Technician who approved/rejected
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    // Blood units assigned to this request
    assignedUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BloodUnit",
      },
    ],
    // Required by date
    requiredBy: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    // Status history for tracking
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
bloodRequestSchema.index({ hospitalId: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ urgency: 1 });
bloodRequestSchema.index({ bloodGroup: 1 });
bloodRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
