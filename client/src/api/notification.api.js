import axiosInstance from "./axiosInstance.js";

export const getMyNotifications = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axiosInstance.get(`/notifications?${query}`);
  return res.data;
};

export const getUnreadNotificationsCount = async () => {
  const res = await axiosInstance.get("/notifications/unread-count");
  return res.data;
};

export const markNotificationAsRead = async (id) => {
  const res = await axiosInstance.put(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await axiosInstance.put("/notifications/read-all");
  return res.data;
};

export const broadcastEmergencyShortage = async ({ bloodGroup, message }) => {
  const res = await axiosInstance.post("/notifications/broadcast-emergency", {
    bloodGroup,
    message,
  });
  return res.data;
};
