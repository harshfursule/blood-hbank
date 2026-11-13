import axiosInstance from "./axiosInstance.js";

/**
 * Downloads a CSV file with authentication token attached
 */
const downloadCsv = async (endpoint, defaultFilename) => {
  const response = await axiosInstance.get(endpoint, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadInventoryReport = () =>
  downloadCsv(
    "/reports/inventory-csv",
    `blood-inventory-${new Date().toISOString().slice(0, 10)}.csv`
  );

export const downloadDonationsReport = () =>
  downloadCsv(
    "/reports/donations-csv",
    `donations-log-${new Date().toISOString().slice(0, 10)}.csv`
  );

export const downloadRequestsReport = () =>
  downloadCsv(
    "/reports/requests-csv",
    `hospital-requests-${new Date().toISOString().slice(0, 10)}.csv`
  );
