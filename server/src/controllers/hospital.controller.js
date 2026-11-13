const Hospital = require("../models/Hospital");
const User = require("../models/User");
const { createError } = require("../utils/createError");

// ─── REGISTER HOSPITAL PROFILE ───────────────────────────────────────────────
/**
 * POST /api/hospitals/register
 * Logged-in hospital user creates their hospital profile
 */
const registerHospital = async (req, res, next) => {
  try {
    const existing = await Hospital.findOne({ userId: req.user._id });
    if (existing) {
      return next(createError(409, "Hospital profile already exists."));
    }

    const {
      hospitalName,
      licenseNumber,
      type = "private",
      address,
      contactInfo,
      notes,
    } = req.body;

    if (!hospitalName || !licenseNumber || !address?.city || !contactInfo?.phone) {
      return next(createError(400, "Please provide hospital name, license number, address and phone."));
    }

    const duplicateLicense = await Hospital.findOne({ licenseNumber: licenseNumber.trim().toUpperCase() });
    if (duplicateLicense) {
      return next(createError(409, "A hospital with this license number is already registered."));
    }

    const hospital = await Hospital.create({
      userId: req.user._id,
      hospitalName,
      licenseNumber: licenseNumber.trim().toUpperCase(),
      type,
      address,
      contactInfo,
      notes,
      isApproved: false, // Requires admin verification
    });

    res.status(201).json({
      success: true,
      message: "Hospital profile submitted. Pending admin verification.",
      data: { hospital },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET MY HOSPITAL PROFILE ──────────────────────────────────────────────────
/**
 * GET /api/hospitals/me
 */
const getMyHospitalProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id }).populate(
      "userId",
      "name email phone"
    );

    if (!hospital) {
      return next(createError(404, "Hospital profile not found. Please complete profile registration."));
    }

    res.status(200).json({
      success: true,
      data: { hospital },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL HOSPITALS (Admin) ────────────────────────────────────────────────
/**
 * GET /api/hospitals?search=apollo&isApproved=true
 */
const getAllHospitals = async (req, res, next) => {
  try {
    const { search, isApproved, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (isApproved !== undefined && isApproved !== "") {
      filter.isApproved = isApproved === "true";
    }

    if (search) {
      filter.$or = [
        { hospitalName: { $regex: search.trim(), $options: "i" } },
        { licenseNumber: { $regex: search.trim(), $options: "i" } },
        { "address.city": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [hospitals, total] = await Promise.all([
      Hospital.find(filter)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Hospital.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        hospitals,
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

// ─── APPROVE OR REJECT HOSPITAL (Admin) ───────────────────────────────────────
/**
 * PUT /api/hospitals/:id/approve
 * Body: { isApproved: true/false }
 */
const approveHospital = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) return next(createError(404, "Hospital not found."));

    hospital.isApproved = isApproved;
    hospital.approvedAt = isApproved ? new Date() : null;
    hospital.registeredBy = req.user._id;

    await hospital.save();

    res.status(200).json({
      success: true,
      message: `Hospital ${isApproved ? "approved" : "revoked"} successfully.`,
      data: { hospital },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerHospital,
  getMyHospitalProfile,
  getAllHospitals,
  approveHospital,
};
