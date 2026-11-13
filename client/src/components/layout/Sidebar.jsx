import { NavLink } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";

/**
 * Navigation items per role.
 * Each phase will add more links as features are built.
 */
const NAV_ITEMS = {
  admin: [
    { label: "Dashboard",   path: "/admin/dashboard",   icon: "📊" },
    { label: "Donors",      path: "/admin/donors",       icon: "🧑‍🤝‍🧑" },
    { label: "Inventory",   path: "/admin/inventory",    icon: "🩸" },
    { label: "Requests",    path: "/admin/requests",     icon: "📋" },
    { label: "Hospitals",   path: "/admin/hospitals",    icon: "🏥" },
    { label: "Reports",     path: "/admin/reports",      icon: "📈" },
    { label: "Settings",    path: "/admin/settings",     icon: "⚙️" },
  ],
  donor: [
    { label: "Dashboard",        path: "/donor/dashboard",        icon: "📊" },
    { label: "My Profile",       path: "/donor/profile",          icon: "👤" },
    { label: "Donation History", path: "/donor/history",          icon: "📋" },
    { label: "My ID Card",       path: "/donor/id-card",          icon: "🪪" },
  ],
  hospital: [
    { label: "Dashboard",    path: "/hospital/dashboard",    icon: "📊" },
    { label: "New Request",  path: "/hospital/new-request",  icon: "➕" },
    { label: "My Requests",  path: "/hospital/requests",     icon: "📋" },
    { label: "Profile",      path: "/hospital/profile",      icon: "🏥" },
  ],
  technician: [
    { label: "Dashboard",   path: "/technician/dashboard",   icon: "📊" },
    { label: "Inventory",   path: "/technician/inventory",   icon: "🩸" },
    { label: "Requests",    path: "/technician/requests",    icon: "📋" },
    { label: "Donations",   path: "/technician/donations",   icon: "💉" },
  ],
};

/**
 * Sidebar — Role-aware navigation links.
 */
const Sidebar = () => {
  const { user } = useAuthStore();
  const navItems = NAV_ITEMS[user?.role] || [];

  return (
    <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col h-full shadow-xl">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🩸</span>
          <div>
            <p className="font-bold text-white text-base leading-tight">BloodBank</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role} Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-red-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700 text-xs text-slate-500">
        <p>BloodBank v1.0.0</p>
        <p className="mt-0.5">Saving lives, one drop at a time.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
