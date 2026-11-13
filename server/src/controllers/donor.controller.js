const Donor    = require("../models/Donor");
const Donation = require("../models/Donation");
const User     = require("../models/User");
const { createError } = require("../utils/createError");

// ─── Helper: Check donor eligibility ──────────────────────────────────────────
const checkEligibility = (donor) => {
  const reasons = [];

  // Age check (18–65)
  const age = donor.age; // virtual
  if (age < 18) reasons.push("Must be at least 18 years old");
  if (age > 65) reasons.push("Must be under 65 years old");

  // Weight check (≥ 50kg)
  if (donor.weight && donor.weight < 50) reasons.push("Weight must be at least 50kg");

  // Hemoglobin check
  const minHb = donor.gender === "female" ? 12.5 : 13.0;
  if (donor.hemoglobinLevel && donor.hemoglobinLevel < minHb) {
    reasons.push(`Hemoglobin too low (min ${minHb} g/dL for ${donor.gender})`);
  }

  // Last donation (56-day gap)
  if (donor.lastDonatedAt) {
    const daysSince = donor.daysSinceLastDonation;
    if (daysSince < 56) {
      reasons.push(`Must wait ${56 - daysSince} more days since last donation`);
    }
  }

  // Medical conditions
  if (donor.medicalHistory?.hasChronicDisease) {
    reasons.push("Has chronic medical condition");
  }

  // Tattoo/piercing within 12 months
  if (donor.medicalHistory?.hasTattooOrPiercing && donor.medicalHistory?.tattooDate) {
    const monthsSince =
      (Date.now() - new Date(donor.medicalHistory.tattooDate)) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSince < 12) reasons.push("Tattoo/piercing within last 12 months");
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
};

// ─── REGISTER DONOR PROFILE ───────────────────────────────────────────────────
/**
 * POST /api/donors/register
 * Creates a donor profile for a logged-in user (role = donor)
 */
