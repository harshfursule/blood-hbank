const { createError } = require("../utils/createError");

/**
 * authorize — Restrict access to specific roles.
 * Must be used AFTER the `protect` middleware.
 *
 * @param {...string} roles - Allowed roles e.g. ("admin", "technician")
 *
 * @example
 *   router.get("/donors", protect, authorize("admin", "technician"), getDonors);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "Please log in first."));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          403,
          `Access denied. This route is restricted to: ${roles.join(", ")}.`
        )
      );
    }
    next();
  };
};

module.exports = { authorize };
