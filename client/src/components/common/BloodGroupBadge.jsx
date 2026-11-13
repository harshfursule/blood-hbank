/**
 * BloodGroupBadge — Color-coded badge for blood groups
 */
const COLORS = {
  "A+":  "bg-red-100    text-red-700    border-red-200",
  "A-":  "bg-red-50     text-red-600    border-red-200",
  "B+":  "bg-blue-100   text-blue-700   border-blue-200",
  "B-":  "bg-blue-50    text-blue-600   border-blue-200",
  "AB+": "bg-purple-100 text-purple-700 border-purple-200",
  "AB-": "bg-purple-50  text-purple-600 border-purple-200",
  "O+":  "bg-green-100  text-green-700  border-green-200",
  "O-":  "bg-orange-100 text-orange-700 border-orange-200",
};

const BloodGroupBadge = ({ group, size = "md" }) => {
  const color = COLORS[group] || "bg-slate-100 text-slate-600 border-slate-200";
  const sizes  = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1 font-semibold",
    lg: "text-base px-3 py-1.5 font-bold",
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${color} ${sizes[size]}`}>
      🩸 {group}
    </span>
  );
};

export default BloodGroupBadge;
