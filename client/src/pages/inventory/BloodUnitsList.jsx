import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllBloodUnits, updateBloodUnit, discardBloodUnit } from "../../api/bloodUnit.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUSES = ["available", "reserved", "used", "expired", "discarded", "quarantine"];

const BloodUnitsList = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [qrModalUnit, setQrModalUnit] = useState(null);
  const [discardUnit, setDiscardUnit] = useState(null);
  const [discardReason, setDiscardReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bloodUnits", { search, bloodGroup, status, page }],
    queryFn: () =>
      getAllBloodUnits({
        search: search || undefined,
        bloodGroup: bloodGroup || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
    keepPreviousData: true,
  });

  const units = data?.data?.units || [];
  const pagination = data?.data?.pagination || { totalPages: 1, total: 0 };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateBloodUnit(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["bloodUnits"]);
      queryClient.invalidateQueries(["stockSummary"]);
      toast.success("Unit status updated.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update status.");
    },
  });

  const discardMutation = useMutation({
    mutationFn: ({ id, reason }) => discardBloodUnit(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(["bloodUnits"]);
      queryClient.invalidateQueries(["stockSummary"]);
      toast.success("Unit marked as discarded.");
      setDiscardUnit(null);
      setDiscardReason("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to discard unit.");
    },
  });

  const getStatusVariant = (st) => {
    switch (st) {
      case "available":
        return "success";
      case "reserved":
        return "warning";
      case "used":
        return "info";
      case "expired":
      case "discarded":
        return "danger";
      case "quarantine":
        return "purple";
      default:
        return "default";
    }
  };

  const getDaysLeft = (expiry) => {
    const diff = new Date(expiry).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search Bag ID (e.g. BAG-A+...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <select
            value={bloodGroup}
            onChange={(e) => {
              setBloodGroup(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {(search || bloodGroup || status) && (
          <button
            onClick={() => {
              setSearch("");
              setBloodGroup("");
              setStatus("");
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner center size="lg" />
        ) : isError ? (
          <div className="p-12 text-center text-slate-500">Failed to load inventory units.</div>
        ) : units.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-4xl">🩸</span>
            <p className="font-bold text-slate-700">No Blood Units Found</p>
            <p className="text-xs text-slate-400">Add bags or modify the active filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Bag ID & QR</th>
                    <th className="px-5 py-3.5">Group</th>
                    <th className="px-5 py-3.5">Component</th>
                    <th className="px-5 py-3.5">Volume</th>
                    <th className="px-5 py-3.5">Expiry / Days Left</th>
                    <th className="px-5 py-3.5">Storage Location</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units.map((u) => {
                    const days = getDaysLeft(u.expiresAt);
                    const isNearExpiry = u.status === "available" && days <= 3 && days >= 0;
                    const isPast = days < 0;

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {u.qrCodeUrl && (
                              <button
                                onClick={() => setQrModalUnit(u)}
                                className="w-7 h-7 p-0.5 rounded border border-slate-200 hover:border-red-500 transition"
                                title="Click to enlarge QR"
                              >
                                <img src={u.qrCodeUrl} alt="QR" className="w-full h-full" />
                              </button>
                            )}
                            <span className="font-mono text-xs font-bold text-slate-800">{u.bagId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <BloodGroupBadge group={u.bloodGroup} size="sm" />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                          {u.component}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-700">
                          {u.volumeMl} ml
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                          <div className="font-semibold text-slate-800">{formatDate(u.expiresAt)}</div>
                          <div
                            className={`text-[11px] font-bold ${
                              isPast
                                ? "text-red-600"
                                : isNearExpiry
                                ? "text-amber-600 animate-pulse"
                                : "text-slate-400"
                            }`}
                          >
                            {isPast ? "Expired" : `${days} days remaining`}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          {u.storageLocation?.unit || "Refrig-1"} / {u.storageLocation?.shelf || "A"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusBadge label={u.status} variant={getStatusVariant(u.status)} dot />
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                          <div className="flex justify-end gap-1.5">
                            {u.status === "available" && (
                              <>
                                <button
                                  onClick={() =>
                                    statusMutation.mutate({ id: u._id, status: "reserved" })
                                  }
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-lg"
                                >
                                  Reserve
                                </button>
                                <button
                                  onClick={() => setDiscardUnit(u)}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg"
                                >
                                  Discard
                                </button>
                              </>
                            )}
                            {u.status === "reserved" && (
                              <button
                                onClick={() =>
                                  statusMutation.mutate({ id: u._id, status: "available" })
                                }
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg"
                              >
                                Release
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} units)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 border border-slate-300 text-xs rounded-lg font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 border border-slate-300 text-xs rounded-lg font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Code Inspection Modal */}
      {qrModalUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <h3 className="font-bold text-lg text-slate-800">Unit Identification Tag</h3>
            <p className="text-xs text-slate-500 font-mono font-bold">{qrModalUnit.bagId}</p>
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
              <img
                src={qrModalUnit.qrCodeUrl}
                alt="Blood Unit QR"
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Blood Group:</strong> {qrModalUnit.bloodGroup} • {qrModalUnit.component}
              </p>
              <p>
                <strong>Expires:</strong> {formatDate(qrModalUnit.expiresAt)}
              </p>
            </div>
            <button
              onClick={() => setQrModalUnit(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
            >
              Close Tag
            </button>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {discardUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-lg text-slate-800">Discard Blood Unit</h3>
            </div>
            <p className="text-xs text-slate-500">
              Confirm discarding unit <strong className="font-mono">{discardUnit.bagId}</strong> (
              {discardUnit.bloodGroup} - {discardUnit.component}). This unit will no longer be
              available for patient transfusion.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Discard Reason *
              </label>
              <input
                type="text"
                placeholder="e.g. Broken seal, hemolyzed, expired, screening failure"
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDiscardUnit(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={!discardReason || discardMutation.isPending}
                onClick={() =>
                  discardMutation.mutate({ id: discardUnit._id, reason: discardReason })
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {discardMutation.isPending ? "Discarding..." : "Confirm Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodUnitsList;
