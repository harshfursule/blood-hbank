import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { submitBloodRequest } from "../../api/request.api.js";
import { getMyHospitalProfile } from "../../api/hospital.api.js";
import Spinner from "../../components/common/Spinner.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["Whole Blood", "RBC", "Platelets", "Plasma", "FFP", "Cryoprecipitate"];

const NewBloodRequest = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["myHospitalProfile"],
    queryFn: getMyHospitalProfile,
  });

  const hospital = profileData?.data?.hospital;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bloodGroup: "O+",
      component: "Whole Blood",
      unitsNeeded: 1,
      urgency: "routine",
      patientName: "",
      patientAge: "",
      diagnosis: "",
      notes: "",
    },
  });

  const selectedUrgency = watch("urgency");

  const mutation = useMutation({
    mutationFn: submitBloodRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(["myHospitalRequests"]);
      queryClient.invalidateQueries(["requestStats"]);
      toast.success("Blood request submitted successfully!");
      navigate("/hospital/requests");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    },
  });

  if (isLoading) return <Spinner center size="lg" />;

  if (!hospital) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 shadow-sm">
        <span className="text-5xl">🏥</span>
        <h2 className="text-xl font-bold text-slate-800 mt-4">Profile Required</h2>
        <p className="text-slate-500 text-sm mt-2">
          Please register your hospital profile before submitting blood requests.
        </p>
        <button
          onClick={() => navigate("/hospital/register")}
          className="mt-5 px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
        >
          Setup Hospital Profile
        </button>
      </div>
    );
  }

  if (!hospital.isApproved) {
    return (
      <div className="bg-white rounded-3xl border border-amber-200 bg-amber-50/40 p-8 text-center max-w-md mx-auto my-12 shadow-sm">
        <span className="text-5xl">⏳</span>
        <h2 className="text-xl font-bold text-slate-800 mt-4">Account Pending Verification</h2>
        <p className="text-slate-600 text-sm mt-2">
          Your hospital registration is currently under review by our administration. Once verified,
          you will be able to requisition blood supplies directly.
        </p>
      </div>
    );
  }

  const onSubmit = (formData) => {
    mutation.mutate({
      ...formData,
      unitsNeeded: Number(formData.unitsNeeded),
      patientAge: formData.patientAge ? Number(formData.patientAge) : undefined,
    });
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Submit Blood Request</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Order donor units for surgeries, emergencies, or clinical treatments
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-sm">
          {/* Blood Group Select */}
          <div>
            <label className={labelClass}>Patient Blood Group *</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <label key={bg} className="cursor-pointer">
                  <input
                    type="radio"
                    value={bg}
                    {...register("bloodGroup", { required: true })}
                    className="sr-only peer"
                  />
                  <div className="text-center py-2 border-2 border-slate-200 rounded-xl text-sm font-bold peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:text-red-700 hover:border-slate-300 transition">
                    {bg}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Component & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Required Component *</label>
              <select {...register("component")} className={inputClass}>
                {COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Units Needed *</label>
              <input
                type="number"
                min="1"
                max="25"
                {...register("unitsNeeded", { required: true })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className={labelClass}>Priority / Urgency Level *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "routine", label: "Routine", desc: "Within 24-48 hrs", color: "peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700" },
                { id: "urgent", label: "Urgent", desc: "Within 6-12 hrs", color: "peer-checked:border-amber-600 peer-checked:bg-amber-50 peer-checked:text-amber-700" },
                { id: "emergency", label: "Emergency", desc: "Immediate Dispatch", color: "peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:text-red-700" },
              ].map(({ id, label, desc, color }) => (
                <label key={id} className="cursor-pointer">
                  <input
                    type="radio"
                    value={id}
                    {...register("urgency")}
                    className="sr-only peer"
                  />
                  <div className={`p-3 border-2 border-slate-200 rounded-2xl text-center hover:border-slate-300 transition ${color}`}>
                    <p className="font-bold text-sm">{label}</p>
                    <p className="text-[11px] opacity-75">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Patient Details (Optional) */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Patient Clinical Details (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div>
                <label className={labelClass}>Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  {...register("patientName")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Patient Age</label>
                <input
                  type="number"
                  placeholder="e.g. 42"
                  {...register("patientAge")}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Clinical Diagnosis / Reason</label>
              <input
                type="text"
                placeholder="e.g. Cardiac Bypass surgery, severe anemia, trauma"
                {...register("diagnosis")}
                className={inputClass}
              />
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className={labelClass}>Handling Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Keep refrigerated, Deliver to ICU Ward 4"
              {...register("notes")}
              className={inputClass}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/hospital/requests")}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`px-6 py-2 rounded-xl text-white font-semibold shadow-md transition disabled:opacity-60 ${
                selectedUrgency === "emergency"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {mutation.isPending ? "Submitting..." : "Submit Blood Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBloodRequest;
