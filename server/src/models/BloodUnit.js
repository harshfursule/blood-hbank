const mongoose = require("mongoose");

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS   = ["Whole Blood", "RBC", "Plasma", "Platelets", "FFP", "Cryoprecipitate"];
const STATUSES     = ["available", "reserved", "used", "expired", "discarded", "quarantine"];

const bloodUnitSchema = new mongoose.Schema(
  {
    bagId: {
      type: String,
      required: [true, "Bag ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
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
    volumeMl: {
      type: Number,
      required: [true, "Volume is required"],
      min: [100, "Volume must be at least 100ml"],
      max: [500, "Volume cannot exceed 500ml"],
      default: 450,
    },
    collectedAt: {
      type: Date,
      required: [true, "Collection date is required"],
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: "{VALUE} is not a valid status" },
      default: "available",
    },
    // Donor who gave this unit
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      default: null,
    },
    // Technician who collected
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Storage info
    storageLocation: {
      unit: String,   // e.g., "Refrigerator A"
      shelf: String,  // e.g., "Shelf 3"
    },
    // QR code
    qrCodeUrl: {
      type: String,
      default: null,
    },
    // Screening & testing
    screeningResults: {
      hiv: { type: Boolean, default: null },     // null = not yet tested
      hepatitisB: { type: Boolean, default: null },
      hepatitisC: { type: Boolean, default: null },
      syphilis: { type: Boolean, default: null },
      malaria: { type: Boolean, default: null },
      testedAt: Date,
      testedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // If reserved or used, link to the request
    reservedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      default: null,
    },
    discardReason: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
bloodUnitSchema.index({ bloodGroup: 1, status: 1 });
bloodUnitSchema.index({ expiresAt: 1 });
bloodUnitSchema.index({ bagId: 1 });
bloodUnitSchema.index({ component: 1 });
bloodUnitSchema.index({ status: 1 });
bloodUnitSchema.index({ donorId: 1 });

// ─── Virtual: Days until expiry ──────────────────────────────────────────
bloodUnitSchema.virtual("daysUntilExpiry").get(function () {
  const diff = new Date(this.expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ─── Virtual: Is expired ─────────────────────────────────────────────────
bloodUnitSchema.virtual("isExpired").get(function () {
  return new Date(this.expiresAt) < new Date();
});

bloodUnitSchema.set("toJSON", { virtuals: true });
bloodUnitSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("BloodUnit", bloodUnitSchema);
