const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "donor", "hospital", "technician"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: { values: ROLES, message: "{VALUE} is not a valid role" },
      default: "donor",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    profileImage: {
      type: String, // Cloudinary URL
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─── Pre-save hook: Hash password before saving ────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ─── Instance method: Compare passwords ───────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Transform output: Remove sensitive fields from JSON responses ─────────
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.refreshToken;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
