const BloodUnit = require("../models/BloodUnit");
const BloodRequest = require("../models/BloodRequest");
const Donation = require("../models/Donation");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");

const ALL_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── OVERVIEW METRICS ────────────────────────────────────────────────────────
/**
 * GET /api/analytics/overview
 */
const getOverviewMetrics = async (req, res, next) => {
  try {
    const [
      totalDonors,
      totalUnitsAvailable,
      fulfilledRequests,
      activeHospitals,
      totalDonationsCount,
    ] = await Promise.all([
      Donor.countDocuments(),
      BloodUnit.countDocuments({ status: "available" }),
      BloodRequest.countDocuments({ status: "received" }),
      Hospital.countDocuments({ isApproved: true }),
      Donation.countDocuments({ status: "successful" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDonors,
        totalUnitsAvailable,
        fulfilledRequests,
        activeHospitals,
        totalDonationsCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── STOCK BY BLOOD GROUP ─────────────────────────────────────────────────────
/**
 * GET /api/analytics/stock-by-group
 */
const getStockByGroup = async (req, res, next) => {
  try {
    const agg = await BloodUnit.aggregate([
      { $match: { status: "available" } },
      {
        $group: {
          _id: "$bloodGroup",
          units: { $sum: 1 },
          volumeMl: { $sum: "$volumeMl" },
        },
      },
    ]);

    const dataMap = {};
    agg.forEach((item) => {
      dataMap[item._id] = { units: item.units, volumeMl: item.volumeMl };
    });

    const result = ALL_GROUPS.map((group) => ({
      bloodGroup: group,
      units: dataMap[group]?.units || 0,
      volumeMl: dataMap[group]?.volumeMl || 0,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DONATION TRENDS (PAST 30 DAYS) ───────────────────────────────────────────
/**
 * GET /api/analytics/donation-trends
 */
const getDonationTrends = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const agg = await Donation.aggregate([
      {
        $match: {
          donatedAt: { $gte: thirtyDaysAgo },
          status: "successful",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$donatedAt" } },
          donations: { $sum: 1 },
          volumeMl: { $sum: "$volumeMl" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing dates for smooth graph
    const trends = [];
    const curr = new Date(thirtyDaysAgo);
    const today = new Date();

    const dataByDate = {};
    agg.forEach((item) => {
      dataByDate[item._id] = item;
    });

    while (curr <= today) {
      const dateStr = curr.toISOString().slice(0, 10);
      trends.push({
        date: dateStr.slice(5), // "MM-DD"
        donations: dataByDate[dateStr]?.donations || 0,
        volumeMl: dataByDate[dateStr]?.volumeMl || 0,
      });
      curr.setDate(curr.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (err) {
    next(err);
  }
};

// ─── REQUEST FULFILLMENT BREAKDOWN ───────────────────────────────────────────
/**
 * GET /api/analytics/request-fulfillment
 */
const getRequestFulfillment = async (req, res, next) => {
  try {
    const agg = await BloodRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = [
      { name: "Pending", count: 0, color: "#f59e0b" },
      { name: "Approved", count: 0, color: "#8b5cf6" },
      { name: "Dispatched", count: 0, color: "#3b82f6" },
      { name: "Received", count: 0, color: "#10b981" },
      { name: "Rejected", count: 0, color: "#ef4444" },
    ];

    agg.forEach((item) => {
      const entry = result.find(
        (r) => r.name.toLowerCase() === item._id?.toLowerCase()
      );
      if (entry) entry.count = item.count;
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── TOP HOSPITALS DEMAND ─────────────────────────────────────────────────────
/**
 * GET /api/analytics/hospital-demand
 */
const getHospitalDemand = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({ isApproved: true })
      .sort({ totalUnitsFulfilled: -1, totalRequestsMade: -1 })
      .limit(6)
      .select("hospitalName totalRequestsMade totalUnitsFulfilled");

    const result = hospitals.map((h) => ({
      name: h.hospitalName.length > 15 ? `${h.hospitalName.slice(0, 15)}...` : h.hospitalName,
      requests: h.totalRequestsMade || 0,
      fulfilled: h.totalUnitsFulfilled || 0,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewMetrics,
  getStockByGroup,
  getDonationTrends,
  getRequestFulfillment,
  getHospitalDemand,
};
