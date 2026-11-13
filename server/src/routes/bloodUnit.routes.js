const express = require("express");
const router = express.Router();

const {
  addBloodUnit,
  getAllBloodUnits,
  getStockSummary,
  getExpiringSoon,
  getBloodUnitById,
  updateBloodUnit,
  discardBloodUnit,
} = require("../controllers/bloodUnit.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// All inventory operations require authentication and admin or technician role
router.use(protect);
router.use(authorize("admin", "technician"));

// Summary & alerts (must be defined before /:id)
router.get("/stock-summary", getStockSummary);
router.get("/expiring-soon", getExpiringSoon);

// CRUD
router.post("/", addBloodUnit);
router.get("/", getAllBloodUnits);
router.get("/:id", getBloodUnitById);
router.put("/:id", updateBloodUnit);
router.delete("/:id", discardBloodUnit);

module.exports = router;
