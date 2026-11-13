const BloodRequest = require("../models/BloodRequest");
const BloodUnit = require("../models/BloodUnit");
const Hospital = require("../models/Hospital");
const Dispatch = require("../models/Dispatch");
const AuditLog = require("../models/AuditLog");
const { notifyUser } = require("../services/notificationService");
const { createError } = require("../utils/createError");
const { getCompatibleDonorGroups } = require("../utils/bloodCompatibility");

// ─── SUBMIT BLOOD REQUEST (Hospital) ──────────────────────────────────────────
/**
 * POST /api/requests
 * Body: { bloodGroup, component, unitsNeeded, urgency, patientName, patientAge, diagnosis, requiredBy, notes }
 */
const submitRequest = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });

    if (!hospital) {
      return next(createError(403, "Please register your hospital profile before submitting blood requests."));
    }

    if (!hospital.isApproved) {
      return next(
        createError(403, "Your hospital account is awaiting admin approval. Please contact administration.")
      );
    }

    const {
      bloodGroup,
      component = "Whole Blood",
      unitsNeeded,
      urgency = "routine",
      patientName,
      patientAge,
      diagnosis,
      requiredBy,
      notes,
    } = req.body;

    if (!bloodGroup || !unitsNeeded || unitsNeeded <= 0) {
      return next(createError(400, "Please provide blood group and valid units needed."));
    }

    const request = await BloodRequest.create({
      hospitalId: hospital._id,
      requestedBy: req.user._id,
      bloodGroup,
      component,
      unitsNeeded,
      urgency,
      patientName,
      patientAge,
      diagnosis,
      requiredBy: requiredBy ? new Date(requiredBy) : null,
      notes,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          changedBy: req.user._id,
          note: `Request submitted with ${urgency} urgency.`,
        },
      ],
    });

    hospital.totalRequestsMade = (hospital.totalRequestsMade || 0) + 1;
    await hospital.save();

    res.status(201).json({
      success: true,
      message: "Blood request submitted successfully.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL REQUESTS ────────────────────────────────────────────────────────
/**
 * GET /api/requests?status=pending&urgency=emergency&bloodGroup=O+
 */
const getAllRequests = async (req, res, next) => {
  try {
    const { status, urgency, bloodGroup, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Hospital can only see their own requests
    if (req.user.role === "hospital") {
      const hospital = await Hospital.findOne({ userId: req.user._id });
      if (!hospital) {
        return res.status(200).json({ success: true, data: { requests: [], pagination: { total: 0 } } });
      }
      filter.hospitalId = hospital._id;
    }

    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      BloodRequest.find(filter)
        .populate("hospitalId", "hospitalName contactInfo address")
        .populate("requestedBy", "name email phone")
        .populate("reviewedBy", "name")
        .populate("assignedUnits", "bagId bloodGroup component volumeMl storageLocation")
        .sort({ urgency: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BloodRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests,
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

// ─── GET SINGLE REQUEST & COMPATIBLE UNITS ────────────────────────────────────
/**
 * GET /api/requests/:id
 */
const getRequestById = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate("hospitalId", "hospitalName contactInfo address")
      .populate("requestedBy", "name email phone")
      .populate("assignedUnits")
      .populate("reviewedBy", "name");

    if (!request) return next(createError(404, "Blood request not found."));

    // If request is still pending, find available compatible units (FIFO)
    let compatibleUnits = [];
    if (request.status === "pending") {
      const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup, request.component);

      compatibleUnits = await BloodUnit.find({
        bloodGroup: { $in: compatibleGroups },
        component: request.component,
        status: "available",
        expiresAt: { $gt: new Date() },
      })
        .sort({ expiresAt: 1 }) // FIFO: nearest expiry first
        .limit(20);
    }

    // If dispatched, fetch dispatch tracking
    let dispatchInfo = null;
    if (request.status === "dispatched" || request.status === "received") {
      dispatchInfo = await Dispatch.findOne({ requestId: request._id }).populate("dispatchedBy", "name");
    }

    res.status(200).json({
      success: true,
      data: {
        request,
        compatibleUnits,
        dispatchInfo,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── APPROVE REQUEST (Assign Units) ───────────────────────────────────────────
/**
 * PUT /api/requests/:id/approve
 * Body: { unitIds: string[], notes: string }
 */
const approveRequest = async (req, res, next) => {
  try {
    const { unitIds = [], notes } = req.body;
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return next(createError(404, "Blood request not found."));

    if (request.status !== "pending") {
      return next(createError(400, `Cannot approve a request with status: ${request.status}`));
    }

    if (!unitIds || unitIds.length < request.unitsNeeded) {
      return next(
        createError(400, `Please select at least ${request.unitsNeeded} matching blood unit(s) to fulfill this order.`)
      );
    }

    // Verify all units are available
    const units = await BloodUnit.find({
      _id: { $in: unitIds },
      status: "available",
      expiresAt: { $gt: new Date() },
    });

    if (units.length !== unitIds.length) {
      return next(createError(400, "One or more selected blood units are no longer available."));
    }

    // Reserve blood units
    await BloodUnit.updateMany(
      { _id: { $in: unitIds } },
      { $set: { status: "reserved", reservedFor: request._id } }
    );

    // Update Request
    request.status = "approved";
    request.assignedUnits = unitIds;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.statusHistory.push({
      status: "approved",
      changedBy: req.user._id,
      note: notes || `Approved with ${unitIds.length} reserved units.`,
    });
    await request.save();

    await AuditLog.create({
      action: "REQUEST_APPROVED",
      performedBy: req.user._id,
      entityType: "BloodRequest",
      entityId: request._id,
      changes: { assignedUnits: unitIds },
    });

    // Notify Hospital User
    await notifyUser({
      userId: request.requestedBy,
      title: "Blood Request Approved",
      message: `Your request for ${request.unitsNeeded} unit(s) of ${request.bloodGroup} ${request.component} has been approved and units are reserved.`,
      type: "request_approved",
      channel: "in-app",
      relatedEntity: { entityType: "BloodRequest", entityId: request._id },
    });

    res.status(200).json({
      success: true,
      message: "Request approved and blood units reserved.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

// ─── REJECT REQUEST ───────────────────────────────────────────────────────────
/**
 * PUT /api/requests/:id/reject
 * Body: { rejectionReason: string }
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { rejectionReason = "Insufficient stock" } = req.body;
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return next(createError(404, "Blood request not found."));

    if (request.status !== "pending") {
      return next(createError(400, `Cannot reject a request with status: ${request.status}`));
    }

    request.status = "rejected";
    request.rejectionReason = rejectionReason;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.statusHistory.push({
      status: "rejected",
      changedBy: req.user._id,
      note: rejectionReason,
    });
    await request.save();

    // Notify Hospital User - Dispatch
    await notifyUser({
      userId: request.requestedBy,
      title: "Blood Units Dispatched!",
      message: `Your requested units (${request.bloodGroup} ${request.component}) are in transit via ${deliveryMethod}. Tracking: ${trackingNumber || "Local Dispatch"}.`,
      type: "dispatch_confirmed",
      channel: "in-app",
      relatedEntity: { entityType: "BloodRequest", entityId: request._id },
    });

    res.status(200).json({
      success: true,
      message: "Request rejected.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DISPATCH BLOOD UNITS ─────────────────────────────────────────────────────
/**
 * POST /api/requests/:id/dispatch
 * Body: { deliveryMethod, trackingNumber, notes }
 */
const dispatchBlood = async (req, res, next) => {
  try {
    const { deliveryMethod = "ambulance", trackingNumber, notes } = req.body;
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return next(createError(404, "Blood request not found."));

    if (request.status !== "approved") {
      return next(createError(400, "Only approved requests with reserved units can be dispatched."));
    }

    // Mark blood units as used / in-transit
    await BloodUnit.updateMany(
      { _id: { $in: request.assignedUnits } },
      { $set: { status: "used" } }
    );

    // Create Dispatch record
    const dispatch = await Dispatch.create({
      requestId: request._id,
      dispatchedBy: req.user._id,
      bloodUnits: request.assignedUnits,
      unitCount: request.assignedUnits.length,
      deliveryMethod,
      trackingNumber,
      notes,
      status: "dispatched",
    });

    // Update request
    request.status = "dispatched";
    request.statusHistory.push({
      status: "dispatched",
      changedBy: req.user._id,
      note: `Dispatched via ${deliveryMethod}. Tracking: ${trackingNumber || "N/A"}`,
    });
    await request.save();

    // Notify Hospital User - Dispatch
    await notifyUser({
      userId: request.requestedBy,
      title: "Blood Units Dispatched!",
      message: `Your requested units (${request.bloodGroup} ${request.component}) are in transit via ${deliveryMethod}. Tracking: ${trackingNumber || "Local Dispatch"}.`,
      type: "dispatch_confirmed",
      channel: "in-app",
      relatedEntity: { entityType: "BloodRequest", entityId: request._id },
    });

    res.status(200).json({
      success: true,
      message: "Blood units successfully dispatched.",
      data: { dispatch, request },
    });
  } catch (err) {
    next(err);
  }
};

// ─── CONFIRM RECEIPT (Hospital) ───────────────────────────────────────────────
/**
 * PUT /api/requests/:id/received
 * Body: { receivedBy: string }
 */
const confirmReceipt = async (req, res, next) => {
  try {
    const { receivedBy = req.user.name } = req.body;
    const request = await BloodRequest.findById(req.params.id);

    if (!request) return next(createError(404, "Blood request not found."));

    if (request.status !== "dispatched") {
      return next(createError(400, "Can only confirm receipt for dispatched shipments."));
    }

    // Update Dispatch
    await Dispatch.findOneAndUpdate(
      { requestId: request._id },
      {
        $set: {
          status: "received",
          receivedAt: new Date(),
          receivedBy,
        },
      }
    );

    // Update Request
    request.status = "received";
    request.statusHistory.push({
      status: "received",
      changedBy: req.user._id,
      note: `Confirmed received by ${receivedBy}`,
    });
    await request.save();

    // Increment hospital fulfilled count
    await Hospital.findByIdAndUpdate(request.hospitalId, {
      $inc: { totalUnitsFulfilled: request.assignedUnits.length },
    });

    res.status(200).json({
      success: true,
      message: "Blood shipment receipt successfully confirmed.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET REQUEST STATS ────────────────────────────────────────────────────────
/**
 * GET /api/requests/stats
 */
const getRequestStats = async (req, res, next) => {
  try {
    const [pending, approved, dispatched, received, emergencyCount] = await Promise.all([
      BloodRequest.countDocuments({ status: "pending" }),
      BloodRequest.countDocuments({ status: "approved" }),
      BloodRequest.countDocuments({ status: "dispatched" }),
      BloodRequest.countDocuments({ status: "received" }),
      BloodRequest.countDocuments({ status: "pending", urgency: "emergency" }),
    ]);

    res.status(200).json({
      success: true,
      data: { pending, approved, dispatched, received, emergencyCount },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  dispatchBlood,
  confirmReceipt,
  getRequestStats,
};
