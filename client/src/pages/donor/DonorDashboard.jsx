import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyDonorProfile, getMyDonationHistory } from "../../api/donor.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate, nextEligibleDate, daysUntilEligible } from "../../utils/helpers.js";
import useAuthStore from "../../store/authStore.js";

const DonorDashboard = () => {
  const { user } = useAuthStore();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["myDonorProfile"],
    queryFn: getMyDonorProfile,
    retry: false,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["myDonationsRecent"],
    queryFn: () => getMyDonationHistory({ page: 1, limit: 3 }),
    enabled: !!profileData?.data?.donor,
  });

  const donor = profileData?.data?.donor;
  const recentDonations = historyData?.data?.donations || [];

  if (profileLoading) return <Spinner center size="lg" />;

  // Prompt to finish registration if not yet done
  if (!donor) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
          🩸
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Complete Your Donor Profile</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
          Welcome to BloodBank, <strong>{user?.name}</strong>! Before you can track donations or check eligibility,
          please complete your medical registration.
        </p>
        <Link
          to="/donor/register"
          className="mt-6 inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md shadow-red-200 transition"
        >
          Complete Registration (3 Steps) →
        </Link>
      </div>
    );
  }

  const daysLeft = daysUntilEligible(donor.lastDonatedAt);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black">Hello, {user?.name}! 👋</h1>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {donor.bloodGroup} Donor
            </span>
          </div>
          <p className="text-red-100 text-sm mt-2 max-w-xl">
            Thank you for being a part of our lifesaving community. Every donation can save up to 3 lives!
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/donor/id-card"
            className="px-4 py-2.5 bg-white text-red-700 font-bold text-sm rounded-xl hover:bg-red-50 transition shadow-sm"
          >
            🪪 My Donor ID
          </Link>
          <Link
            to="/donor/profile"
            className="px-4 py-2.5 bg-red-800/60 backdrop-blur-md text-white font-semibold text-sm rounded-xl hover:bg-red-800 transition"
          >
            ⚙️ View Profile
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 text-2xl flex items-center justify-center font-bold">
            🩸
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</p>
            <p className="text-2xl font-black text-slate-800">{donor.bloodGroup}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center font-bold">
            💉
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Donations</p>
            <p className="text-2xl font-black text-slate-800">{donor.totalDonations || 0} times</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 text-2xl flex items-center justify-center font-bold">
            📅
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Donation</p>
            <p className="text-base font-bold text-slate-800">
              {donor.lastDonatedAt ? formatDate(donor.lastDonatedAt) : "None yet"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center font-bold ${
              donor.isEligible ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {donor.isEligible ? "✓" : "⏳"}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eligibility</p>
            <p className={`text-sm font-bold ${donor.isEligible ? "text-emerald-600" : "text-amber-600"}`}>
              {donor.isEligible ? "Ready to Donate" : `${daysLeft} days wait`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Eligibility Notice & Recent Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eligibility Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Donation Status</h2>
              <StatusBadge
                label={donor.isEligible ? "Eligible" : "Wait Period"}
                variant={donor.isEligible ? "success" : "warning"}
                dot
              />
            </div>

            <div className="my-4 text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-5xl">{donor.isEligible ? "🎉" : "🗓️"}</span>
              <h3 className="font-bold text-slate-800 text-lg mt-3">
                {donor.isEligible ? "You can donate today!" : `Eligible in ${daysLeft} days`}
              </h3>
              <p className="text-xs text-slate-500 mt-1 px-4">
                {donor.isEligible
                  ? "Hydrate well and carry your government ID along with your Donor Card."
                  : donor.ineligibilityReason ||
                    `Standard rest gap of 56 days between donations ensures safe iron recovery.`}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Next Eligible Date</span>
                <span className="font-semibold text-slate-800">
                  {donor.lastDonatedAt ? formatDate(nextEligibleDate(donor.lastDonatedAt)) : "Immediate"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Weight</span>
                <span className="font-semibold text-slate-800">{donor.weight ? `${donor.weight} kg` : "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Hemoglobin</span>
                <span className="font-semibold text-slate-800">
                  {donor.hemoglobinLevel ? `${donor.hemoglobinLevel} g/dL` : "—"}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/donor/profile"
            className="w-full mt-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl text-center transition block"
          >
            Update Health Records
          </Link>
        </div>

        {/* Recent Donations Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Donations</h2>
                <p className="text-xs text-slate-400 mt-0.5">Your latest donation activity</p>
              </div>
              <Link
                to="/donor/history"
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
              >
                View All ({donor.totalDonations || 0}) →
              </Link>
            </div>

            {historyLoading ? (
              <Spinner center />
            ) : recentDonations.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No past donations recorded on your account.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentDonations.map((d) => (
                  <div key={d._id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                        🩸
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {d.bloodUnitId?.component || "Whole Blood"} ({d.volumeMl}ml)
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(d.donatedAt)} • {d.donationCenter || "Main Blood Center"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      label={d.status || "successful"}
                      variant={d.status === "successful" ? "success" : "warning"}
                      dot
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Lives impacted: ~{(donor.totalDonations || 0) * 3} people</span>
            <span className="text-red-600 font-semibold">Hero Status: Bronze Tier</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
