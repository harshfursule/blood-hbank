import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyDonationHistory } from "../../api/donor.api.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const DonationHistory = () => {
  const [page, setPage] = useState(1);
  const limit = 8;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myDonations", page],
    queryFn: () => getMyDonationHistory({ page, limit }),
    keepPreviousData: true,
  });

  const donations = data?.data?.donations || [];
  const pagination = data?.data?.pagination || { totalPages: 1, total: 0 };

  const getStatusVariant = (status) => {
    switch (status) {
      case "successful":
        return "success";
      case "deferred":
        return "warning";
      case "incomplete":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Donation History</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Log of all your past blood contributions ({pagination.total} records)
          </p>
        </div>
        <Link
          to="/donor/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-red-600 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner center size="lg" />
        ) : isError ? (
          <div className="p-12 text-center text-slate-500">
            <p>Failed to load donation records. Please try again.</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-5xl">🩸</span>
            <h3 className="font-bold text-slate-700 text-lg">No Donations Yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Once you visit a donation camp or center, your collection history will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Bag ID</th>
                    <th className="px-6 py-4">Blood Group</th>
                    <th className="px-6 py-4">Component</th>
                    <th className="px-6 py-4">Volume</th>
                    <th className="px-6 py-4">Center / Notes</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                        {formatDate(d.donatedAt)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {d.bloodUnitId?.bagId || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <BloodGroupBadge group={d.bloodUnitId?.bloodGroup || "O+"} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {d.bloodUnitId?.component || "Whole Blood"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {d.volumeMl} ml
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {d.donationCenter || "Main Blood Center"}
                        {d.deferralReason && ` (${d.deferralReason})`}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          label={d.status || "successful"}
                          variant={getStatusVariant(d.status)}
                          dot
                        />
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
                  Page {pagination.page} of {pagination.totalPages}
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
    </div>
  );
};

export default DonationHistory;
