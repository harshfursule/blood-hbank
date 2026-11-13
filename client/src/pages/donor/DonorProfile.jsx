import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyDonorProfile, updateMyDonorProfile } from "../../api/donor.api.js";
import BloodGroupBadge from "../../components/common/BloodGroupBadge.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { formatDate, nextEligibleDate, daysUntilEligible } from "../../utils/helpers.js";

const DonorProfile = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["myDonorProfile"],
    queryFn: getMyDonorProfile,
  });

  const donor = data?.data?.donor;

  const { register, handleSubmit, reset } = useForm();

  const updateMutation = useMutation({
    mutationFn: updateMyDonorProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["myDonorProfile"], updated);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    },
    error: (err) => {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    },
  });

  const handleStartEdit = () => {
    reset({
      weight: donor.weight || "",
      hemoglobinLevel: donor.hemoglobinLevel || "",
      "address.street": donor.address?.street || "",
      "address.city": donor.address?.city || "",
      "address.state": donor.address?.state || "",
      "address.pinCode": donor.address?.pinCode || "",
      "emergencyContact.name": donor.emergencyContact?.name || "",
      "emergencyContact.phone": donor.emergencyContact?.phone || "",
      "emergencyContact.relation": donor.emergencyContact?.relation || "",
      "medicalHistory.hasChronicDisease": !!donor.medicalHistory?.hasChronicDisease,
      "medicalHistory.hasTattooOrPiercing": !!donor.medicalHistory?.hasTattooOrPiercing,
      "medicalHistory.recentSurgery": !!donor.medicalHistory?.recentSurgery,
    });
    setIsEditing(true);
  };

  const onSubmit = (formData) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) return <Spinner center size="lg" />;

  if (error || !donor) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto shadow-sm">
        <span className="text-5xl">📝</span>
        <h2 className="text-xl font-bold text-slate-800 mt-4">No Donor Profile Found</h2>
        <p className="text-slate-500 text-sm mt-2">
          You haven't set up your medical and donor details yet.
        </p>
        <Link
          to="/donor/register"
          className="mt-6 inline-block px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
        >
          Create Donor Profile
        </Link>
      </div>
    );
  }

  const daysLeft = daysUntilEligible(donor.lastDonatedAt);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Donor Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your donor health and contact details</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/donor/id-card"
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            🪪 View ID Card
          </Link>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
            >
              Edit Details
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Eligibility Banner */}
      <div
        className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
          donor.isEligible
            ? "bg-green-50 border-green-200 text-green-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <span className="text-3xl">{donor.isEligible ? "✅" : "⏳"}</span>
          <div>
            <h3 className="font-bold text-base">
              {donor.isEligible ? "You are Eligible to Donate Blood!" : "Currently Not Eligible to Donate"}
            </h3>
            <p className="text-xs sm:text-sm opacity-90 mt-0.5">
              {donor.isEligible
                ? "Your health parameters are in good standing. Find a nearby camp or blood bank."
                : donor.ineligibilityReason || `You can donate again in ${daysLeft} days.`}
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs uppercase tracking-wider font-semibold opacity-75">Next Eligible Date</p>
          <p className="font-bold text-sm sm:text-base">
            {donor.lastDonatedAt ? formatDate(nextEligibleDate(donor.lastDonatedAt)) : "Today"}
          </p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
              {donor.userId?.name?.charAt(0) || "D"}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">{donor.userId?.name}</h2>
                <BloodGroupBadge group={donor.bloodGroup} size="sm" />
                <StatusBadge
                  label={donor.isEligible ? "Eligible" : "Deferred"}
                  variant={donor.isEligible ? "success" : "warning"}
                  dot
                />
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                {donor.userId?.email} • {donor.userId?.phone}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal & Physical */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Health & Physical</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-medium capitalize text-slate-800">{donor.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="font-medium text-slate-800">{formatDate(donor.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Weight (kg)</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.5"
                      {...register("weight")}
                      className="w-24 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.weight ? `${donor.weight} kg` : "—"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Hemoglobin Level</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      {...register("hemoglobinLevel")}
                      className="w-24 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">
                      {donor.hemoglobinLevel ? `${donor.hemoglobinLevel} g/dL` : "—"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Location & Address</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">City</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("address.city")}
                      className="w-40 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.address?.city || "—"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">State</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("address.state")}
                      className="w-40 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.address?.state || "—"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Street</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("address.street")}
                      className="w-48 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.address?.street || "—"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">PIN Code</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("address.pinCode")}
                      className="w-28 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.address?.pinCode || "—"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact & Medical Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Emergency Contact</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("emergencyContact.name")}
                      className="w-40 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.emergencyContact?.name || "—"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Phone</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("emergencyContact.phone")}
                      className="w-40 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.emergencyContact?.phone || "—"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Relationship</span>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("emergencyContact.relation")}
                      className="w-40 px-2 py-1 text-right text-sm border rounded"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{donor.emergencyContact?.relation || "—"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Donation History Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Total Donations</span>
                  <span className="font-bold text-red-600 text-base">{donor.totalDonations || 0} times</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Last Donated</span>
                  <span className="font-medium text-slate-800">
                    {donor.lastDonatedAt ? formatDate(donor.lastDonatedAt) : "Never donated"}
                  </span>
                </div>
                <div className="pt-2 text-right">
                  <Link
                    to="/donor/history"
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    View Full Donation Records →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default DonorProfile;
