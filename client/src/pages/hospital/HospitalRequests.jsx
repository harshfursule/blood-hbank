import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getAllBloodRequests, confirmBloodReceived } from "../../api/request.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const HospitalRequests = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["myHospitalRequests", { page, status: statusFilter }],
    queryFn: () => getAllBloodRequests({ page, status: statusFilter || undefined, limit: 8 }),
    keepPreviousData: true,
  });

  const requests = data?.data?.requests || [];
  const pagination = data?.data?.pagination || { totalPages: 1, total: 0 };

  const confirmMutation = useMutation({
    mutationFn: (id) => confirmBloodReceived(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["myHospitalRequests"]);
      toast.success("Receipt confirmed. Thank you!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to confirm receipt.");
    },
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "emergency":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 animate-pulse">Emergency</span>;
      case "urgent":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Urgent</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-slate-100 text-slate-600">Routine</span>;
    }
  };

  const getStepStatus = (status, stepName) => {
    const order = ["pending", "approved", "dispatched", "received"];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepName);

    if (status === "rejected" || status === "cancelled") return "text-slate-300";
    if (stepIndex < currentIndex) return "text-emerald-600 font-bold";
    if (stepIndex === currentIndex) return "text-red-600 font-bold underline";
    return "text-slate-400";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hospital Blood Requests</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track order fulfillment status and confirm inbound dispatches
          </p>
        </div>

        <Link
          to="/hospital/new-request"
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-red-200 transition flex items-center gap-2 self-start sm:self-auto"
        >
          ➕ Order Blood Supplies
        </Link>
      </div>

      {/* Requests Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner center size="lg" />
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-5xl">📋</span>
            <h3 className="font-bold text-slate-700 text-lg">No Blood Requests Placed</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              You haven't requested any blood supplies yet. Place an order for routine surgeries or emergency needs.
            </p>
            <Link
              to="/hospital/new-request"
              className="mt-4 inline-block px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
            >
              Order Blood
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r._id} className="p-6 hover:bg-slate-50/50 transition space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BloodGroupBadge group={r.bloodGroup} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-800">
                          {r.unitsNeeded} unit(s) of {r.component}
                        </span>
                        {getUrgencyBadge(r.urgency)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ordered on {formatDate(r.createdAt)} • Ref #{r._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge
                      label={r.status}
                      variant={
                        r.status === "received"
                          ? "success"
                          : r.status === "dispatched"
                          ? "info"
                          : r.status === "approved"
                          ? "purple"
                          : r.status === "rejected"
                          ? "danger"
                          : "warning"
                      }
                      dot
                    />

                    {r.status === "dispatched" && (
                      <button
                        onClick={() => confirmMutation.mutate(r._id)}
                        disabled={confirmMutation.isPending}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                      >
                        Confirm Receipt ✓
                      </button>
                    )}
                  </div>
                </div>

                {/* Tracking Stepper */}
                <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between text-xs font-medium">
                  <span className={getStepStatus(r.status, "pending")}>1. Request Submitted</span>
                  <span className="text-slate-300">➔</span>
                  <span className={getStepStatus(r.status, "approved")}>2. Units Allocated</span>
                  <span className="text-slate-300">➔</span>
                  <span className={getStepStatus(r.status, "dispatched")}>3. Dispatched</span>
                  <span className="text-slate-300">➔</span>
                  <span className={getStepStatus(r.status, "received")}>4. Received</span>
                </div>

                {/* Extra info: patient or rejection */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                  <span>
                    {r.patientName ? `Patient: ${r.patientName}` : "General Stock Request"}
                    {r.diagnosis && ` (${r.diagnosis})`}
                  </span>

                  {r.rejectionReason && (
                    <span className="text-red-600 font-semibold">
                      Reason: {r.rejectionReason}
                    </span>
                  )}

                  {r.assignedUnits?.length > 0 && (
                    <span className="font-mono text-slate-600">
                      Bags assigned: {r.assignedUnits.map((u) => u.bagId).join(", ")}
                    </span>
                  )}
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

export default HospitalRequests;
