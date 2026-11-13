const express = require("express");
const router = express.Router();

const {
  registerHospital,
  getMyHospitalProfile,
  getAllHospitals,
  approveHospital,
} = require("../controllers/hospital.controller");

const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);

// Hospital self-service
router.post("/register", authorize("hospital"), registerHospital);
router.get("/me", authorize("hospital"), getMyHospitalProfile);

// Admin controls
router.get("/", authorize("admin"), getAllHospitals);
router.put("/:id/approve", authorize("admin"), approveHospital);

module.exports = router;
