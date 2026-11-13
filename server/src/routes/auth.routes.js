const express = require("express");
const router  = express.Router();

const {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require("../controllers/auth.controller");

const { protect }   = require("../middleware/auth.middleware");
const rateLimit     = require("express-rate-limit");

// ─── Rate limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // Max 10 attempts per window
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: "Too many password reset requests. Try again in 1 hour." },
});

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post("/register",          authLimiter,   register);
router.get ("/verify-email/:token",              verifyEmail);
router.post("/login",             authLimiter,   login);
router.post("/refresh-token",                    refreshToken);
router.post("/forgot-password",   forgotLimiter, forgotPassword);
router.post("/reset-password/:token",            resetPassword);

// ─── Protected Routes (require login) ────────────────────────────────────────
router.get ("/me",                protect, getMe);
router.post("/logout",            protect, logout);
router.put ("/update-password",   protect, updatePassword);

module.exports = router;
