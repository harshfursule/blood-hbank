import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { registerDonor } from "../../api/donor.api.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── Step schemas ────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  bloodGroup:  z.enum(BLOOD_GROUPS, { required_error: "Select a blood group" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender:      z.enum(["male", "female", "other"], { required_error: "Select gender" }),
  street:      z.string().optional(),
  city:        z.string().min(1, "City is required"),
  state:       z.string().min(1, "State is required"),
  pinCode:     z.string().optional(),
});

const step2Schema = z.object({
  weight:             z.coerce.number().min(30, "Enter valid weight").max(200).optional().or(z.literal("")),
  hemoglobinLevel:    z.coerce.number().min(5).max(25).optional().or(z.literal("")),
  hasChronicDisease:  z.boolean().optional(),
  hasTattooOrPiercing: z.boolean().optional(),
  recentSurgery:      z.boolean().optional(),
});

const step3Schema = z.object({
  emergencyName:      z.string().optional(),
  emergencyPhone:     z.string().optional(),
  emergencyRelation:  z.string().optional(),
});

const STEPS = ["Personal Info", "Medical Info", "Emergency Contact"];

const inputClass = "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

const DonorRegister = () => {
  const navigate   = useNavigate();
  const [step, setStep]     = useState(0);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const schemas = [step1Schema, step2Schema, step3Schema];

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schemas[step]),
  });

  const hasChronicDisease  = watch("hasChronicDisease");
  const hasTattooOrPiercing = watch("hasTattooOrPiercing");

  const onStepSubmit = async (data) => {
    const merged = { ...formData, ...data };
    setFormData(merged);

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step — submit
    setSubmitting(true);
    try {
      const payload = {
        bloodGroup:   merged.bloodGroup,
        dateOfBirth:  merged.dateOfBirth,
        gender:       merged.gender,
        address: {
          street:  merged.street || "",
          city:    merged.city,
          state:   merged.state,
          pinCode: merged.pinCode || "",
        },
        weight:           merged.weight || null,
        hemoglobinLevel:  merged.hemoglobinLevel || null,
        medicalHistory: {
          hasChronicDisease:    !!merged.hasChronicDisease,
          hasTattooOrPiercing:  !!merged.hasTattooOrPiercing,
          recentSurgery:        !!merged.recentSurgery,
        },
        emergencyContact: {
          name:     merged.emergencyName || "",
          phone:    merged.emergencyPhone || "",
          relation: merged.emergencyRelation || "",
        },
      };

      await registerDonor(payload);
      toast.success("Donor profile created! Welcome to BloodBank 🩸");
      navigate("/donor/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Complete Your Donor Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-2 rounded-full transition-all ${i <= step ? "bg-red-600" : "bg-slate-200"}`} />
            <p className={`text-xs mt-1 ${i === step ? "text-red-600 font-medium" : "text-slate-400"}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-5">

          {/* ── STEP 1: Personal Info ── */}
          {step === 0 && (
            <>
              {/* Blood Group */}
              <div>
                <label className={labelClass}>Blood Group *</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <label key={bg} className="cursor-pointer">
                      <input type="radio" value={bg} {...register("bloodGroup")} className="sr-only peer" />
                      <div className="text-center py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold
                                      peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700
                                      hover:border-slate-300 transition">
                        {bg}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.bloodGroup && <p className="mt-1 text-xs text-red-500">{errors.bloodGroup.message}</p>}
              </div>

              {/* DOB + Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input type="date" {...register("dateOfBirth")} className={inputClass}
                    max={new Date().toISOString().split("T")[0]} />
                  {errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Gender *</label>
                  <select {...register("gender")} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className={labelClass}>Street Address</label>
                <input type="text" {...register("street")} placeholder="123 Main St" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City *</label>
                  <input type="text" {...register("city")} placeholder="Mumbai" className={inputClass} />
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>State *</label>
                  <input type="text" {...register("state")} placeholder="Maharashtra" className={inputClass} />
                  {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
                </div>
              </div>
              <div>
                <label className={labelClass}>PIN Code</label>
                <input type="text" {...register("pinCode")} placeholder="400001" className={inputClass} />
              </div>
            </>
          )}

          {/* ── STEP 2: Medical Info ── */}
          {step === 1 && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                ℹ️ This information helps determine your eligibility to donate. It is kept confidential.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input type="number" {...register("weight")} placeholder="70" className={inputClass} />
                  {errors.weight && <p className="mt-1 text-xs text-red-500">{errors.weight.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Hemoglobin (g/dL)</label>
                  <input type="number" step="0.1" {...register("hemoglobinLevel")} placeholder="13.5" className={inputClass} />
                  {errors.hemoglobinLevel && <p className="mt-1 text-xs text-red-500">{errors.hemoglobinLevel.message}</p>}
                </div>
              </div>

              {/* Checkboxes */}
              {[
                { name: "hasChronicDisease",   label: "I have a chronic medical condition (diabetes, hypertension, etc.)" },
                { name: "hasTattooOrPiercing", label: "I got a tattoo or piercing in the last 12 months" },
                { name: "recentSurgery",        label: "I had surgery in the last 6 months" },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" {...register(name)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </>
          )}

          {/* ── STEP 3: Emergency Contact + Review ── */}
          {step === 2 && (
            <>
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Emergency Contact (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Contact Name</label>
                    <input type="text" {...register("emergencyName")} placeholder="Jane Doe" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input type="tel" {...register("emergencyPhone")} placeholder="+91 98765 43210" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Relation</label>
                      <input type="text" {...register("emergencyRelation")} placeholder="Spouse, Parent..." className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Review summary */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-2">
                <p className="font-semibold text-slate-700 mb-3">📋 Profile Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                  <span className="text-slate-400">Blood Group</span><span className="font-medium">{formData.bloodGroup || "—"}</span>
                  <span className="text-slate-400">Gender</span><span className="capitalize">{formData.gender || "—"}</span>
                  <span className="text-slate-400">City</span><span>{formData.city || "—"}</span>
                  <span className="text-slate-400">State</span><span>{formData.state || "—"}</span>
                  <span className="text-slate-400">Weight</span><span>{formData.weight ? `${formData.weight} kg` : "Not provided"}</span>
                  <span className="text-slate-400">Hemoglobin</span><span>{formData.hemoglobinLevel ? `${formData.hemoglobinLevel} g/dL` : "Not provided"}</span>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-2">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition">
                ← Back
              </button>
            ) : <div />}

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-60"
            >
              {submitting ? "Saving..." : step < STEPS.length - 1 ? "Next →" : "Submit Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonorRegister;
