const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  broadcastEmergencyAlert,
} = require("../controllers/notification.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);

// User notifications
router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

// Admin emergency broadcasts
router.post("/broadcast-emergency", authorize("admin", "technician"), broadcastEmergencyAlert);

module.exports = router;
