import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerHospital } from "../../api/hospital.api.js";

const HospitalRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      type: "private",
    },
  });

  const mutation = useMutation({
    mutationFn: registerHospital,
    onSuccess: () => {
      queryClient.invalidateQueries(["myHospitalProfile"]);
      toast.success("Hospital profile created! Awaiting admin verification.");
      navigate("/hospital/dashboard");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create hospital profile.");
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hospital Organization Profile</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Register official medical license details to request blood supplies
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Hospital or Clinic Name *</label>
            <input
              type="text"
              placeholder="e.g. Apollo City Hospital"
              {...register("hospitalName", { required: "Hospital name is required" })}
              className={inputClass}
            />
            {errors.hospitalName && <p className="text-xs text-red-500 mt-1">{errors.hospitalName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>License / Reg. Number *</label>
              <input
                type="text"
                placeholder="e.g. MH-HOSP-2024-9812"
                {...register("licenseNumber", { required: "License number is required" })}
                className={inputClass}
              />
              {errors.licenseNumber && <p className="text-xs text-red-500 mt-1">{errors.licenseNumber.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Facility Type *</label>
              <select {...register("type")} className={inputClass}>
                <option value="private">Private Hospital</option>
                <option value="government">Government Hospital</option>
                <option value="trust">Charity / Trust</option>
                <option value="clinic">Emergency Clinic / Trauma Center</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Facility Location</h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 45 Healthcare Blvd, Sector 9"
                  {...register("address.street")}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    {...register("address.city", { required: "City is required" })}
                    className={inputClass}
                  />
                  {errors.address?.city && (
                    <p className="text-xs text-red-500 mt-1">{errors.address.city.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>State *</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    {...register("address.state", { required: "State is required" })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>PIN Code *</label>
                <input
                  type="text"
                  placeholder="e.g. 400001"
                  {...register("address.pinCode", { required: "PIN Code is required" })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Emergency Contact Desk</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Primary Phone *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 22 8765 4321"
                  {...register("contactInfo.phone", { required: "Phone is required" })}
                  className={inputClass}
                />
                {errors.contactInfo?.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.contactInfo.phone.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Emergency Blood Desk Email</label>
                <input
                  type="email"
                  placeholder="bloodbank@hospital.com"
                  {...register("contactInfo.email")}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-200 transition disabled:opacity-60"
            >
              {mutation.isPending ? "Submitting..." : "Submit for Verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalRegister;
