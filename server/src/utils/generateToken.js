const crypto = require("crypto");

/**
 * Generate a secure random token for email verification / password reset.
 * Returns { rawToken, hashedToken, expires }
 *  - rawToken   → sent to user via email link
 *  - hashedToken → stored in DB (never store raw tokens)
 *  - expires    → token validity window
 */
const generateSecureToken = (expiresInMinutes = 60) => {
  const rawToken    = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires     = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  return { rawToken, hashedToken, expires };
};

/**
 * Hash a raw token (to compare against what's stored in DB)
 */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

module.exports = { generateSecureToken, hashToken };
