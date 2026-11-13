/**
 * Spinner — loading indicator
 */
const Spinner = ({ size = "md", center = false }) => {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={center ? "flex justify-center items-center py-12" : ""}>
      <svg
        className={`animate-spin ${sizes[size]} text-red-600`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
};

export default Spinner;
