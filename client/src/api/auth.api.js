import axiosInstance from "./axiosInstance.js";

/**
 * Register a new user (donor or hospital)
 */
export const registerUser = async (data) => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

/**
 * Verify email with token from the verification link
 */
export const verifyEmail = async (token) => {
  const res = await axiosInstance.get(`/auth/verify-email/${token}`);
  return res.data;
};

/**
 * Login — returns { user, accessToken }
 */
export const loginUser = async ({ email, password }) => {
  const res = await axiosInstance.post("/auth/login", { email, password });
  return res.data; // { success, data: { user, accessToken } }
};

/**
 * Logout — clears httpOnly cookie on server
 */
export const logoutUser = async () => {
  const res = await axiosInstance.post("/auth/logout");
  return res.data;
};

/**
 * Get currently logged-in user's profile
 */
export const getMe = async () => {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
};

/**
 * Request a password reset email
 */
export const forgotPassword = async (email) => {
  const res = await axiosInstance.post("/auth/forgot-password", { email });
  return res.data;
};

/**
 * Reset password using the token from the reset link
 */
export const resetPassword = async (token, password) => {
  const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
  return res.data;
};

/**
 * Update password while logged in
 */
export const updatePassword = async ({ currentPassword, newPassword }) => {
  const res = await axiosInstance.put("/auth/update-password", { currentPassword, newPassword });
  return res.data;
};
