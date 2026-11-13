const express = require("express");
const router  = express.Router();

const {
  registerDonor,
  getMyProfile,
  updateMyProfile,
  getDonorById,
  getAllDonors,
  getEligibleDonors,
  getDonationHistory,
  getDonorStats,
} = require("../controllers/donor.controller");

const { protect }    = require("../middleware/auth.middleware");
const { authorize }  = require("../middleware/role.middleware");

// All donor routes require authentication
router.use(protect);

// ─── Donor self-service routes ────────────────────────────────────────────────
router.post  ("/register",       authorize("donor"),                    registerDonor);
router.get   ("/me",             authorize("donor"),                    getMyProfile);
router.put   ("/me",             authorize("donor"),                    updateMyProfile);
router.get   ("/me/donations",   authorize("donor"),                    getDonationHistory);

// ─── Admin / Technician routes ────────────────────────────────────────────────
router.get   ("/stats",          authorize("admin", "technician"),      getDonorStats);
router.get   ("/eligible",       authorize("admin", "technician"),      getEligibleDonors);
router.get   ("/",               authorize("admin", "technician"),      getAllDonors);
router.get   ("/:id",            authorize("admin", "technician"),      getDonorById);
router.get   ("/:id/donations",  authorize("admin", "technician"),      getDonationHistory);

module.exports = router;