const registerDonor = async (req, res, next) => {
  try {
    // Check if profile already exists
    const existing = await Donor.findOne({ userId: req.user._id });
    if (existing) {
      return next(createError(409, "Donor profile already exists. Use PUT /donors/me to update."));
    }

    const {
      dateOfBirth, gender, address,
      medicalHistory, hemoglobinLevel, weight,
      emergencyContact,
    } = req.body;

    if (!dateOfBirth || !gender || !address?.city || !address?.state) {
      return next(createError(400, "Please provide date of birth, gender, and address."));
    }

    // Get blood group from user-provided body (required for donor profile)
    const { bloodGroup } = req.body;
    if (!bloodGroup) return next(createError(400, "Blood group is required."));

    const donor = await Donor.create({
      userId: req.user._id,
      bloodGroup,
      dateOfBirth,
      gender,
      address,
      medicalHistory: medicalHistory || {},
      hemoglobinLevel: hemoglobinLevel || null,
      weight: weight || null,
      emergencyContact: emergencyContact || {},
    });

    // Check & set eligibility
    const { isEligible, reasons } = checkEligibility(donor);
    donor.isEligible = isEligible;
    donor.ineligibilityReason = reasons.join("; ");
    await donor.save();

    await donor.populate("userId", "name email phone");

    res.status(201).json({
      success: true,
      message: "Donor profile created successfully!",
      data: { donor },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET MY DONOR PROFILE ─────────────────────────────────────────────────────
/**
 * GET /api/donors/me
 */
const getMyProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id }).populate(
      "userId",
      "name email phone profileImage"
    );

    if (!donor) {
      return next(createError(404, "Donor profile not found. Please complete registration."));
    }

    res.status(200).json({
      success: true,
      data: { donor },
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE MY DONOR PROFILE ──────────────────────────────────────────────────
/**
 * PUT /api/donors/me
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) return next(createError(404, "Donor profile not found."));

    const allowedUpdates = [
      "address", "medicalHistory", "hemoglobinLevel",
      "weight", "emergencyContact",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) donor[field] = req.body[field];
    });

    // Re-check eligibility after update
    const { isEligible, reasons } = checkEligibility(donor);
    donor.isEligible = isEligible;
    donor.ineligibilityReason = reasons.join("; ");

    await donor.save();
    await donor.populate("userId", "name email phone profileImage");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { donor },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET DONOR BY ID (Admin / Technician) ────────────────────────────────────
/**
 * GET /api/donors/:id
 */
const getDonorById = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id).populate(
      "userId",
      "name email phone profileImage createdAt"
    );
    if (!donor) return next(createError(404, "Donor not found."));

    res.status(200).json({
      success: true,
      data: { donor },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL DONORS (Admin / Technician) ─────────────────────────────────────
/**
 * GET /api/donors?bloodGroup=A+&isEligible=true&city=Mumbai&page=1&limit=10&search=john
 */
const getAllDonors = async (req, res, next) => {
  try {
    const {
      bloodGroup, isEligible, city,
      page = 1, limit = 10, search,
    } = req.query;

    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (isEligible !== undefined) filter.isEligible = isEligible === "true";
    if (city) filter["address.city"] = { $regex: city, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // If search provided, find matching user IDs first
    let userIds = [];
    if (search) {
      const users = await User.find({
        $or: [
          { name:  { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
        role: "donor",
      }).select("_id");
      userIds = users.map((u) => u._id);
      filter.userId = { $in: userIds };
    }

    const [donors, total] = await Promise.all([
      Donor.find(filter)
        .populate("userId", "name email phone createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Donor.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        donors,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ELIGIBLE DONORS BY BLOOD GROUP ───────────────────────────────────────
/**
 * GET /api/donors/eligible?bloodGroup=A+
 * Used for emergency alerts — finds all currently eligible donors
 */
const getEligibleDonors = async (req, res, next) => {
  try {
    const { bloodGroup } = req.query;
    const filter = { isEligible: true };
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const donors = await Donor.find(filter)
      .populate("userId", "name email phone")
      .select("bloodGroup address lastDonatedAt totalDonations userId")
      .sort({ lastDonatedAt: 1 }); // longest since last donation first

    res.status(200).json({
      success: true,
      data: { donors, count: donors.length },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET DONATION HISTORY ─────────────────────────────────────────────────────
/**
 * GET /api/donors/me/donations       (donor sees own history)
 * GET /api/donors/:id/donations      (admin sees any donor's history)
 */
const getDonationHistory = async (req, res, next) => {
  try {
    // Determine whose donations to fetch
    let donorId;

    if (req.params.id) {
      // Admin/technician fetching for a specific donor
      const donor = await Donor.findById(req.params.id);
      if (!donor) return next(createError(404, "Donor not found."));
      donorId = donor._id;
    } else {
      // Donor fetching own history
      const donor = await Donor.findOne({ userId: req.user._id });
      if (!donor) return next(createError(404, "Donor profile not found."));
      donorId = donor._id;
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [donations, total] = await Promise.all([
      Donation.find({ donorId })
        .populate("bloodUnitId", "bagId bloodGroup component volumeMl")
        .populate("technicianId", "name")
        .sort({ donatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Donation.countDocuments({ donorId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        donations,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET DONOR STATS (Admin dashboard) ───────────────────────────────────────
/**
 * GET /api/donors/stats
 */
const getDonorStats = async (req, res, next) => {
  try {
    const [total, eligible, byBloodGroup, newThisMonth] = await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ isEligible: true }),
      Donor.aggregate([
        { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Donor.countDocuments({
        createdAt: { $gte: new Date(new Date().setDate(1)) }, // since 1st of month
      }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, eligible, byBloodGroup, newThisMonth },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerDonor,
  getMyProfile,
  updateMyProfile,
  getDonorById,
  getAllDonors,
  getEligibleDonors,
  getDonationHistory,
  getDonorStats,
};
