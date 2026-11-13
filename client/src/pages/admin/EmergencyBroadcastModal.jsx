import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { broadcastEmergencyShortage } from "../../api/notification.api.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EmergencyBroadcastModal = ({ isOpen, onClose, defaultGroup = "O+" }) => {
  const [bloodGroup, setBloodGroup] = useState(defaultGroup);
  const [customMessage, setCustomMessage] = useState("");

  const broadcastMutation = useMutation({
    mutationFn: broadcastEmergencyShortage,
    onSuccess: (data) => {
      toast.success(data.message || "Emergency alert broadcast sent!");
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to broadcast alert.");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    broadcastMutation.mutate({ bloodGroup, message: customMessage });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 text-red-600">
            <span className="text-3xl">🚨</span>
            <div>
              <h2 className="text-lg font-black text-slate-800">Emergency Shortage Broadcast</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Alert all active eligible donors via in-app & email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Target Blood Group *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  type="button"
                  key={bg}
                  onClick={() => setBloodGroup(bg)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    bloodGroup === bg
                      ? "bg-red-600 border-red-600 text-white shadow-sm"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Custom Appeal Note (Optional)
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Critical stock deficit for pediatric trauma patients at General Hospital. Walk-ins welcomed today."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-800">
            ℹ️ This broadcast will target only active donors whose health interval exceeds 56 days and
            possess the selected blood type.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={broadcastMutation.isPending}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition disabled:opacity-50"
            >
              {broadcastMutation.isPending ? "Broadcasting..." : `Send Alert to ${bloodGroup} Donors`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyBroadcastModal;
