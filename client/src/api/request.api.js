import axiosInstance from "./axiosInstance.js";

export const submitBloodRequest = async (data) => {
  const res = await axiosInstance.post("/requests", data);
  return res.data;
};

export const getAllBloodRequests = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/requests?${query}`);
  return res.data;
};

export const getBloodRequestById = async (id) => {
  const res = await axiosInstance.get(`/requests/${id}`);
  return res.data;
};

export const approveBloodRequest = async (id, data) => {
  const res = await axiosInstance.put(`/requests/${id}/approve`, data);
  return res.data;
};

export const rejectBloodRequest = async (id, reason) => {
  const res = await axiosInstance.put(`/requests/${id}/reject`, { rejectionReason: reason });
  return res.data;
};

export const dispatchBloodRequest = async (id, data) => {
  const res = await axiosInstance.post(`/requests/${id}/dispatch`, data);
  return res.data;
};

export const confirmBloodReceived = async (id, data = {}) => {
  const res = await axiosInstance.put(`/requests/${id}/received`, data);
  return res.data;
};

export const getRequestStats = async () => {
  const res = await axiosInstance.get("/requests/stats");
  return res.data;
};
