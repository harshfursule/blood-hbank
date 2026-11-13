import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStockSummary, getExpiringSoon } from "../../api/bloodUnit.api.js";
import AddBloodUnitModal from "./AddBloodUnitModal.jsx";
import BloodUnitsList from "./BloodUnitsList.jsx";
import EmergencyBroadcastModal from "../admin/EmergencyBroadcastModal.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const InventoryDashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["stockSummary"],
    queryFn: getStockSummary,
    refetchInterval: 30000,
  });

  const { data: expiringData } = useQuery({
    queryKey: ["expiringSoon"],
    queryFn: getExpiringSoon,
  });

  const summary = summaryData?.data || {
    totalAvailable: 0,
    expiringSoonCount: 0,
    discardedThisMonth: 0,
    byGroup: {},
    byComponent: [],
  };

  const expiringUnits = expiringData?.data?.units || [];

  const getStockStatus = (count) => {
    if (count > 10) return { label: "Sufficient", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (count >= 3) return { label: "Low", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { label: "Critical Shortage", color: "text-red-600 bg-red-50 border-red-200" };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Blood Bank Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time stock levels, FIFO expiry alerts & unit allocation
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-1.5"
          >
            🚨 Emergency Broadcast
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition flex items-center gap-2"
          >
            ➕ Register Blood Unit
          </button>
        </div>
      </div>

      {/* Expiry Warning Banner (If any units expiring within 3 days) */}
      {summary.expiringSoonCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {summary.expiringSoonCount} Unit(s) Expiring Within 3 Days!
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Prioritize these units for upcoming hospital requests to prevent clinical wastage.
              </p>
            </div>
          </div>
          <div className="hidden md:flex gap-1">
            {expiringUnits.slice(0, 3).map((u) => (
              <span
                key={u._id}
                className="px-2 py-1 bg-black/20 rounded-lg text-xs font-mono font-bold"
              >
                {u.bagId?.slice(-8)} ({u.bloodGroup})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Overall KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 text-2xl flex items-center justify-center font-bold">
            🩸
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Units Available
            </p>
            <p className="text-2xl font-black text-slate-800">{summary.totalAvailable} Bags</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 text-2xl flex items-center justify-center font-bold">
            ⏳
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Expiring This Week
            </p>
            <p className="text-2xl font-black text-amber-600">{summary.expiringSoonCount} Bags</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 text-2xl flex items-center justify-center font-bold">
            🗑️
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Discarded This Month
            </p>
            <p className="text-2xl font-black text-slate-800">{summary.discardedThisMonth} Bags</p>
          </div>
        </div>
      </div>

      {/* Stock Levels by Blood Group Heatmap Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">Live Stock by Blood Group</h2>
        {isSummaryLoading ? (
          <Spinner center />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {BLOOD_GROUPS.map((group) => {
              const data = summary.byGroup[group] || { count: 0, totalVolumeMl: 0 };
              const status = getStockStatus(data.count);

              return (
                <div
                  key={group}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between text-center relative overflow-hidden"
                >
                  <div className="flex items-center justify-center mb-2">
                    <BloodGroupBadge group={group} size="md" />
                  </div>
                  <div className="my-1">
                    <span className="text-2xl font-black text-slate-800">{data.count}</span>
                    <span className="text-xs text-slate-400 block font-medium">units</span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-block w-full py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Component Distribution Bar */}
      {summary.byComponent?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Available Inventory by Component
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {summary.byComponent.map((comp) => (
              <div key={comp._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">{comp._id}</p>
                <p className="text-lg font-black text-slate-800 mt-1">{comp.count} bags</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Units Table */}
      <div className="pt-2">
        <h2 className="text-base font-bold text-slate-800 mb-3">All Blood Unit Bags</h2>
        <BloodUnitsList />
      </div>

      {/* Modals */}
      <AddBloodUnitModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EmergencyBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />
    </div>
  );
};

export default InventoryDashboard;
