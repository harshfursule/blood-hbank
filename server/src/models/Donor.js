const mongoose = require("mongoose");

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const donorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: { values: BLOOD_GROUPS, message: "{VALUE} is not a valid blood group" },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: String,
      country: { type: String, default: "India" },
    },
    // Medical eligibility fields
    medicalHistory: {
      hasChronicDisease: { type: Boolean, default: false },
      diseases: [String],           // e.g. ["Diabetes", "Hypertension"]
      currentMedications: [String],
      hasTattooOrPiercing: { type: Boolean, default: false },
      tattooDate: Date,             // Must be > 12 months ago to donate
      recentSurgery: { type: Boolean, default: false },
      surgeryDate: Date,
    },
    hemoglobinLevel: {
      type: Number, // g/dL — minimum 12.5 for females, 13.0 for males
      default: null,
    },
    weight: {
      type: Number, // kg — minimum 50kg
      default: null,
    },
    lastDonatedAt: {
      type: Date,
      default: null,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    isEligible: {
      type: Boolean,
      default: true,
    },
    ineligibilityReason: {
      type: String,
      default: null,
    },
    documents: [
      {
        name: String,       // e.g. "Blood Test Report"
        url: String,        // Cloudinary URL
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    donorIdCard: {
      url: String,          // Generated PDF Cloudinary URL
      generatedAt: Date,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
donorSchema.index({ bloodGroup: 1 });
donorSchema.index({ isEligible: 1 });
donorSchema.index({ "address.city": 1 });
donorSchema.index({ lastDonatedAt: 1 });
donorSchema.index({ userId: 1 });

// ─── Virtual: Calculate age ───────────────────────────────────────────────
donorSchema.virtual("age").get(function () {
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// ─── Virtual: Days since last donation ───────────────────────────────────
donorSchema.virtual("daysSinceLastDonation").get(function () {
  if (!this.lastDonatedAt) return null;
  const diff = Date.now() - new Date(this.lastDonatedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ─── Virtual: Next eligible donation date ────────────────────────────────
donorSchema.virtual("nextEligibleDate").get(function () {
  if (!this.lastDonatedAt) return new Date(); // Eligible now
  const next = new Date(this.lastDonatedAt);
  next.setDate(next.getDate() + 56); // 56 days = 8 weeks
  return next;
});

donorSchema.set("toJSON", { virtuals: true });
donorSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Donor", donorSchema);
