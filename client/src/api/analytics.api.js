import axiosInstance from "./axiosInstance.js";

export const getOverviewMetrics = async () => {
  const res = await axiosInstance.get("/analytics/overview");
  return res.data;
};

export const getStockByGroup = async () => {
  const res = await axiosInstance.get("/analytics/stock-by-group");
  return res.data;
};

export const getDonationTrends = async () => {
  const res = await axiosInstance.get("/analytics/donation-trends");
  return res.data;
};

export const getRequestFulfillment = async () => {
  const res = await axiosInstance.get("/analytics/request-fulfillment");
  return res.data;
};

export const getHospitalDemand = async () => {
  const res = await axiosInstance.get("/analytics/hospital-demand");
  return res.data;
};
