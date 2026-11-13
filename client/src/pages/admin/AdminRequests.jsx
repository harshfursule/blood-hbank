import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getAllBloodRequests,
  getBloodRequestById,
  approveBloodRequest,
  rejectBloodRequest,
  dispatchBloodRequest,
  getRequestStats,
} from "../../api/request.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const AdminRequests = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [urgency, setUrgency] = useState("");
  const [page, setPage] = useState(1);
  const [inspectRequestId, setInspectRequestId] = useState(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [dispatchMethod, setDispatchMethod] = useState("ambulance");
  const [dispatchTracking, setDispatchTracking] = useState("");

  const { data: statsData } = useQuery({
    queryKey: ["requestStats"],
    queryFn: getRequestStats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["adminRequests", { status, urgency, page }],
    queryFn: () =>
      getAllBloodRequests({
        status: status || undefined,
        urgency: urgency || undefined,
        page,
        limit: 10,
      }),
    keepPreviousData: true,
  });

  // Modal Query: inspect single request & fetch compatible FIFO units
  const { data: inspectData, isLoading: isInspectLoading } = useQuery({
    queryKey: ["inspectRequest", inspectRequestId],
    queryFn: () => getBloodRequestById(inspectRequestId),
    enabled: !!inspectRequestId,
  });

  const stats = statsData?.data || { pending: 0, approved: 0, dispatched: 0, received: 0, emergencyCount: 0 };
  const requests = data?.data?.requests || [];
  const pagination = data?.data?.pagination || { totalPages: 1, total: 0 };

  const inspectedRequest = inspectData?.data?.request;
  const compatibleUnits = inspectData?.data?.compatibleUnits || [];
  const dispatchInfo = inspectData?.data?.dispatchInfo;

  const approveMutation = useMutation({
    mutationFn: ({ id, unitIds }) => approveBloodRequest(id, { unitIds }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminRequests"]);
      queryClient.invalidateQueries(["requestStats"]);
      queryClient.invalidateQueries(["inspectRequest"]);
      toast.success("Request approved and blood units reserved.");
      setInspectRequestId(null);
      setSelectedUnitIds([]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to approve request.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectBloodRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminRequests"]);
      queryClient.invalidateQueries(["requestStats"]);
      toast.success("Request rejected.");
      setInspectRequestId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to reject request.");
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ id, deliveryMethod, trackingNumber }) =>
      dispatchBloodRequest(id, { deliveryMethod, trackingNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminRequests"]);
      queryClient.invalidateQueries(["requestStats"]);
      toast.success("Blood units dispatched for delivery.");
      setInspectRequestId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to dispatch blood.");
    },
  });

  const toggleUnitSelection = (unitId) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Hospital Request Queue</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Process blood orders, match compatible units, and dispatch life-saving supplies
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => { setStatus("pending"); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            status === "pending" ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</p>
        </div>

        <div
          onClick={() => { setStatus("approved"); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            status === "approved" ? "bg-purple-50 border-purple-300 ring-2 ring-purple-400" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved (Ready)</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{stats.approved}</p>
        </div>

        <div
          onClick={() => { setStatus("dispatched"); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            status === "dispatched" ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In-Transit</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.dispatched}</p>
        </div>

        <div
          onClick={() => { setStatus("received"); setPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            status === "received" ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fulfilled</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.received}</p>
        </div>
      </div>

      {/* Emergency Alert if any pending emergency requests */}
      {stats.emergencyCount > 0 && status === "pending" && (
        <div className="p-4 rounded-2xl bg-red-600 text-white font-bold flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <p className="text-sm">
              ATTENTION: {stats.emergencyCount} Critical EMERGENCY Blood Request(s) require immediate review!
            </p>
          </div>
          <button
            onClick={() => setUrgency("emergency")}
            className="px-3 py-1 bg-white text-red-700 text-xs font-black rounded-lg"
          >
            Filter Emergency Only
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgency:</span>
          <select
            value={urgency}
            onChange={(e) => {
              setUrgency(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Priorities</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        {urgency && (
          <button
            onClick={() => setUrgency("")}
            className="text-xs text-red-600 font-semibold hover:underline"
          >
            Reset Priority Filter
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner center size="lg" />
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-4xl">✓</span>
            <p className="font-bold text-slate-700">No Requests Found</p>
            <p className="text-xs text-slate-400">All blood orders for this status filter have been handled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Hospital</th>
                  <th className="px-5 py-3.5">Required Group</th>
                  <th className="px-5 py-3.5">Component & Qty</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Patient / Diagnosis</th>
                  <th className="px-5 py-3.5">Order Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{r.hospitalId?.hospitalName || "Unknown Hospital"}</p>
                      <p className="text-[11px] text-slate-400">{r.hospitalId?.contactInfo?.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <BloodGroupBadge group={r.bloodGroup} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-800 font-medium">
                      {r.unitsNeeded} unit(s) • <span className="text-slate-500 text-xs">{r.component}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          r.urgency === "emergency"
                            ? "bg-red-100 text-red-700 animate-pulse"
                            : r.urgency === "urgent"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                      {r.patientName ? `${r.patientName} (${r.patientAge || "?"}y)` : "Stock"}
                      {r.diagnosis && ` - ${r.diagnosis}`}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge label={r.status} dot />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setInspectRequestId(r._id);
                          setSelectedUnitIds([]);
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                      >
                        {r.status === "pending"
                          ? "Match & Approve"
                          : r.status === "approved"
                          ? "Dispatch Units"
                          : "Inspect Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection & Processing Modal */}
      {inspectRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Review</span>
                <h3 className="font-bold text-lg text-slate-800 mt-0.5">
                  {inspectedRequest?.hospitalId?.hospitalName}
                </h3>
              </div>
              <button
                onClick={() => setInspectRequestId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {isInspectLoading ? (
              <Spinner center />
            ) : inspectedRequest ? (
              <div className="space-y-4 text-xs sm:text-sm">
                {/* Order Summary Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Requested Group</span>
                    <BloodGroupBadge group={inspectedRequest.bloodGroup} size="sm" />
                  </div>
                  <div>
                    <span className="text-slate-400 block">Required Component</span>
                    <span className="font-bold text-slate-700">{inspectedRequest.component}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Units Required</span>
                    <span className="font-black text-red-600 text-base">{inspectedRequest.unitsNeeded} unit(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Priority</span>
                    <span className="font-bold capitalize">{inspectedRequest.urgency}</span>
                  </div>
                </div>

                {/* Status: PENDING ➔ Compatible Units Selection for Approval */}
                {inspectedRequest.status === "pending" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Available Compatible Blood Units (FIFO Ordered)
                      </h4>
                      <span className="text-xs font-semibold text-slate-500">
                        Selected:{" "}
                        <strong className="text-red-600">{selectedUnitIds.length}</strong> /{" "}
                        {inspectedRequest.unitsNeeded}
                      </span>
                    </div>

                    {compatibleUnits.length === 0 ? (
                      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-800">
                        <p className="font-bold">⚠️ No Compatible Blood Units Available in Stock</p>
                        <p className="text-xs mt-1">
                          You may need to reject this request or trigger a donor emergency drive.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                        {compatibleUnits.map((u) => {
                          const isSelected = selectedUnitIds.includes(u._id);
                          return (
                            <div
                              key={u._id}
                              onClick={() => toggleUnitSelection(u._id)}
                              className={`p-3 flex items-center justify-between cursor-pointer transition ${
                                isSelected ? "bg-red-50" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-red-600"
                                />
                                <div>
                                  <span className="font-mono text-xs font-bold text-slate-800">
                                    {u.bagId}
                                  </span>
                                  <p className="text-[11px] text-slate-400">
                                    Expires: {formatDate(u.expiresAt)} • Loc: {u.storageLocation?.unit}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <BloodGroupBadge group={u.bloodGroup} size="sm" />
                                <span className="text-xs font-semibold text-slate-600">
                                  {u.volumeMl}ml
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          const reason = prompt("Enter rejection reason for hospital:");
                          if (reason) rejectMutation.mutate({ id: inspectedRequest._id, reason });
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50"
                      >
                        Reject Request
                      </button>

                      <button
                        disabled={
                          selectedUnitIds.length < inspectedRequest.unitsNeeded ||
                          approveMutation.isPending
                        }
                        onClick={() =>
                          approveMutation.mutate({
                            id: inspectedRequest._id,
                            unitIds: selectedUnitIds,
                          })
                        }
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition"
                      >
                        {approveMutation.isPending ? "Allocating..." : "Approve & Reserve Units"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Status: APPROVED ➔ Dispatch Units Generator */}
                {inspectedRequest.status === "approved" && (
                  <div className="space-y-4 pt-2">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-purple-900 text-xs">
                      <strong>Units Reserved:</strong> {inspectedRequest.assignedUnits?.length} bags are
                      staged for transfer.
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Delivery Transport *
                        </label>
                        <select
                          value={dispatchMethod}
                          onChange={(e) => setDispatchMethod(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value="ambulance">Hospital Emergency Ambulance</option>
                          <option value="courier">Cold-Chain Medical Courier</option>
                          <option value="pickup">Hospital Rep Pickup</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Transport Tracking Ref / Driver
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. AMB-902 / Driver Rajesh"
                          value={dispatchTracking}
                          onChange={(e) => setDispatchTracking(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-slate-100">
                      <button
                        disabled={dispatchMutation.isPending}
                        onClick={() =>
                          dispatchMutation.mutate({
                            id: inspectedRequest._id,
                            deliveryMethod: dispatchMethod,
                            trackingNumber: dispatchTracking,
                          })
                        }
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition"
                      >
                        {dispatchMutation.isPending ? "Dispatching..." : "Confirm & Dispatch Blood"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Status: DISPATCHED / RECEIVED ➔ Read-only Log */}
                {(inspectedRequest.status === "dispatched" || inspectedRequest.status === "received") && (
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs text-slate-600">
                    <p>
                      <strong>Dispatched By:</strong> {dispatchInfo?.dispatchedBy?.name || "Technician"}
                    </p>
                    <p>
                      <strong>Delivery Method:</strong> {dispatchInfo?.deliveryMethod} (
                      {dispatchInfo?.trackingNumber || "No tracking #"})
                    </p>
                    {dispatchInfo?.receivedAt && (
                      <p className="text-emerald-700 font-semibold">
                        ✓ Received at destination on {formatDate(dispatchInfo.receivedAt)} by{" "}
                        {dispatchInfo.receivedBy}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
