import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Summary() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ snapshot dropdown ke liye state
  const [selected, setSelected] = useState("This Year");

  // Labels for chart (Jan–Dec)
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

  // ✅ Fetch bookings (same backend as Dashboard/Earning)
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/bookings");
        setBookings(res.data);
      } catch (err) {
        console.error("Error fetching bookings for summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // ✅ Filter bookings based on dropdown (Today / Week / Month / Year)
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];

    const now = new Date();
    const start = new Date();
    const end = new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (selected) {
      case "Today":
        // already today
        break;

      case "This Week":
        // last 7 days including today
        start.setDate(now.getDate() - 6);
        break;

      case "This Month":
        start.setDate(1);
        start.setMonth(now.getMonth());
        start.setFullYear(now.getFullYear());
        end.setMonth(now.getMonth() + 1, 0); // last day of current month
        end.setFullYear(now.getFullYear());
        break;

      case "This Year":
      default:
        start.setMonth(0, 1); // 1 Jan
        start.setFullYear(now.getFullYear());
        end.setMonth(11, 31); // 31 Dec
        end.setFullYear(now.getFullYear());
        break;
    }

    return bookings.filter((b) => {
      if (!b.date) return false;
      const d = new Date(b.date);
      if (isNaN(d)) return false;
      return d >= start && d <= end;
    });
  }, [bookings, selected]);

  // ✅ Monthly aggregation for chart + totals (use filteredBookings)
  const monthlyAgg = useMemo(() => {
    const base = Array(12)
      .fill(null)
      .map((_, idx) => ({
        monthIndex: idx,
        label: MONTH_LABELS[idx],
        totalAmount: 0,
        totalAppointments: 0,
      }));

    filteredBookings.forEach((b) => {
      if (!b.date) return;
      const d = new Date(b.date);
      if (isNaN(d)) return;

      const monthIndex = d.getMonth(); // 0-11
      const totalAmt =
        b.services?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;

      base[monthIndex].totalAmount += totalAmt;
      base[monthIndex].totalAppointments += 1;
    });

    return base;
  }, [filteredBookings]);

  // ✅ Line chart data (Total Earnings per month)
  const chartData = useMemo(
    () =>
      monthlyAgg.map((m) => ({
        name: m.label,
        value: m.totalAmount,
      })),
    [monthlyAgg]
  );

  // ✅ Totals for selected range
  const totalAppointments = filteredBookings.length;
  const totalEarnings = monthlyAgg.reduce((sum, m) => sum + m.totalAmount, 0);

  // ✅ Client retention & returning customer percentages (for selected range)
  const {
    totalCustomers,
    returningCustomers,
    retentionRate,
    returningCustomerPercentage,
  } = useMemo(() => {
    const counts = new Map(); // key = phone (ya name), value = booking count

    filteredBookings.forEach((b) => {
      const key = b.phone || b.customerName || null;
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const totalCustomersLocal = counts.size;

    let returningCust = 0;
    let bookingsFromReturning = 0;

    counts.forEach((count) => {
      if (count > 1) {
        returningCust += 1;
        bookingsFromReturning += count;
      }
    });

    const totalBookingsLocal = filteredBookings.length;

    // Retention Rate: % of all bookings that are from returning customers
    const retention =
      totalBookingsLocal > 0
        ? (bookingsFromReturning / totalBookingsLocal) * 100
        : 0;

    // Returning Customer %: customers with >1 booking / total unique customers
    const returningPct =
      totalCustomersLocal > 0 ? (returningCust / totalCustomersLocal) * 100 : 0;

    return {
      totalCustomers: totalCustomersLocal,
      returningCustomers: returningCust,
      retentionRate: retention,
      returningCustomerPercentage: returningPct,
    };
  }, [filteredBookings]);

  // Helper: format currency nicely
  const formatAmount = (value) =>
    (value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="p-6 space-y-6 w-375 pl-80">
      {/* Header + dropdown in one row */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-gray-800">
          Summary (Master Report)
        </h1>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="custom-dropdown px-3 py-1 text-sm text-gray-800 border rounded-md bg-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 focus:border-[#d4af37]"
        >
          <option value="Today">Today</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="This Year">This Year</option>
        </select>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-xl shadow-md">
        {/* More accurate title (revenue only) */}
        <h2 className="text-sm text-gray-500 mb-2">
          Total Revenue (from bookings)
        </h2>

        {loading ? (
          <>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-5" />
            <div className="w-full h-52 bg-gray-50 rounded animate-pulse" />
          </>
        ) : (
          <>
            {/* Total earnings for selected range */}
            <p className="text-3xl font-bold text-gray-800">
              ₹{formatAmount(totalEarnings)}
            </p>
            <p className="text-green-600 text-sm mb-4">
              {selected} (from bookings)
            </p>

            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a3a3a3", fontSize: 13 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `₹${formatAmount(value)}`,
                      "Earnings",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#d4af37"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Total Appointments – from filtered bookings */}
        <div className="bg-[#D3AF37] text-black rounded-xl p-5 text-center shadow">
          <p className="text-sm">Total Appointments</p>
          <p className="text-3xl font-bold">
            {loading ? "..." : totalAppointments}
          </p>
        </div>

        {/* Client Retention Rate */}
        <div className="bg-white rounded-xl p-5 text-center shadow">
          <p className="text-sm text-gray-500">Client Retention Rate</p>
          <p className="text-3xl font-bold text-gray-800">
            {loading ? "..." : `${retentionRate.toFixed(1)}%`}
          </p>
          {!loading && (
            <p className="text-xs text-gray-400 mt-1">
              Based on {returningCustomers} returning customers out of{" "}
              {totalCustomers}
            </p>
          )}
        </div>

        {/* Returning Customer Percentage */}
        <div className="bg-white rounded-xl p-5 text-center shadow">
          <p className="text-sm text-gray-500">Returning Customer Percentage</p>
          <p className="text-3xl font-bold text-gray-800">
            {loading ? "..." : `${returningCustomerPercentage.toFixed(1)}%`}
          </p>
          {!loading && (
            <p className="text-xs text-gray-400 mt-1">
              Customers with more than one booking
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
