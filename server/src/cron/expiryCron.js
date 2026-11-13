const cron = require("node-cron");
const BloodUnit = require("../models/BloodUnit");
const AuditLog = require("../models/AuditLog");

/**
 * Scheduled job to check and flag expired blood units.
 * Runs daily at midnight (00:00).
 */
const initExpiryCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("⏰ [Cron] Running daily blood units expiry check...");
      const now = new Date();

      const result = await BloodUnit.updateMany(
        {
          status: { $in: ["available", "reserved", "quarantine"] },
          expiresAt: { $lt: now },
        },
        {
          $set: {
            status: "expired",
            discardReason: "Automatically marked expired by daily cron check",
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`⚠️ [Cron] Marked ${result.modifiedCount} units as expired.`);
      } else {
        console.log("✅ [Cron] No newly expired units found.");
      }
    } catch (err) {
      console.error("❌ [Cron] Error running blood unit expiry job:", err.message);
    }
  });

  console.log("✅ Expiry cron job initialized (runs daily at midnight)");
};

module.exports = { initExpiryCron };
