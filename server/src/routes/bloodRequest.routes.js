const express = require("express");
const router = express.Router();

const {
  submitRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  dispatchBlood,
  confirmReceipt,
  getRequestStats,
} = require("../controllers/bloodRequest.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);

// Stats & listing
router.get("/stats", authorize("admin", "technician"), getRequestStats);
router.get("/", authorize("hospital", "admin", "technician"), getAllRequests);
router.get("/:id", authorize("hospital", "admin", "technician"), getRequestById);

// Hospital actions
router.post("/", authorize("hospital"), submitRequest);
router.put("/:id/received", authorize("hospital"), confirmReceipt);

// Technician / Admin actions
router.put("/:id/approve", authorize("admin", "technician"), approveRequest);
router.put("/:id/reject", authorize("admin", "technician"), rejectRequest);
router.post("/:id/dispatch", authorize("admin", "technician"), dispatchBlood);

module.exports = router;
