import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllHospitals, approveHospital } from "../../api/hospital.api.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const AdminHospitals = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isApproved, setIsApproved] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["adminHospitals", { search, isApproved, page }],
    queryFn: () =>
      getAllHospitals({
        search: search || undefined,
        isApproved: isApproved !== "" ? isApproved : undefined,
        page,
        limit: 10,
      }),
    keepPreviousData: true,
  });

  const hospitals = data?.data?.hospitals || [];
  const pagination = data?.data?.pagination || { totalPages: 1, total: 0 };

  const approvalMutation = useMutation({
    mutationFn: ({ id, isApproved }) => approveHospital(id, isApproved),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(["adminHospitals"]);
      toast.success(vars.isApproved ? "Hospital license verified & approved!" : "Hospital approval revoked.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update hospital status.");
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hospital Partner Registry</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Verify medical facility credentials, check licenses, and authorize blood requisitions
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Search by hospital name, city, or license number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-80 px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <select
          value={isApproved}
          onChange={(e) => {
            setIsApproved(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Verification Statuses</option>
          <option value="false">Pending Approval Only</option>
          <option value="true">Approved / Verified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner center size="lg" />
        ) : hospitals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-4xl">🏥</span>
            <p className="font-bold text-slate-700">No Hospitals Found</p>
            <p className="text-xs text-slate-400">Try modifying your search or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Hospital Name & Type</th>
                  <th className="px-6 py-4">License Reg. No</th>
                  <th className="px-6 py-4">Emergency Contact</th>
                  <th className="px-6 py-4">City / State</th>
                  <th className="px-6 py-4">Total Orders</th>
                  <th className="px-6 py-4">Units Received</th>
                  <th className="px-6 py-4">License Status</th>
                  <th className="px-6 py-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitals.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{h.hospitalName}</p>
                      <p className="text-xs text-slate-400 capitalize">{h.type} Facility</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-700">
                      {h.licenseNumber}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <p className="font-semibold text-slate-800">{h.contactInfo?.phone}</p>
                      <p className="text-slate-400">{h.contactInfo?.email || "No email"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                      {h.address?.city}, {h.address?.state}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{h.totalRequestsMade || 0}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {h.totalUnitsFulfilled || 0} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        label={h.isApproved ? "Approved" : "Pending Review"}
                        variant={h.isApproved ? "success" : "warning"}
                        dot
                      />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {h.isApproved ? (
                        <button
                          onClick={() => approvalMutation.mutate({ id: h._id, isApproved: false })}
                          disabled={approvalMutation.isPending}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition"
                        >
                          Revoke Approval
                        </button>
                      ) : (
                        <button
                          onClick={() => approvalMutation.mutate({ id: h._id, isApproved: true })}
                          disabled={approvalMutation.isPending}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                        >
                          Verify & Approve ✓
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default AdminHospitals;
