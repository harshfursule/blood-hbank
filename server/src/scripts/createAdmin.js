/**
 * Seed Script — Creates the first Admin user.
 * Run once: node src/scripts/createAdmin.js
 *
 * Usage:
 *   cd server
 *   node src/scripts/createAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("../models/User");

const ADMIN = {
  name:         "Super Admin",
  email:        "admin@bloodbank.com",
  phone:        "+919999999999",
  passwordHash: "Admin@123",      // Change this after first login!
  role:         "admin",
  isVerified:   true,             // Admin is pre-verified
  isActive:     true,
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      console.log("⚠️  Admin already exists:", existing.email);
      process.exit(0);
    }

    const admin = await User.create(ADMIN);
    console.log("\n🎉 Admin created successfully!");
    console.log("──────────────────────────────");
    console.log("  Email:    ", ADMIN.email);
    console.log("  Password: ", "Admin@123");
    console.log("  Role:     ", admin.role);
    console.log("──────────────────────────────");
    console.log("⚠️  Please change the password after first login!\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
