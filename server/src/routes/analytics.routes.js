const express = require("express");
const router = express.Router();

const {
  getOverviewMetrics,
  getStockByGroup,
  getDonationTrends,
  getRequestFulfillment,
  getHospitalDemand,
} = require("../controllers/analytics.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);
router.use(authorize("admin", "technician"));

router.get("/overview", getOverviewMetrics);
router.get("/stock-by-group", getStockByGroup);
router.get("/donation-trends", getDonationTrends);
router.get("/request-fulfillment", getRequestFulfillment);
router.get("/hospital-demand", getHospitalDemand);

module.exports = router;
