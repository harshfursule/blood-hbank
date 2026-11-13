import axiosInstance from "./axiosInstance.js";

// ── Donor self-service ────────────────────────────────────────────────────────

export const registerDonor = async (data) => {
  const res = await axiosInstance.post("/donors/register", data);
  return res.data;
};

export const getMyDonorProfile = async () => {
  const res = await axiosInstance.get("/donors/me");
  return res.data;
};

export const updateMyDonorProfile = async (data) => {
  const res = await axiosInstance.put("/donors/me", data);
  return res.data;
};

export const getMyDonationHistory = async ({ page = 1, limit = 10 } = {}) => {
  const res = await axiosInstance.get(`/donors/me/donations?page=${page}&limit=${limit}`);
  return res.data;
};

// ── Admin / Technician ────────────────────────────────────────────────────────

export const getAllDonors = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res   = await axiosInstance.get(`/donors?${query}`);
  return res.data;
};

export const getDonorById = async (id) => {
  const res = await axiosInstance.get(`/donors/${id}`);
  return res.data;
};

export const getEligibleDonors = async (bloodGroup) => {
  const res = await axiosInstance.get(`/donors/eligible${bloodGroup ? `?bloodGroup=${bloodGroup}` : ""}`);
  return res.data;
};

export const getDonorDonationHistory = async (id, { page = 1, limit = 10 } = {}) => {
  const res = await axiosInstance.get(`/donors/${id}/donations?page=${page}&limit=${limit}`);
  return res.data;
};

export const getDonorStats = async () => {
  const res = await axiosInstance.get("/donors/stats");
  return res.data;
};
