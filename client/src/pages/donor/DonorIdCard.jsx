import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyDonorProfile } from "../../api/donor.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate } from "../../utils/helpers.js";

const DonorIdCard = () => {
  const cardRef = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ["myDonorProfile"],
    queryFn: getMyDonorProfile,
  });

  const donor = data?.data?.donor;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <Spinner center size="lg" />;

  if (!donor) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md mx-auto">
        <p className="text-slate-600">Please complete your donor profile first to generate an ID card.</p>
        <Link to="/donor/register" className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg">
          Complete Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Donor Identification Card</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your official digital blood donor credentials</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2"
        >
          🖨️ Print Card
        </button>
      </div>

      {/* The Printable Card */}
      <div
        ref={cardRef}
        className="w-full bg-gradient-to-br from-red-600 via-red-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden print:m-0 print:shadow-none"
      >
        {/* Background Decorative Rings */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-16 -top-12 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-start justify-between border-b border-white/20 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🩸</span>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase text-white">BloodBank Network</h2>
              <p className="text-xs text-red-200 tracking-wide font-medium">Certified Voluntary Donor</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-white text-red-700 font-black text-xl px-3 py-1 rounded-xl shadow-sm">
              {donor.bloodGroup}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-3 gap-6 my-6 items-center">
          {/* Avatar / Photo */}
          <div className="col-span-1 flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/30 flex items-center justify-center text-4xl font-extrabold shadow-inner text-white">
              {donor.userId?.name?.charAt(0) || "D"}
            </div>
            <span className="text-[10px] tracking-widest uppercase text-red-200 mt-2 font-semibold">
              ID: {donor._id?.slice(-8).toUpperCase()}
            </span>
          </div>

          {/* Details */}
          <div className="col-span-2 space-y-2.5 text-xs sm:text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-200">Donor Name</p>
              <p className="font-bold text-base sm:text-lg text-white leading-tight">{donor.userId?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-red-200">Date of Birth</p>
                <p className="font-semibold text-white">{formatDate(donor.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-red-200">Gender</p>
                <p className="font-semibold text-white capitalize">{donor.gender}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-200">Location</p>
              <p className="font-medium text-white truncate">
                {donor.address?.city}, {donor.address?.state}
              </p>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs text-red-100">
          <div>
            <p className="text-[10px] text-red-300">Total Donations</p>
            <p className="font-bold text-sm text-white">{donor.totalDonations || 0} times</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-red-300">Status</p>
            <p className="font-bold text-sm text-emerald-300">{donor.isEligible ? "Active & Eligible" : "Registered"}</p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Show this card or quote your Donor ID when arriving at any authorized blood bank center or mobile donation drive.
      </div>
    </div>
  );
};

export default DonorIdCard;
