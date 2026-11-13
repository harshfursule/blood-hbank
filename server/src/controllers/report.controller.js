const BloodUnit = require("../models/BloodUnit");
const Donation = require("../models/Donation");
const BloodRequest = require("../models/BloodRequest");

/**
 * Helper to escape CSV cell values
 */
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// ─── EXPORT INVENTORY CSV ─────────────────────────────────────────────────────
/**
 * GET /api/reports/inventory-csv
 */
const exportInventoryCsv = async (req, res, next) => {
  try {
    const units = await BloodUnit.find()
      .populate("collectedBy", "name")
      .sort({ createdAt: -1 });

    const headers = [
      "Bag ID",
      "Blood Group",
      "Component",
      "Volume (ml)",
      "Status",
      "Collected Date",
      "Expiry Date",
      "Storage Unit",
      "Storage Shelf",
      "Technician",
    ];

    const rows = units.map((u) => [
      escapeCsv(u.bagId),
      escapeCsv(u.bloodGroup),
      escapeCsv(u.component),
      escapeCsv(u.volumeMl),
      escapeCsv(u.status),
      escapeCsv(u.collectedAt?.toISOString().slice(0, 10)),
      escapeCsv(u.expiresAt?.toISOString().slice(0, 10)),
      escapeCsv(u.storageLocation?.unit || ""),
      escapeCsv(u.storageLocation?.shelf || ""),
      escapeCsv(u.collectedBy?.name || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="blood-inventory-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// ─── EXPORT DONATIONS CSV ─────────────────────────────────────────────────────
/**
 * GET /api/reports/donations-csv
 */
const exportDonationsCsv = async (req, res, next) => {
  try {
    const donations = await Donation.find()
      .populate({
        path: "donorId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("bloodUnitId", "bagId bloodGroup component")
      .populate("technicianId", "name")
      .sort({ donatedAt: -1 });

    const headers = [
      "Donation Date",
      "Donor Name",
      "Donor Email",
      "Donor Phone",
      "Blood Group",
      "Component",
      "Bag ID",
      "Volume (ml)",
      "Center",
      "Status",
      "Technician",
    ];

    const rows = donations.map((d) => [
      escapeCsv(d.donatedAt?.toISOString().slice(0, 10)),
      escapeCsv(d.donorId?.userId?.name || "Anonymous"),
      escapeCsv(d.donorId?.userId?.email || ""),
      escapeCsv(d.donorId?.userId?.phone || ""),
      escapeCsv(d.bloodUnitId?.bloodGroup || d.donorId?.bloodGroup || ""),
      escapeCsv(d.bloodUnitId?.component || "Whole Blood"),
      escapeCsv(d.bloodUnitId?.bagId || ""),
      escapeCsv(d.volumeMl),
      escapeCsv(d.donationCenter || ""),
      escapeCsv(d.status),
      escapeCsv(d.technicianId?.name || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="donations-log-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// ─── EXPORT REQUESTS CSV ─────────────────────────────────────────────────────
/**
 * GET /api/reports/requests-csv
 */
const exportRequestsCsv = async (req, res, next) => {
  try {
    const requests = await BloodRequest.find()
      .populate("hospitalId", "hospitalName licenseNumber")
      .populate("requestedBy", "name")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    const headers = [
      "Request Date",
      "Hospital Name",
      "License No",
      "Blood Group",
      "Component",
      "Units Needed",
      "Priority",
      "Patient Name",
      "Diagnosis",
      "Status",
      "Reviewed By",
    ];

    const rows = requests.map((r) => [
      escapeCsv(r.createdAt?.toISOString().slice(0, 10)),
      escapeCsv(r.hospitalId?.hospitalName || ""),
      escapeCsv(r.hospitalId?.licenseNumber || ""),
      escapeCsv(r.bloodGroup),
      escapeCsv(r.component),
      escapeCsv(r.unitsNeeded),
      escapeCsv(r.urgency),
      escapeCsv(r.patientName || ""),
      escapeCsv(r.diagnosis || ""),
      escapeCsv(r.status),
      escapeCsv(r.reviewedBy?.name || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="hospital-requests-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportInventoryCsv,
  exportDonationsCsv,
  exportRequestsCsv,
};
