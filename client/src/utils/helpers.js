/**
 * Shared utility functions for the frontend
 */

/**
 * Format a date to a readable string
 * @param {string|Date} date
 * @param {object} opts - Intl.DateTimeFormat options
 */
export const formatDate = (date, opts = {}) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    ...opts,
  }).format(new Date(date));
};

/**
 * Calculate age from date of birth
 */
export const calcAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

/**
 * Days between a past date and today
 */
export const daysSince = (date) => {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
};

/**
 * Next eligible donation date (56 days after last donation)
 */
export const nextEligibleDate = (lastDonatedAt) => {
  if (!lastDonatedAt) return new Date();
  const next = new Date(lastDonatedAt);
  next.setDate(next.getDate() + 56);
  return next;
};

/**
 * Days until next eligible donation
 */
export const daysUntilEligible = (lastDonatedAt) => {
  const next = nextEligibleDate(lastDonatedAt);
  const days = Math.ceil((next - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

/**
 * Truncate text with ellipsis
 */
export const truncate = (str, n = 50) =>
  str?.length > n ? str.slice(0, n) + "..." : str;
