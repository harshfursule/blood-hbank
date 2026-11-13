const mongoose = require("mongoose");

const dispatchSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: [true, "Request ID is required"],
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Technician who dispatched
      required: true,
    },
    bloodUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BloodUnit",
        required: true,
      },
    ],
    unitCount: {
      type: Number,
      required: true,
    },
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    receivedBy: {
      type: String, // Name of hospital staff who signed for receipt
      default: null,
    },
    // Delivery info
    deliveryMethod: {
      type: String,
      enum: ["pickup", "courier", "ambulance"],
      default: "pickup",
    },
    trackingNumber: {
      type: String, // For courier delivery
      default: null,
    },
    status: {
      type: String,
      enum: ["dispatched", "in-transit", "received", "returned"],
      default: "dispatched",
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
dispatchSchema.index({ requestId: 1 });
dispatchSchema.index({ dispatchedAt: -1 });
dispatchSchema.index({ status: 1 });

module.exports = mongoose.model("Dispatch", dispatchSchema);
