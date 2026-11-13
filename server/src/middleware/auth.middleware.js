const { verifyAccessToken } = require("../utils/tokenHelper");
const { createError }       = require("../utils/createError");
const User                  = require("../models/User");

/**
 * protect — Middleware to verify JWT access token.
 * Attaches `req.user` to the request if valid.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createError(401, "No token provided. Please log in."));
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.id).select("-passwordHash -refreshToken");
    if (!user) {
      return next(createError(401, "User belonging to this token no longer exists."));
    }
    if (!user.isActive) {
      return next(createError(403, "Your account has been deactivated. Contact support."));
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(err); // Passes JWT errors to global error handler
  }
};

/**
 * optionalAuth — Attaches req.user if a valid token exists, but doesn't block.
 * Useful for routes that behave differently for logged-in users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token   = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const user    = await User.findById(decoded.id).select("-passwordHash -refreshToken");
      if (user && user.isActive) req.user = user;
    }
  } catch {
    // Ignore token errors for optional auth
  }
  next();
};

module.exports = { protect, optionalAuth };
