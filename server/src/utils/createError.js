/**
 * Utility: Create a custom API error with a status code.
 * Throw this from controllers to trigger the global error handler.
 *
 * @example
 *   throw createError(404, "Donor not found");
 */
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { createError };
