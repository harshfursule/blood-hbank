import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/authStore.js";
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../api/notification.api.js";
import { formatDate } from "../../utils/helpers.js";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Unread badge query (refreshes every 20s)
  const { data: countData } = useQuery({
    queryKey: ["unreadNotificationsCount"],
    queryFn: getUnreadNotificationsCount,
    refetchInterval: 20000,
  });

  // Recent notifications preview
  const { data: listData } = useQuery({
    queryKey: ["notificationsDropdown"],
    queryFn: () => getMyNotifications({ limit: 5 }),
    enabled: dropdownOpen,
  });

  const unreadCount = countData?.data?.unreadCount || 0;
  const notifications = listData?.data?.notifications || [];

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(["unreadNotificationsCount"]);
      queryClient.invalidateQueries(["notificationsDropdown"]);
      queryClient.invalidateQueries(["myNotificationsList"]);
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["unreadNotificationsCount"]);
      queryClient.invalidateQueries(["notificationsDropdown"]);
      queryClient.invalidateQueries(["myNotificationsList"]);
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "emergency_alert":
        return "🚨";
      case "low_stock":
        return "🩸";
      case "request_approved":
        return "✅";
      case "request_rejected":
        return "❌";
      case "dispatch_confirmed":
        return "🚑";
      case "eligibility_reminder":
        return "⏰";
      default:
        return "🔔";
    }
  };

  const roleColors = {
    admin: "bg-purple-100 text-purple-700",
    donor: "bg-red-100 text-red-700",
    hospital: "bg-blue-100 text-blue-700",
    technician: "bg-green-100 text-green-700",
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm relative z-30">
      {/* Left: App branding */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🩸</span>
        <span className="font-bold text-slate-800 text-lg tracking-tight">BloodBank</span>
      </div>

      {/* Right: Notification bell + User profile */}
      <div className="flex items-center gap-4">
        {/* Interactive Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center px-1 shadow-sm animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Flyout */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-sm z-50">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No recent notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markSingleMutation.mutate(n._id)}
                      className={`p-3.5 flex items-start gap-3 transition cursor-pointer ${
                        n.isRead ? "bg-white opacity-80" : "bg-red-50/40 hover:bg-red-50"
                      }`}
                    >
                      <span className="text-xl mt-0.5">{getNotificationIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-xs text-slate-800 truncate">{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatDate(n.sentAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-slate-100 text-center bg-slate-50">
                <Link
                  to="/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="text-xs font-bold text-red-600 hover:underline block"
                >
                  View All Notifications History →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                roleColors[user?.role] || "bg-slate-100 text-slate-600"
              }`}
            >
              {user?.role}
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm uppercase">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium"
          title="Logout"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
