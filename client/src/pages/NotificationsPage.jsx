import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notification.api.js";
import Spinner from "../components/common/Spinner.jsx";
import { formatDate } from "../utils/helpers.js";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["myNotificationsList", { unreadOnly, page }],
    queryFn: () => getMyNotifications({ unreadOnly, page, limit: 12 }),
    keepPreviousData: true,
  });

  const notifications = data?.data?.notifications || [];
  const pagination = data?.data?.pagination || { totalPages: 1, total: 0 };
  const unreadCount = data?.data?.unreadCount || 0;

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(["myNotificationsList"]);
      queryClient.invalidateQueries(["unreadNotificationsCount"]);
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["myNotificationsList"]);
      queryClient.invalidateQueries(["unreadNotificationsCount"]);
    },
  });

  const getIcon = (type) => {
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            System alerts, order status updates, and emergency broadcasts
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            !unreadOnly ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          All Activity
        </button>

        <button
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            unreadOnly ? "bg-red-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Unread Only
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                unreadOnly ? "bg-white text-red-700" : "bg-red-100 text-red-700 font-black"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner center size="lg" />
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-4xl">🔔</span>
            <p className="font-bold text-slate-700">No Notifications</p>
            <p className="text-xs text-slate-400">You are completely up to date.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markSingleMutation.mutate(n._id)}
                className={`p-5 flex items-start gap-4 transition cursor-pointer ${
                  n.isRead ? "bg-white hover:bg-slate-50/50" : "bg-red-50/40 hover:bg-red-50/70"
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-800">{n.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(n.sentAt)}</span>
                      {!n.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-slate-300 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-300 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
