import React, { useState, useEffect, useMemo, useContext } from "react";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ExportContext } from "../layout/ExportContext";
import { filterByDate, formatDisplayDate } from "../layout/dateFilterUtils";
import { getBookingAmount, getBookings } from "../services";

function SummaryContent() {
  const {
    filterType,
    filterValue,
    setExportData,
    bookings: globalBookings,
    setBookings: setGlobalBookings,
  } = useContext(ExportContext);
  const [bookings, setBookings] = useState(
    Array.isArray(globalBookings) ? globalBookings : [],
  );
  const [loading, setLoading] = useState(
    !Array.isArray(globalBookings) || globalBookings.length === 0,
  );
  const selected = "This Year";

  // 🔒 SAME helper as Dashboard
  // ===============================
  // FETCH BOOKINGS (SAME AS DASHBOARD) — prefer shared bookings from ExportContext
  // If no global bookings are present, fall back to fetching locally
  // ===============================
  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      try {
        setLoading(true);
        const nextBookings = await getBookings();
        if (!active) return;
        setBookings(nextBookings);
        if (typeof setGlobalBookings === "function") {
          setGlobalBookings(nextBookings);
        }
      } catch (err) {
        console.error("Summary fetch error:", err.message);
        if (active) setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (Array.isArray(globalBookings) && globalBookings.length > 0) {
      setBookings(globalBookings);
      setLoading(false);
    } else {
      loadBookings();
    }

    return () => {
      active = false;
    };
  }, [globalBookings, setGlobalBookings]);
  // ===============================
  // TIME FILTER (UNCHANGED UI) + GLOBAL FILTER SUPPORT
  // If a global filter (set via Uppernav) is active, it overrides the local 'selected' timeframe
  // ===============================

  // Use shared/global bookings when available so Summary shows the same totals as Dashboard
  const effectiveBookings =
    Array.isArray(globalBookings) && globalBookings.length > 0
      ? globalBookings
      : bookings;

  const filteredBookingsByLocal = useMemo(() => {
    if (!Array.isArray(effectiveBookings) || effectiveBookings.length === 0)
      return [];

    const now = new Date();
    const start = new Date();
    const end = new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (selected) {
      case "Today":
        break;

      case "This Week":
        start.setDate(now.getDate() - 6);
        break;

      case "This Month":
        start.setFullYear(now.getFullYear(), now.getMonth(), 1);
        end.setFullYear(now.getFullYear(), now.getMonth() + 1, 0);
        break;

      case "This Year":
      default:
        start.setFullYear(now.getFullYear(), 0, 1);
        end.setFullYear(now.getFullYear(), 11, 31);
        break;
    }

    return effectiveBookings.filter((b) => {
      if (!b.date) return false;
      const d = new Date(b.date);
      return !isNaN(d) && d >= start && d <= end;
    });
  }, [effectiveBookings, selected]);

  const filteredBookings = useMemo(() => {
    if (filterType && filterType !== "all") {
      return filterByDate(
        effectiveBookings || [],
        "date",
        filterType,
        filterValue,
      );
    }
    return filteredBookingsByLocal;
  }, [effectiveBookings, filterType, filterValue, filteredBookingsByLocal]);

  // export summary data for export button (based on currently displayed bookings)
  const exportRowsSummary = useMemo(() => {
    try {
      return (filteredBookings || []).map((b) => ({
        "Customer Name": b.customerName || "",
        Phone: b.phone || "",
        Date: formatDisplayDate(b.date) || "",
        Time: b.time || "",
        "Payment Status": b.paymentStatus || "",
        "Total Amount": getBookingAmount(b, { preferFinalAmount: false }),
      }));
    } catch (err) {
      console.error("[Summary] export data build failed", err);
      return [];
    }
  }, [filteredBookings]);

  useEffect(() => {
    setExportData(exportRowsSummary);
  }, [exportRowsSummary, setExportData]);

  // ===============================
  // MONTHLY AGGREGATION
  // ✅ PAID ONLY (MATCH DASHBOARD)
  // ===============================
  const monthlyAgg = useMemo(() => {
    const base = Array(12)
      .fill(null)
      .map((_, idx) => ({
        label: MONTH_LABELS[idx],
        totalAmount: 0,
        totalAppointments: 0,
      }));

    filteredBookings.forEach((b) => {
      if (!b.date) return;
      const d = new Date(b.date);
      if (isNaN(d)) return;

      const month = d.getMonth();

      const isPaid =
        (b.paymentStatus || "").toString().toLowerCase() === "paid";

      const serviceTotal = getBookingAmount(b, { preferFinalAmount: false });

      if (isPaid) {
        base[month].totalAmount += serviceTotal;
      }

      base[month].totalAppointments += 1;
    });

    return base;
  }, [filteredBookings]);

  // ===============================
  // CHART DATA (with validation)
  // ===============================
  const chartData = useMemo(() => {
    try {
      if (!Array.isArray(monthlyAgg) || monthlyAgg.length === 0) {
        return MONTH_LABELS.map((label) => ({
          name: label,
          value: 0,
        }));
      }
      return monthlyAgg.map((m) => ({
        name: m?.label || "Unknown",
        value: Number(m?.totalAmount) || 0,
      }));
    } catch (err) {
      console.error("Chart data generation error:", err);
      return MONTH_LABELS.map((label) => ({
        name: label,
        value: 0,
      }));
    }
  }, [monthlyAgg]);

  // ===============================
  // TOTALS (MATCH DASHBOARD)
  // - For appointments, show the same count Dashboard shows (all fetched bookings)
  // - For earnings, compute from the same filtered set used by the chart (paid-only)
  // ===============================
  const totalAppointments = Array.isArray(effectiveBookings)
    ? effectiveBookings.length
    : 0;

  // Compute total earnings the same way as Dashboard: sum only 'Paid' bookings after applying the current date filter
  const totalEarnings = useMemo(() => {
    try {
      const list = filterByDate(
        Array.isArray(effectiveBookings) ? effectiveBookings : [],
        "date",
        filterType,
        filterValue,
      );
      if (!Array.isArray(list) || list.length === 0) return 0;

      return list.reduce((sum, b) => {
        if (!b || typeof b !== "object") return sum;
        const status = (b.paymentStatus || "Pending").toString().toLowerCase();
        if (status !== "paid") return sum;
        const serviceSum = getBookingAmount(b, { preferFinalAmount: false });
        return sum + serviceSum;
      }, 0);
    } catch (err) {
      console.error("Total earnings calculation error:", err);
      return 0;
    }
  }, [effectiveBookings, filterType, filterValue]);

  const { retentionRate, returningCustomerPercentage } = useMemo(() => {
    const map = new Map();

    filteredBookings.forEach((b) => {
      const key = b.phone || b.customerName;
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });

    let returning = 0;
    let bookingsFromReturning = 0;

    map.forEach((count) => {
      if (count > 1) {
        returning += 1;
        bookingsFromReturning += count;
      }
    });

    const totalBookings = filteredBookings.length;

    return {
      totalCustomers: map.size,
      returningCustomers: returning,
      retentionRate:
        totalBookings > 0 ? (bookingsFromReturning / totalBookings) * 100 : 0,
      returningCustomerPercentage:
        map.size > 0 ? (returning / map.size) * 100 : 0,
    };
  }, [filteredBookings]);

  const formatAmount = (v) =>
    (v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  // ===============================
  // UI — ❌ UNCHANGED
  // ===============================
  return (
    <div className="p-6 space-y-6 pl-80 bg-black w-full min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-white">
          Summary (Master Report)
        </h1>
      </div>

      {/* <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#D3AF37] text-black rounded-xl p-4 text-center shadow">
          <p className="text-sm">Total Appointments</p>
          <p className="text-2xl font-bold">
            {loading ? "..." : totalAppointments}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 text-center shadow">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-2xl font-bold">
            {loading ? "..." : `₹${formatAmount(totalEarnings)}`}
          </p>
        </div>
      </div> */}

      <div className="bg-transperent p-5 rounded-xl shadow-md">
        <h2 className="text-sm text-purple-200 mb-2">
          Total Revenue (Paid Only)
        </h2>

        {loading ? (
          <div className="h-52 bg-gray-50 rounded animate-pulse" />
        ) : (
          <>
            <p className="text-3xl font-bold text-white">
              ₹{formatAmount(totalEarnings)}
            </p>
            <p className="text-purple-200 text-sm mb-4">
              {filterType && filterType !== "all"
                ? "Filtered Snapshot"
                : selected}{" "}
              (Verified Paid Bookings)
            </p>

            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" />

                  <Tooltip
                    formatter={(v) => [`₹${formatAmount(v)}`, "Earnings"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-purple-900 text-white rounded-xl p-5 text-center shadow">
          <p className="text-sm">Total Appointments</p>
          <p className="text-3xl font-bold">
            {loading ? "..." : totalAppointments}
          </p>
        </div>
        <div className="bg-purple-900 rounded-xl p-5 text-center shadow">
          <p className="text-sm text-purple-300">Client Retention Rate</p>
          <p className="text-3xl font-bold text-white">
            {loading ? "..." : `${retentionRate.toFixed(1)}%`}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 text-center shadow">
          <p className="text-sm text-gray-500">Returning Customer %</p>
          <p className="text-3xl font-bold text-gray-800">
            {loading ? "..." : `${returningCustomerPercentage.toFixed(1)}%`}
          </p>
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Error in child:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 bg-black min-h-screen text-white">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-4">
            An error occurred while rendering this section. Try refreshing the
            page or contact support. (Error: {this.state.error?.message})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-700 rounded text-white hover:bg-purple-800"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Summary() {
  return (
    <ErrorBoundary>
      <SummaryContent />
    </ErrorBoundary>
  );
}
