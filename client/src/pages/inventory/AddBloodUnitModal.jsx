import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { addBloodUnit } from "../../api/bloodUnit.api.js";
import { getAllDonors } from "../../api/donor.api.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["Whole Blood", "RBC", "Platelets", "Plasma", "FFP", "Cryoprecipitate"];

const SHELF_LIFE_DAYS = {
  "Whole Blood": 35,
  "RBC": 42,
  "Platelets": 5,
  "Plasma": 365,
  "FFP": 365,
  "Cryoprecipitate": 365,
};

const AddBloodUnitModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [donorSearch, setDonorSearch] = useState("");

  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      bloodGroup: "O+",
      component: "Whole Blood",
      volumeMl: 450,
      collectedAt: new Date().toISOString().slice(0, 10),
      "storageLocation.unit": "Refrig-1",
      "storageLocation.shelf": "Shelf-A",
      notes: "",
      donorId: "",
    },
  });

  const selectedComponent = watch("component");
  const selectedGroup = watch("bloodGroup");

  // Fetch donors list for optional linking
  const { data: donorsData } = useQuery({
    queryKey: ["donorsPicker", donorSearch],
    queryFn: () => getAllDonors({ search: donorSearch || undefined, limit: 5 }),
    enabled: isOpen,
  });

  const donors = donorsData?.data?.donors || [];

  const addMutation = useMutation({
    mutationFn: addBloodUnit,
    onSuccess: () => {
      queryClient.invalidateQueries(["stockSummary"]);
      queryClient.invalidateQueries(["bloodUnits"]);
      queryClient.invalidateQueries(["expiringSoon"]);
      toast.success("Blood Unit successfully logged and Bag ID generated!");
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add blood unit.");
    },
  });

  const onSubmit = (formData) => {
    addMutation.mutate({
      ...formData,
      volumeMl: Number(formData.volumeMl),
      donorId: formData.donorId || undefined,
    });
  };

  if (!isOpen) return null;

  const shelfLife = SHELF_LIFE_DAYS[selectedComponent] || 35;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">
              🩸
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Register Collected Blood Unit</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate tracking QR code & allocate storage bag
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 text-sm">
          {/* Blood Group Radio Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Blood Group *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <label key={bg} className="cursor-pointer">
                  <input
                    type="radio"
                    value={bg}
                    {...register("bloodGroup", { required: true })}
                    className="sr-only peer"
                  />
                  <div
                    className="text-center py-2 border-2 border-slate-200 rounded-xl text-sm font-bold
                                  peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:text-red-700
                                  hover:border-slate-300 transition"
                  >
                    {bg}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Component & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Component *
              </label>
              <select
                {...register("component")}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                {COMPONENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard shelf-life: <span className="font-semibold text-slate-700">{shelfLife} days</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Volume (ml) *
              </label>
              <input
                type="number"
                step="10"
                min="100"
                max="500"
                {...register("volumeMl")}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Standard collection: 450ml or 350ml</p>
            </div>
          </div>

          {/* Collection Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Collection Date *
            </label>
            <input
              type="date"
              {...register("collectedAt")}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Storage Unit & Shelf */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Storage Unit
              </label>
              <input
                type="text"
                placeholder="e.g. Refrigerator-1"
                {...register("storageLocation.unit")}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Shelf / Bin
              </label>
              <input
                type="text"
                placeholder="e.g. Shelf-B2"
                {...register("storageLocation.shelf")}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Donor Linkage (Optional) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Link with Donor (Optional)
            </label>
            <input
              type="text"
              placeholder="Search donor name or phone..."
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg mb-2 focus:outline-none"
            />
            {donors.length > 0 && (
              <div className="max-h-28 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200">
                {donors.map((d) => (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => {
                      setValue("donorId", d._id);
                      setValue("bloodGroup", d.bloodGroup);
                      toast.success(`Linked to donor: ${d.userId?.name} (${d.bloodGroup})`);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs flex justify-between items-center hover:bg-red-50 transition"
                  >
                    <span>
                      <strong>{d.userId?.name}</strong> • {d.userId?.phone}
                    </span>
                    <span className="font-bold text-red-600">{d.bloodGroup}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Internal Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Routine volunteer camp collection"
              {...register("notes")}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-red-200 disabled:opacity-60 transition"
            >
              {addMutation.isPending ? "Generating..." : "Generate Bag & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBloodUnitModal;
