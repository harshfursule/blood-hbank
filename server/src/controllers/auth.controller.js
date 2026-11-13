const User                                          = require("../models/User");
const { createError }                               = require("../utils/createError");
const { generateSecureToken, hashToken }            = require("../utils/generateToken");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/tokenHelper");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

// ─── Helper: Build safe user object for response ───────────────────────────────
const sanitizeUser = (user) => ({
  _id:          user._id,
  name:         user.name,
  email:        user.email,
  phone:        user.phone,
  role:         user.role,
  isVerified:   user.isVerified,
  profileImage: user.profileImage,
  createdAt:    user.createdAt,
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, phone, password, role }
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return next(createError(400, "Please provide name, email, phone, and password."));
    }

    // Only allow public self-registration as donor or hospital
    const allowedRoles = ["donor", "hospital"];
    const assignedRole = allowedRoles.includes(role) ? role : "donor";

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(createError(409, "An account with this email already exists."));
    }

    // Generate email verification token
    const { rawToken, hashedToken, expires } = generateSecureToken(24 * 60); // 24 hours

    // In development mode, auto-verify accounts so you don't need real emails locally
    const isDev = process.env.NODE_ENV !== "production";

    // Create user (password is hashed by pre-save hook in User model)
    const user = await User.create({
      name,
      email:                    email.toLowerCase(),
      phone,
      passwordHash:             password,
      role:                     assignedRole,
      isVerified:               isDev ? true : false,
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: expires,
    });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
    await sendVerificationEmail(user.email, user.name, verificationUrl);

    res.status(201).json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
      data: { user: sanitizeUser(user) },
    });
  } catch (err) {
    next(err);
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
/**
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = hashToken(req.params.token);

    const user = await User.findOne({
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(createError(400, "Verification link is invalid or has expired."));
    }

    // Mark as verified and clear token fields
    user.isVerified                 = true;
    user.emailVerificationToken     = undefined;
    user.emailVerificationExpires   = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, "Please provide email and password."));
    }

    // Find user and explicitly select passwordHash (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return next(createError(401, "Invalid email or password."));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(401, "Invalid email or password."));
    }

    // Check account status
    if (!user.isActive) {
      return next(createError(403, "Your account has been deactivated. Contact support."));
    }

    // Check email verification (only in production)
    const isDev = process.env.NODE_ENV !== "production";
    if (!user.isVerified && user.role !== "admin" && !isDev) {
      return next(
        createError(403, "Please verify your email before logging in. Check your inbox.")
      );
    }

    // Generate tokens
    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store hashed refresh token in DB
    user.refreshToken = refreshToken;
    user.lastLoginAt  = new Date();
    await user.save({ validateBeforeSave: false });

    // Set refresh token in httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: {
        user:        sanitizeUser(user),
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
/**
 * POST /api/auth/refresh-token
 * Reads refresh token from httpOnly cookie
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return next(createError(401, "No refresh token. Please log in again."));
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(token);

    // Find user with matching refresh token
    const user = await User.findOne({ _id: decoded.id, refreshToken: token });
    if (!user) {
      return next(createError(401, "Invalid refresh token. Please log in again."));
    }

    // Rotate tokens
    const newAccessToken  = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success:     true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/logout
 * Requires: protect middleware
 */
const logout = async (req, res, next) => {
  try {
    // Clear refresh token from DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    // Clear cookie
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
/**
 * GET /api/auth/me
 * Requires: protect middleware
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: sanitizeUser(req.user) },
    });
  } catch (err) {
    next(err);
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(createError(400, "Please provide your email."));

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always send success (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const { rawToken, hashedToken, expires } = generateSecureToken(60); // 1 hour

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = expires;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
/**
 * POST /api/auth/reset-password/:token
 * Body: { password }
 */
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return next(createError(400, "Password must be at least 6 characters."));
    }

    const hashedToken = hashToken(req.params.token);

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(createError(400, "Password reset link is invalid or has expired."));
    }

    // Update password
    user.passwordHash         = password; // pre-save hook will hash it
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken         = null; // Force re-login on all devices
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in with your new password.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE PASSWORD (when logged in) ────────────────────────────────────────
/**
 * PUT /api/auth/update-password
 * Requires: protect middleware
 * Body: { currentPassword, newPassword }
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(createError(400, "Please provide current and new password."));
    }
    if (newPassword.length < 6) {
      return next(createError(400, "New password must be at least 6 characters."));
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(createError(401, "Current password is incorrect."));
    }

    user.passwordHash = newPassword;
    user.refreshToken = null;
    await user.save();

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Password updated. Please log in again.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
};
