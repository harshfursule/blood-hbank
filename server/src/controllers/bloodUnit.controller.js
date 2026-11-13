const QRCode = require("qrcode");
const BloodUnit = require("../models/BloodUnit");
const Donor = require("../models/Donor");
const Donation = require("../models/Donation");
const AuditLog = require("../models/AuditLog");
const { createError } = require("../utils/createError");

// Shelf-life by component (in days)
const COMPONENT_SHELF_LIFE_DAYS = {
  "Whole Blood": 35,
  "RBC": 42,
  "Platelets": 5,
  "Plasma": 365,
  "FFP": 365,
  "Cryoprecipitate": 365,
};

// ─── ADD BLOOD UNIT ──────────────────────────────────────────────────────────
/**
 * POST /api/blood-units
 * Body: { donorId, bloodGroup, component, volumeMl, storageLocation, collectedAt, notes }
 */
const addBloodUnit = async (req, res, next) => {
  try {
    const {
      donorId,
      bloodGroup,
      component = "Whole Blood",
      volumeMl = 450,
      storageLocation,
      collectedAt,
      notes,
    } = req.body;

    if (!bloodGroup) {
      return next(createError(400, "Blood group is required."));
    }

    const collectionDate = collectedAt ? new Date(collectedAt) : new Date();

    // Auto-calculate expiry based on component shelf-life
    const shelfLife = COMPONENT_SHELF_LIFE_DAYS[component] || 35;
    const expiresAt = new Date(collectionDate);
    expiresAt.setDate(expiresAt.getDate() + shelfLife);

    // Auto-generate Bag ID: e.g. "BAG-A+-20261021-9X2Y"
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const dateStr = collectionDate.toISOString().slice(0, 10).replace(/-/g, "");
    const cleanGroup = bloodGroup.replace("+", "POS").replace("-", "NEG");
    const bagId = `BAG-${cleanGroup}-${dateStr}-${randomSuffix}`;

    // Generate QR Code data URL containing bag metadata
    const qrPayload = JSON.stringify({
      bagId,
      bloodGroup,
      component,
      volumeMl,
      expiresAt: expiresAt.toISOString().slice(0, 10),
    });
    const qrCodeUrl = await QRCode.toDataURL(qrPayload);

    // Create BloodUnit
    const bloodUnit = await BloodUnit.create({
      bagId,
      bloodGroup,
      component,
      volumeMl,
      collectedAt: collectionDate,
      expiresAt,
      status: "available",
      donorId: donorId || null,
      collectedBy: req.user._id,
      storageLocation: storageLocation || { unit: "Refrig-1", shelf: "A" },
      qrCodeUrl,
      notes,
    });

    // If linked to a donor, record the Donation document & update donor metrics
    if (donorId) {
      const donor = await Donor.findById(donorId);
      if (donor) {
        await Donation.create({
          donorId: donor._id,
          bloodUnitId: bloodUnit._id,
          technicianId: req.user._id,
          donatedAt: collectionDate,
          volumeMl,
          status: "successful",
          donationCenter: storageLocation?.unit || "Main Blood Center",
        });

        donor.lastDonatedAt = collectionDate;
        donor.totalDonations = (donor.totalDonations || 0) + 1;
        // Temporarily mark not eligible until 56 days pass
        donor.isEligible = false;
        donor.ineligibilityReason = "Mandatory 56-day rest period after donation.";
        await donor.save();
      }
    }

    // Audit log
    await AuditLog.create({
      action: "BLOOD_UNIT_CREATED",
      performedBy: req.user._id,
      entityType: "BloodUnit",
      entityId: bloodUnit._id,
      changes: { bagId, bloodGroup, component, volumeMl },
    });

    res.status(201).json({
      success: true,
      message: "Blood unit successfully registered.",
      data: { bloodUnit },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL BLOOD UNITS (Search & Filter) ────────────────────────────────────
/**
 * GET /api/blood-units?bloodGroup=A+&component=RBC&status=available&search=BAG&page=1&limit=10
 */
const getAllBloodUnits = async (req, res, next) => {
  try {
    const {
      bloodGroup,
      component,
      status,
      search,
      expiringWithinDays,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (component) filter.component = component;
    if (status) filter.status = status;
    if (search) {
      filter.bagId = { $regex: search.trim(), $options: "i" };
    }

    if (expiringWithinDays) {
      const now = new Date();
      const target = new Date();
      target.setDate(target.getDate() + parseInt(expiringWithinDays));
      filter.expiresAt = { $gte: now, $lte: target };
      filter.status = "available";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [units, total] = await Promise.all([
      BloodUnit.find(filter)
        .populate("donorId", "bloodGroup userId")
        .populate("collectedBy", "name")
        .sort({ expiresAt: 1 }) // FIFO: nearest expiry first
        .skip(skip)
        .limit(parseInt(limit)),
      BloodUnit.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        units,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET STOCK SUMMARY ───────────────────────────────────────────────────────
/**
 * GET /api/blood-units/stock-summary
 * Returns stock counts by blood group and component
 */
const getStockSummary = async (req, res, next) => {
  try {
    const ALL_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    // Available units grouped by blood group
    const byGroupAgg = await BloodUnit.aggregate([
      { $match: { status: "available" } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 }, totalVolumeMl: { $sum: "$volumeMl" } } },
    ]);

    // Format into standard dictionary with default 0s
    const byGroup = {};
    ALL_GROUPS.forEach((g) => {
      byGroup[g] = { count: 0, totalVolumeMl: 0 };
    });
    byGroupAgg.forEach((item) => {
      byGroup[item._id] = { count: item.count, totalVolumeMl: item.totalVolumeMl };
    });

    // Breakdown by component
    const byComponent = await BloodUnit.aggregate([
      { $match: { status: "available" } },
      { $group: { _id: "$component", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Total available units
    const totalAvailable = await BloodUnit.countDocuments({ status: "available" });

    // Expiring in next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiringSoonCount = await BloodUnit.countDocuments({
      status: "available",
      expiresAt: { $gte: new Date(), $lte: threeDaysFromNow },
    });

    // Units discarded this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const discardedThisMonth = await BloodUnit.countDocuments({
      status: "discarded",
      updatedAt: { $gte: startOfMonth },
    });

    res.status(200).json({
      success: true,
      data: {
        totalAvailable,
        expiringSoonCount,
        discardedThisMonth,
        byGroup,
        byComponent,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET EXPIRING SOON UNITS ──────────────────────────────────────────────────
/**
 * GET /api/blood-units/expiring-soon
 */
const getExpiringSoon = async (req, res, next) => {
  try {
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);

    const units = await BloodUnit.find({
      status: "available",
      expiresAt: { $gte: new Date(), $lte: threeDays },
    })
      .sort({ expiresAt: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: { units, count: units.length },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE BLOOD UNIT ───────────────────────────────────────────────────
/**
 * GET /api/blood-units/:id
 */
const getBloodUnitById = async (req, res, next) => {
  try {
    const unit = await BloodUnit.findById(req.params.id)
      .populate("donorId", "bloodGroup userId")
      .populate("collectedBy", "name email");

    if (!unit) return next(createError(404, "Blood unit not found."));

    res.status(200).json({
      success: true,
      data: { unit },
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE BLOOD UNIT STATUS / DETAILS ──────────────────────────────────────
/**
 * PUT /api/blood-units/:id
 * Body: { status, storageLocation, notes }
 */
const updateBloodUnit = async (req, res, next) => {
  try {
    const { status, storageLocation, notes, screeningResults } = req.body;
    const unit = await BloodUnit.findById(req.params.id);

    if (!unit) return next(createError(404, "Blood unit not found."));

    const prevStatus = unit.status;

    if (status) unit.status = status;
    if (storageLocation) unit.storageLocation = storageLocation;
    if (notes) unit.notes = notes;
    if (screeningResults) unit.screeningResults = { ...unit.screeningResults, ...screeningResults };

    await unit.save();

    // Audit log
    await AuditLog.create({
      action: "BLOOD_UNIT_UPDATED",
      performedBy: req.user._id,
      entityType: "BloodUnit",
      entityId: unit._id,
      changes: {
        status: { from: prevStatus, to: unit.status },
        storageLocation,
      },
    });

    res.status(200).json({
      success: true,
      message: "Blood unit updated.",
      data: { unit },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DISCARD BLOOD UNIT ───────────────────────────────────────────────────────
/**
 * DELETE /api/blood-units/:id
 * Body: { reason }
 */
const discardBloodUnit = async (req, res, next) => {
  try {
    const { reason = "Expired or damaged" } = req.body;
    const unit = await BloodUnit.findById(req.params.id);

    if (!unit) return next(createError(404, "Blood unit not found."));

    unit.status = "discarded";
    unit.discardReason = reason;
    await unit.save();

    await AuditLog.create({
      action: "BLOOD_UNIT_DISCARDED",
      performedBy: req.user._id,
      entityType: "BloodUnit",
      entityId: unit._id,
      changes: { discardReason: reason },
    });

    res.status(200).json({
      success: true,
      message: "Blood unit marked as discarded.",
      data: { unit },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addBloodUnit,
  getAllBloodUnits,
  getStockSummary,
  getExpiringSoon,
  getBloodUnitById,
  updateBloodUnit,
  discardBloodUnit,
};
