import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore.js";

/**
 * ProtectedRoute — Redirects unauthenticated users to /login.
 * Wraps all role-protected routes.
 */
const ProtectedRoute = () => {
  const { user, accessToken } = useAuthStore();

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
