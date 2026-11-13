import { useState } from "react";
import toast from "react-hot-toast";
import {
  downloadInventoryReport,
  downloadDonationsReport,
  downloadRequestsReport,
} from "../../api/report.api.js";

const AdminReports = () => {
  const [downloading, setDownloading] = useState("");

  const handleDownload = async (type, fn, label) => {
    try {
      setDownloading(type);
      await fn();
      toast.success(`${label} downloaded successfully!`);
    } catch {
      toast.error(`Failed to export ${label}.`);
    } finally {
      setDownloading("");
    }
  };

  const reports = [
    {
      id: "inventory",
      title: "Blood Stock & Bag Inventory Report",
      description:
        "Full list of registered blood unit bags including Bag ID, blood group, component, volume, collection date, expiry date, storage unit/shelf, and current clinical status.",
      icon: "🩸",
      action: downloadInventoryReport,
      label: "Inventory CSV",
      color: "border-red-200 bg-red-50/30",
    },
    {
      id: "donations",
      title: "Donor Contributions & Donation Log",
      description:
        "Comprehensive historical log of all volunteer blood collections, donor names, contact details, blood groups, bag volumes, donation center locations, and handling technicians.",
      icon: "🧑‍🤝‍🧑",
      action: downloadDonationsReport,
      label: "Donations Log CSV",
      color: "border-emerald-200 bg-emerald-50/30",
    },
    {
      id: "requests",
      title: "Hospital Requisitions & Fulfillment Report",
      description:
        "Audit log of all hospital blood orders, required components, urgency ratings, diagnosis details, status progressions, assigned blood bags, and delivery timestamps.",
      icon: "🏥",
      action: downloadRequestsReport,
      label: "Hospital Requests CSV",
      color: "border-blue-200 bg-blue-50/30",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Reports & Data Exports</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Generate compliant CSV spreadsheet extracts for health ministry audits and inventory tracking
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {reports.map((r) => (
          <div
            key={r.id}
            className={`p-6 rounded-3xl border ${r.color} bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-3xl flex-shrink-0">
                {r.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{r.title}</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">{r.description}</p>
              </div>
            </div>

            <button
              disabled={downloading === r.id}
              onClick={() => handleDownload(r.id, r.action, r.label)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 whitespace-nowrap self-end sm:self-auto flex items-center gap-2"
            >
              {downloading === r.id ? (
                <span>Generating...</span>
              ) : (
                <>
                  <span>📥 Download CSV</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
