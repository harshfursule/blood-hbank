import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  getOverviewMetrics,
  getStockByGroup,
  getDonationTrends,
  getRequestFulfillment,
  getHospitalDemand,
} from "../../api/analytics.api.js";
import Spinner from "../../components/common/Spinner.jsx";

const AdminDashboard = () => {
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["overviewMetrics"],
    queryFn: getOverviewMetrics,
    refetchInterval: 30000,
  });

  const { data: stockData, isLoading: isStockLoading } = useQuery({
    queryKey: ["stockByGroup"],
    queryFn: getStockByGroup,
  });

  const { data: trendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["donationTrends"],
    queryFn: getDonationTrends,
  });

  const { data: fulfillmentData } = useQuery({
    queryKey: ["requestFulfillment"],
    queryFn: getRequestFulfillment,
  });

  const { data: demandData } = useQuery({
    queryKey: ["hospitalDemand"],
    queryFn: getHospitalDemand,
  });

  const overview = overviewData?.data || {
    totalDonors: 0,
    totalUnitsAvailable: 0,
    fulfilledRequests: 0,
    activeHospitals: 0,
    totalDonationsCount: 0,
  };

  const stockChartData = stockData?.data || [];
  const trendsChartData = trendsData?.data || [];
  const pieData = fulfillmentData?.data || [];
  const hospitalData = demandData?.data || [];

  const kpis = [
    {
      label: "Registered Donors",
      value: overview.totalDonors,
      icon: "🧑‍🤝‍🧑",
      color: "bg-blue-50 text-blue-600",
      link: "/admin/donors",
    },
    {
      label: "Units in Stock",
      value: `${overview.totalUnitsAvailable} Bags`,
      icon: "🩸",
      color: "bg-red-50 text-red-600",
      link: "/admin/inventory",
    },
    {
      label: "Fulfilled Orders",
      value: overview.fulfilledRequests,
      icon: "📋",
      color: "bg-emerald-50 text-emerald-600",
      link: "/admin/requests",
    },
    {
      label: "Verified Hospitals",
      value: overview.activeHospitals,
      icon: "🏥",
      color: "bg-purple-50 text-purple-600",
      link: "/admin/hospitals",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Operational Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time blood bank metrics, donation intake trends & hospital demand
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/reports"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-1.5"
          >
            📊 Export CSV Reports
          </Link>
          <Link
            to="/admin/inventory"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition"
          >
            Manage Stock
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon, color, link }) => (
          <Link
            to={link}
            key={label}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4 group"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold ${color}`}
            >
              {icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5 group-hover:text-red-600 transition">
                {isOverviewLoading ? "—" : value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Primary Charts Row: Stock by Group & Donation Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Stock by Group BarChart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Available Blood Stock by Group</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live inventory units available for allocation</p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              Units
            </span>
          </div>

          <div className="h-64">
            {isStockLoading ? (
              <Spinner center />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="bloodGroup" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="units" fill="#dc2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 30-Day Donation Trends AreaChart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Donation Inflow (Last 30 Days)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily donor contributions recorded</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Donations
            </span>
          </div>

          <div className="h-64">
            {isTrendsLoading ? (
              <Spinner center />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      border: "none",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="donations"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDonations)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row: Request Fulfillment & Top Hospital Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Fulfillment Status PieChart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Request Fulfillment Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribution of all hospital requisitions</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter((p) => p.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    border: "none",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Demand Hospitals BarChart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Top Ordering Hospitals</h2>
            <p className="text-xs text-slate-400 mt-0.5">Highest volume requisitions by facility</p>
          </div>

          <div className="h-64">
            {hospitalData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No hospital requisition data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hospitalData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="fulfilled" name="Units Fulfilled" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
