import axiosInstance from "./axiosInstance.js";

export const registerHospital = async (data) => {
  const res = await axiosInstance.post("/hospitals/register", data);
  return res.data;
};

export const getMyHospitalProfile = async () => {
  const res = await axiosInstance.get("/hospitals/me");
  return res.data;
};

export const getAllHospitals = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/hospitals?${query}`);
  return res.data;
};

export const approveHospital = async (id, isApproved) => {
  const res = await axiosInstance.put(`/hospitals/${id}/approve`, { isApproved });
  return res.data;
};
