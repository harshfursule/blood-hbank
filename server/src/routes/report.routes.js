const express = require("express");
const router = express.Router();

const {
  exportInventoryCsv,
  exportDonationsCsv,
  exportRequestsCsv,
} = require("../controllers/report.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);
router.use(authorize("admin", "technician"));

router.get("/inventory-csv", exportInventoryCsv);
router.get("/donations-csv", exportDonationsCsv);
router.get("/requests-csv", exportRequestsCsv);

module.exports = router;
