const Notification = require("../models/Notification");
const Donor = require("../models/Donor");
const User = require("../models/User");
const { notifyUser } = require("../services/notificationService");
const { createError } = require("../utils/createError");

// ─── GET MY NOTIFICATIONS ────────────────────────────────────────────────────
/**
 * GET /api/notifications?unreadOnly=true&page=1&limit=10
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, page = 1, limit = 15 } = req.query;
    const filter = { userId: req.user._id };

    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

// ─── GET UNREAD COUNT (For Bell Badge) ────────────────────────────────────────
/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (err) {
    next(err);
  }
};

// ─── MARK SINGLE AS READ ─────────────────────────────────────────────────────
/**
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) return next(createError(404, "Notification not found."));

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
};

// ─── MARK ALL AS READ ────────────────────────────────────────────────────────
/**
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── BROADCAST EMERGENCY SHORTAGE ALERT (Admin / Technician) ──────────────────
/**
 * POST /api/notifications/broadcast-emergency
 * Body: { bloodGroup: "O+", message: string }
 */
const broadcastEmergencyAlert = async (req, res, next) => {
  try {
    const { bloodGroup, message } = req.body;

    if (!bloodGroup) {
      return next(createError(400, "Blood group is required for emergency broadcast."));
    }

    // Find all currently eligible donors of this blood group
    const donors = await Donor.find({
      bloodGroup,
      isEligible: true,
    }).populate("userId", "name email");

    if (donors.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No currently eligible ${bloodGroup} donors found to broadcast to.`,
        data: { recipientsCount: 0 },
      });
    }

    const title = `🚨 URGENT: Critical ${bloodGroup} Shortage`;
    const defaultMsg = `Our blood bank is currently facing a critical shortage of ${bloodGroup} blood for urgent hospital surgeries. As an eligible registered donor, your donation today can save lives!`;
    const finalMsg = message?.trim() || defaultMsg;

    // Send notifications to all eligible donors
    const promises = donors.map((d) =>
      notifyUser({
        userId: d.userId._id,
        title,
        message: finalMsg,
        type: "emergency_alert",
        channel: "all",
        recipientEmail: d.userId.email,
      })
    );

    await Promise.all(promises);

    res.status(200).json({
      success: true,
      message: `Emergency shortage alert broadcast to ${donors.length} eligible ${bloodGroup} donor(s).`,
      data: { recipientsCount: donors.length },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  broadcastEmergencyAlert,
};
