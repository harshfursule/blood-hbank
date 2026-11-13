import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyHospitalProfile } from "../../api/hospital.api.js";
import { getAllBloodRequests } from "../../api/request.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const HospitalDashboard = () => {
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["myHospitalProfile"],
    queryFn: getMyHospitalProfile,
    retry: false,
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["myHospitalRecentRequests"],
    queryFn: () => getAllBloodRequests({ page: 1, limit: 3 }),
    enabled: !!profileData?.data?.hospital,
  });

  const hospital = profileData?.data?.hospital;
  const recentRequests = requestsData?.data?.requests || [];

  if (profileLoading) return <Spinner center size="lg" />;

  // Needs profile setup
  if (!hospital) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
          🏥
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Hospital Portal Setup</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
          Please register your facility credentials, medical license number, and emergency desk contact to enable blood ordering.
        </p>
        <Link
          to="/hospital/register"
          className="mt-6 inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md shadow-red-200 transition"
        >
          Setup Facility Profile →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black">{hospital.hospitalName}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                hospital.isApproved ? "bg-emerald-500/30 text-emerald-200" : "bg-amber-500/30 text-amber-200"
              }`}
            >
              {hospital.isApproved ? "Verified Facility ✓" : "Pending Verification ⏳"}
            </span>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            License No: <span className="font-mono font-bold">{hospital.licenseNumber}</span> •{" "}
            {hospital.address?.city}, {hospital.address?.state}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/hospital/new-request"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-red-900/30"
          >
            ➕ Order Blood
          </Link>
          <Link
            to="/hospital/requests"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition"
          >
            📋 Orders
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 text-2xl flex items-center justify-center font-bold">
            📋
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders Placed</p>
            <p className="text-2xl font-black text-slate-800">{hospital.totalRequestsMade || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center font-bold">
            🩸
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Units Fulfilled</p>
            <p className="text-2xl font-black text-emerald-600">{hospital.totalUnitsFulfilled || 0} Bags</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 text-2xl flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verification Status</p>
            <p className={`text-base font-bold ${hospital.isApproved ? "text-emerald-600" : "text-amber-600"}`}>
              {hospital.isApproved ? "Approved for Order" : "Under Admin Review"}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Recent Blood Orders</h2>
          <Link to="/hospital/requests" className="text-xs font-bold text-red-600 hover:underline">
            View All Orders →
          </Link>
        </div>

        {requestsLoading ? (
          <Spinner center />
        ) : recentRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No blood requests submitted yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentRequests.map((r) => (
              <div key={r._id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BloodGroupBadge group={r.bloodGroup} size="sm" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {r.unitsNeeded} unit(s) of {r.component}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(r.createdAt)} • Priority: <span className="capitalize font-semibold">{r.urgency}</span>
                    </p>
                  </div>
                </div>

                <StatusBadge label={r.status} dot />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
