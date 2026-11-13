const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: [true, "Donor ID is required"],
    },
    bloodUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodUnit",
      required: [true, "Blood unit ID is required"],
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Technician ID is required"],
    },
    donatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    volumeMl: {
      type: Number,
      required: true,
      min: 100,
      max: 500,
      default: 450,
    },
    // Pre-donation vitals
    preVitals: {
      hemoglobin: Number,  // g/dL
      bloodPressure: String, // e.g., "120/80"
      pulse: Number,       // bpm
      temperature: Number, // °C
      weight: Number,      // kg
    },
    // Donation status
    status: {
      type: String,
      enum: ["successful", "deferred", "incomplete"],
      default: "successful",
    },
    deferralReason: {
      type: String, // If status = "deferred"
      default: null,
    },
    donationCenter: {
      type: String, // Location/camp where donation happened
      default: "Main Blood Bank",
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
donationSchema.index({ donorId: 1 });
donationSchema.index({ donatedAt: -1 });
donationSchema.index({ technicianId: 1 });

module.exports = mongoose.model("Donation", donationSchema);
