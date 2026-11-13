import axiosInstance from "./axiosInstance.js";

/**
 * Get aggregated blood stock summary (by group, by component, alerts)
 */
export const getStockSummary = async () => {
  const res = await axiosInstance.get("/blood-units/stock-summary");
  return res.data;
};

/**
 * Get list of all blood units with filters
 */
export const getAllBloodUnits = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/blood-units?${query}`);
  return res.data;
};

/**
 * Get single blood unit details
 */
export const getBloodUnitById = async (id) => {
  const res = await axiosInstance.get(`/blood-units/${id}`);
  return res.data;
};

/**
 * Register a new blood unit (with bag generation)
 */
export const addBloodUnit = async (data) => {
  const res = await axiosInstance.post("/blood-units", data);
  return res.data;
};

/**
 * Update blood unit status / storage location
 */
export const updateBloodUnit = async (id, data) => {
  const res = await axiosInstance.put(`/blood-units/${id}`, data);
  return res.data;
};

/**
 * Discard blood unit
 */
export const discardBloodUnit = async (id, reason) => {
  const res = await axiosInstance.delete(`/blood-units/${id}`, {
    data: { reason },
  });
  return res.data;
};

/**
 * Get units expiring in next 3 days
 */
export const getExpiringSoon = async () => {
  const res = await axiosInstance.get("/blood-units/expiring-soon");
  return res.data;
};
