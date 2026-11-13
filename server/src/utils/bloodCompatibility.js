/**
 * Red Blood Cell (RBC) & Whole Blood Compatibility Matrix
 * Key: Recipient Blood Group
 * Value: Array of acceptable Donor Blood Groups
 */
const RBC_COMPATIBILITY = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/**
 * Plasma & Platelet Compatibility Matrix
 * (Inverse of RBC compatibility)
 */
const PLASMA_COMPATIBILITY = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/**
 * Check if a donor blood group is compatible with recipient blood group
 * @param {string} recipientGroup
 * @param {string} donorGroup
 * @param {string} component
 */
const isCompatible = (recipientGroup, donorGroup, component = "Whole Blood") => {
  if (recipientGroup === donorGroup) return true;

  if (component === "Plasma" || component === "FFP" || component === "Platelets") {
    const allowed = PLASMA_COMPATIBILITY[recipientGroup] || [];
    return allowed.includes(donorGroup);
  }

  // RBC, Whole Blood, Cryoprecipitate
  const allowed = RBC_COMPATIBILITY[recipientGroup] || [];
  return allowed.includes(donorGroup);
};

/**
 * Get all compatible donor blood groups for a given recipient
 */
const getCompatibleDonorGroups = (recipientGroup, component = "Whole Blood") => {
  if (component === "Plasma" || component === "FFP" || component === "Platelets") {
    return PLASMA_COMPATIBILITY[recipientGroup] || [recipientGroup];
  }
  return RBC_COMPATIBILITY[recipientGroup] || [recipientGroup];
};

module.exports = { isCompatible, getCompatibleDonorGroups };
