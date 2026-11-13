import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore.js";

// ── Layouts ────────────────────────────────────────────────────────────────────
import MainLayout from "./components/layout/MainLayout.jsx";

// ── Route Guards ───────────────────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute      from "./routes/RoleRoute.jsx";

// ── Auth Pages ─────────────────────────────────────────────────────────────────
import Login          from "./pages/auth/Login.jsx";
import Register       from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword  from "./pages/auth/ResetPassword.jsx";
import VerifyEmail    from "./pages/auth/VerifyEmail.jsx";

// ── Shared Pages ───────────────────────────────────────────────────────────────
import NotFound from "./pages/NotFound.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";

// ── Role-specific Pages ───────────────────────────────────────────────────────
import AdminDashboard      from "./pages/admin/AdminDashboard.jsx";
import AdminDonors         from "./pages/admin/AdminDonors.jsx";
import AdminRequests       from "./pages/admin/AdminRequests.jsx";
import AdminHospitals      from "./pages/admin/AdminHospitals.jsx";
import AdminReports        from "./pages/admin/AdminReports.jsx";
import InventoryDashboard  from "./pages/inventory/InventoryDashboard.jsx";
import DonorDashboard      from "./pages/donor/DonorDashboard.jsx";
import DonorRegister       from "./pages/donor/DonorRegister.jsx";
import DonorProfile        from "./pages/donor/DonorProfile.jsx";
import DonationHistory     from "./pages/donor/DonationHistory.jsx";
import DonorIdCard         from "./pages/donor/DonorIdCard.jsx";
import HospitalDashboard   from "./pages/hospital/HospitalDashboard.jsx";
import HospitalRegister    from "./pages/hospital/HospitalRegister.jsx";
import NewBloodRequest     from "./pages/hospital/NewBloodRequest.jsx";
import HospitalRequests    from "./pages/hospital/HospitalRequests.jsx";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard.jsx";

function App() {
  const { user } = useAuthStore();

  // Redirect logged-in users to their role-based dashboard
  const getDashboardPath = () => {
    if (!user) return "/login";
    const paths = {
      admin:      "/admin/dashboard",
      donor:      "/donor/dashboard",
      hospital:   "/hospital/dashboard",
      technician: "/technician/dashboard",
    };
    return paths[user.role] || "/login";
  };

  return (
    <Routes>
      {/* ── Public Routes ── */}
      <Route path="/login"                    element={<Login />} />
      <Route path="/register"                 element={<Register />} />
      <Route path="/forgot-password"          element={<ForgotPassword />} />
      <Route path="/reset-password/:token"    element={<ResetPassword />} />
      <Route path="/verify-email/:token"      element={<VerifyEmail />} />

      {/* ── Root: redirect to dashboard or login ── */}
      <Route path="/" element={<Navigate to={getDashboardPath()} replace />} />

      {/* ── Protected Routes (require login) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Shared across all logged-in roles */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Admin */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/donors"    element={<AdminDonors />} />
            <Route path="/admin/inventory" element={<InventoryDashboard />} />
            <Route path="/admin/requests"  element={<AdminRequests />} />
            <Route path="/admin/hospitals" element={<AdminHospitals />} />
            <Route path="/admin/reports"   element={<AdminReports />} />
          </Route>

          {/* Donor */}
          <Route element={<RoleRoute allowedRoles={["donor"]} />}>
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/donor/register"  element={<DonorRegister />} />
            <Route path="/donor/profile"   element={<DonorProfile />} />
            <Route path="/donor/history"   element={<DonationHistory />} />
            <Route path="/donor/id-card"   element={<DonorIdCard />} />
          </Route>

          {/* Hospital */}
          <Route element={<RoleRoute allowedRoles={["hospital"]} />}>
            <Route path="/hospital/dashboard"   element={<HospitalDashboard />} />
            <Route path="/hospital/register"    element={<HospitalRegister />} />
            <Route path="/hospital/new-request" element={<NewBloodRequest />} />
            <Route path="/hospital/requests"    element={<HospitalRequests />} />
          </Route>

          {/* Technician */}
          <Route element={<RoleRoute allowedRoles={["technician"]} />}>
            <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
            <Route path="/technician/inventory" element={<InventoryDashboard />} />
            <Route path="/technician/requests"  element={<AdminRequests />} />
          </Route>

        </Route>
      </Route>

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
