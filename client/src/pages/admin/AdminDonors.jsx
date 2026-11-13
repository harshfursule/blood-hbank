import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllDonors, getDonorStats } from "../../api/donor.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const AdminDonors = () => {
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [isEligible, setIsEligible] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDonor, setSelectedDonor] = useState(null);

  const { data: statsData } = useQuery({
    queryKey: ["donorStats"],
    queryFn: getDonorStats,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminDonors", { search, bloodGroup, isEligible, city, page }],
    queryFn: () =>
      getAllDonors({
        search: search || undefined,
        bloodGroup: bloodGroup || undefined,
        isEligible: isEligible !== "" ? isEligible : undefined,
        city: city || undefined,
        page,
        limit: 10,
      }),
    keepPreviousData: true,
  });

  const stats = statsData?.data || { total: 0, eligible: 0, newThisMonth: 0 };
  const donors = data?.data?.donors || [];
  const pagination = data?.data?.pagination || { totalPages: 1, total: 0 };

  const handleResetFilters = () => {
    setSearch("");
    setBloodGroup("");
    setIsEligible("");
    setCity("");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Donor Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registered volunteer donors registry & eligibility tracker
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 text-2xl flex items-center justify-center font-bold">
            🧑‍🤝‍🧑
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Donors</p>
            <p className="text-2xl font-black text-slate-800">{stats.total || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center font-bold">
            ✅
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eligible Now</p>
            <p className="text-2xl font-black text-emerald-600">{stats.eligible || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 text-2xl flex items-center justify-center font-bold">
            ⭐
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New This Month</p>
            <p className="text-2xl font-black text-slate-800">{stats.newThisMonth || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search Donor
            </label>
            <input
              type="text"
              placeholder="Name, email or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Eligibility Status
            </label>
            <select
              value={isEligible}
              onChange={(e) => {
                setIsEligible(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Eligible Only</option>
              <option value="false">Deferred / Ineligible</option>
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              City
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filter city..."
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {(search || bloodGroup || isEligible || city) && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                  title="Reset Filters"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner center size="lg" />
        ) : isError ? (
          <div className="p-12 text-center text-slate-500">Failed to load donors list.</div>
        ) : donors.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-4xl">🔍</span>
            <p className="font-bold text-slate-700">No Donors Found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Donor Name</th>
                    <th className="px-6 py-4">Blood Group</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Total Done</th>
                    <th className="px-6 py-4">Last Donated</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donors.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{d.userId?.name || "Unnamed"}</div>
                        <div className="text-xs text-slate-400 capitalize">{d.gender || "—"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BloodGroupBadge group={d.bloodGroup} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-slate-800 font-medium">{d.userId?.phone || "—"}</div>
                        <div className="text-slate-400">{d.userId?.email || "—"}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700">
                        {d.address?.city || "—"}, {d.address?.state || "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {d.totalDonations || 0}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {d.lastDonatedAt ? formatDate(d.lastDonatedAt) : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          label={d.isEligible ? "Eligible" : "Deferred"}
                          variant={d.isEligible ? "success" : "warning"}
                          dot
                        />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedDonor(d)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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

      {/* Donor Details Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xl">
                  {selectedDonor.userId?.name?.charAt(0) || "D"}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{selectedDonor.userId?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <BloodGroupBadge group={selectedDonor.bloodGroup} size="sm" />
                    <StatusBadge
                      label={selectedDonor.isEligible ? "Eligible" : "Deferred"}
                      variant={selectedDonor.isEligible ? "success" : "warning"}
                      dot
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDonor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <p className="text-slate-400 text-xs">Email</p>
                  <p className="font-semibold text-slate-800">{selectedDonor.userId?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Phone</p>
                  <p className="font-semibold text-slate-800">{selectedDonor.userId?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Date of Birth</p>
                  <p className="font-semibold text-slate-800">{formatDate(selectedDonor.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Gender</p>
                  <p className="font-semibold text-slate-800 capitalize">{selectedDonor.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Weight</p>
                  <p className="font-semibold text-slate-800">
                    {selectedDonor.weight ? `${selectedDonor.weight} kg` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Hemoglobin</p>
                  <p className="font-semibold text-slate-800">
                    {selectedDonor.hemoglobinLevel ? `${selectedDonor.hemoglobinLevel} g/dL` : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Address Details</p>
                <p className="text-slate-500">
                  {selectedDonor.address?.street && `${selectedDonor.address.street}, `}
                  {selectedDonor.address?.city}, {selectedDonor.address?.state} - {selectedDonor.address?.pinCode || ""}
                </p>
              </div>

              {selectedDonor.emergencyContact?.name && (
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Emergency Contact</p>
                  <p className="text-slate-500">
                    {selectedDonor.emergencyContact.name} ({selectedDonor.emergencyContact.relation || "Contact"}):{" "}
                    {selectedDonor.emergencyContact.phone}
                  </p>
                </div>
              )}

              {!selectedDonor.isEligible && selectedDonor.ineligibilityReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <strong>Deferral Reason:</strong> {selectedDonor.ineligibilityReason}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDonor(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonors;
