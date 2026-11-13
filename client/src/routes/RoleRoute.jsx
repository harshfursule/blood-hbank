import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore.js";

/**
 * RoleRoute — Restricts a route to specific roles.
 * If the user's role is not in allowedRoles, redirect to their dashboard.
 *
 * @param {string[]} allowedRoles - e.g., ["admin", "technician"]
 */
const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    // Redirect to own dashboard instead of showing 403
    const dashboardPaths = {
      admin:      "/admin/dashboard",
      donor:      "/donor/dashboard",
      hospital:   "/hospital/dashboard",
      technician: "/technician/dashboard",
    };
    return <Navigate to={dashboardPaths[user.role] || "/login"} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
