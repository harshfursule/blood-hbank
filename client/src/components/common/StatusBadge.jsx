/**
 * StatusBadge — Generic colored status pill
 */
const VARIANTS = {
  success:  "bg-green-100  text-green-700",
  warning:  "bg-yellow-100 text-yellow-700",
  danger:   "bg-red-100    text-red-700",
  info:     "bg-blue-100   text-blue-700",
  default:  "bg-slate-100  text-slate-600",
  purple:   "bg-purple-100 text-purple-700",
};

const StatusBadge = ({ label, variant = "default", dot = false }) => {
  const cls = VARIANTS[variant] || VARIANTS.default;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
};

export default StatusBadge;
