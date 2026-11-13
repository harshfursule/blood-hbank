const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    // Linked user account (hospital staff login)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    hospitalName: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["government", "private", "trust", "clinic"],
      default: "private",
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    contactInfo: {
      phone: { type: String, required: true },
      alternatePhone: String,
      email: String,
      website: String,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who approved this hospital
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin must approve before hospital can place requests
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    totalRequestsMade: {
      type: Number,
      default: 0,
    },
    totalUnitsFulfilled: {
      type: Number,
      default: 0,
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
hospitalSchema.index({ userId: 1 });
hospitalSchema.index({ isApproved: 1 });
hospitalSchema.index({ licenseNumber: 1 });
hospitalSchema.index({ "address.city": 1 });

module.exports = mongoose.model("Hospital", hospitalSchema);
