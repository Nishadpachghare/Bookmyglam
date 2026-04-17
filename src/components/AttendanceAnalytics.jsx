import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function AttendanceAnalytics() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [view, setView] = useState("today"); // today, monthly, analytics, daily
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [schedule, setSchedule] = useState(null);

  // 🔥 NEW: Daily view state
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dailyAttendanceData, setDailyAttendanceData] = useState(null);

  const getLocalDateStr = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  };

  const todayStr = getLocalDateStr();

  // Fetch stylists
  useEffect(() => {
    const fetchStylists = async () => {
      try {
        console.log("🔄 Fetching stylists...");
        const res = await fetch("http://localhost:5000/api/stylists");
        console.log("📦 Response status:", res.status);

        if (!res.ok) {
          throw new Error(`API returned status ${res.status}`);
        }

        const data = await res.json();
        console.log("📊 API Response:", data);

        let stylistData = data?.data ?? data;
        console.log("👥 Stylist data extracted:", stylistData);

        if (!Array.isArray(stylistData)) {
          console.warn(
            "⚠️ Stylist data is not an array, converting to empty array",
          );
          stylistData = [];
        }

        console.log(`✅ Total stylists received: ${stylistData.length}`);

        const withAttendance = stylistData
          .filter((s) => s.status === "active")
          .map((s) => {
            const savedCheckIn = localStorage.getItem(
              `attendance_${todayStr}_${s._id}`,
            );
            const savedStatus = localStorage.getItem(
              `attendance_status_${todayStr}_${s._id}`,
            );
            const savedCheckout = localStorage.getItem(
              `checkout_${todayStr}_${s._id}`,
            );

            return {
              ...s,
              checkInTime: savedCheckIn || null,
              checkoutTime: savedCheckout || null,
              status: savedStatus || null,
            };
          });

        console.log(
          `✅ Active stylists: ${withAttendance.length}`,
          withAttendance,
        );

        setStylists(withAttendance);
        if (withAttendance.length > 0) {
          const firstStylist = withAttendance[0];
          setSelectedStylist(firstStylist);
          console.log("✅ Selected first stylist:", firstStylist);
          console.log("⏱️ useEffect will auto-fetch analytics and schedule...");
        } else {
          console.warn("⚠️ No active stylists found");
        }
      } catch (err) {
        console.error("❌ Error fetching stylists:", err);
        toast.error("Failed to load stylists: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStylists();
  }, []);

  // 🔥 Auto-fetch analytics and schedule when selected stylist changes
  useEffect(() => {
    if (selectedStylist) {
      console.log(
        "🔄 Selected stylist changed, auto-fetching analytics and schedule for:",
        selectedStylist.name,
      );
      fetchAnalytics(selectedStylist._id);
      fetchSchedule(selectedStylist._id);
    }
  }, [selectedStylist?._id]);

  // 🔥 NEW: Auto-fetch daily attendance when selected date changes
  useEffect(() => {
    console.log("📅 Date changed to:", selectedDate);
    fetchDailyAttendance(selectedDate);
  }, [selectedDate]);

  // Format time
  const formatTime = (isoTime) => {
    if (!isoTime) return "--";
    return new Date(isoTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Mark attendance
  const markPresent = async (stylistId) => {
    try {
      const nowISO = new Date().toISOString();
      const response = await fetch(
        "http://localhost:5000/api/attendance/mark",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stylistId,
            date: todayStr,
            checkInTime: nowISO,
            status: "full",
          }),
        },
      );

      if (!response.ok) throw new Error();

      localStorage.setItem(`attendance_${todayStr}_${stylistId}`, nowISO);
      localStorage.setItem(
        `attendance_status_${todayStr}_${stylistId}`,
        "full",
      );

      setStylists((prev) =>
        prev.map((s) =>
          s._id === stylistId
            ? { ...s, checkInTime: nowISO, status: "full" }
            : s,
        ),
      );

      toast.success("Marked Full Day");
    } catch (err) {
      toast.error("Failed to mark attendance");
    }
  };

  const markHalfDay = async (stylistId) => {
    try {
      const nowISO = new Date().toISOString();
      const response = await fetch(
        "http://localhost:5000/api/attendance/mark",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stylistId,
            date: todayStr,
            checkInTime: nowISO,
            status: "half",
          }),
        },
      );

      if (!response.ok) throw new Error();

      localStorage.setItem(`attendance_${todayStr}_${stylistId}`, nowISO);
      localStorage.setItem(
        `attendance_status_${todayStr}_${stylistId}`,
        "half",
      );

      setStylists((prev) =>
        prev.map((s) =>
          s._id === stylistId
            ? { ...s, checkInTime: nowISO, status: "half" }
            : s,
        ),
      );

      toast.success("Marked Half Day");
    } catch (err) {
      toast.error("Failed to mark half day");
    }
  };

  const markCheckout = async (stylistId) => {
    try {
      const nowISO = new Date().toISOString();
      const response = await fetch(
        "http://localhost:5000/api/attendance/mark",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stylistId,
            date: todayStr,
            checkoutTime: nowISO,
          }),
        },
      );

      if (!response.ok) throw new Error();

      localStorage.setItem(`checkout_${todayStr}_${stylistId}`, nowISO);

      setStylists((prev) =>
        prev.map((s) =>
          s._id === stylistId ? { ...s, checkoutTime: nowISO } : s,
        ),
      );

      toast.success("Checkout time updated");
    } catch (err) {
      toast.error("Failed to mark checkout");
    }
  };

  // Fetch analytics for selected stylist
  const fetchAnalytics = async (stylistId) => {
    try {
      console.log("🔄 Fetching analytics for stylist:", stylistId);
      const res = await fetch(
        `http://localhost:5000/api/attendance/analytics?stylistId=${stylistId}`,
      );
      console.log("📦 Analytics response status:", res.status);

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      console.log("📊 Full Analytics data:", data);
      console.log("📊 Stats breakdown:");
      console.log("   - presentDays:", data.stats.presentDays);
      console.log("   - absenceDays:", data.stats.absenceDays);
      console.log("   - totalDays:", data.stats.totalDays);
      console.log("   - totalCustomers:", data.stats.totalCustomers);

      setAnalyticsData(data);
    } catch (err) {
      console.error("❌ Error fetching analytics:", err);
      toast.error("Failed to fetch analytics: " + err.message);
    }
  };

  // Fetch monthly data
  const fetchMonthlyData = async (stylistId, month) => {
    try {
      const [year, monthNum] = month.split("-");
      console.log(
        "🔄 Fetching monthly data for stylist:",
        stylistId,
        "month:",
        monthNum,
        "year:",
        year,
      );
      const res = await fetch(
        `http://localhost:5000/api/attendance/monthly?stylistId=${stylistId}&month=${monthNum}&year=${year}`,
      );
      console.log("📦 Monthly data response status:", res.status);

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      console.log("📊 Monthly data:", data);
      setMonthlyData(data);
    } catch (err) {
      console.error("❌ Error fetching monthly data:", err);
      toast.error("Failed to fetch monthly data: " + err.message);
    }
  };

  // Fetch schedule
  const fetchSchedule = async (stylistId) => {
    try {
      console.log("🔄 Fetching schedule for stylist:", stylistId);
      const res = await fetch(
        `http://localhost:5000/api/attendance/schedule?stylistId=${stylistId}`,
      );
      console.log("📦 Schedule response status:", res.status);

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      console.log("📊 Full Schedule response:", data);
      console.log("   Schedule data object:", data.data);
      console.log("   Holidays:", data.data?.holidays);
      console.log("   Half Days:", data.data?.halfDays);
      setSchedule(data.data);
    } catch (err) {
      console.error("❌ Error fetching schedule:", err);
    }
  };

  // 🔥 NEW: Fetch daily attendance for all stylists on a specific date
  const fetchDailyAttendance = async (date) => {
    try {
      console.log("🔄 Fetching attendance for date:", date);
      const res = await fetch(
        `http://localhost:5000/api/attendance/by-date?date=${date}`,
      );
      console.log("📦 Daily attendance response status:", res.status);

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      console.log("📊 Daily attendance data:", data);
      setDailyAttendanceData(data.data || []);
    } catch (err) {
      console.error("❌ Error fetching daily attendance:", err);
      toast.error("Failed to fetch daily attendance: " + err.message);
      setDailyAttendanceData([]);
    }
  };

  const handleStylistChange = (stylist) => {
    console.log("👤 User changed stylist to:", stylist.name);
    setSelectedStylist(stylist);
    // Note: useEffect will auto-fetch analytics and schedule
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    if (selectedStylist) {
      fetchMonthlyData(selectedStylist._id, month);
    }
  };

  const addHoliday = async (date) => {
    if (!selectedStylist) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/attendance/holiday",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stylistId: selectedStylist._id,
            date,
          }),
        },
      );

      if (!response.ok) throw new Error();

      toast.success("Holiday added");
      fetchSchedule(selectedStylist._id);
    } catch (err) {
      toast.error("Failed to add holiday");
    }
  };

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="p-10 min-h-screen pr-20 bg-black text-white overflow-auto">
      <h1 className="text-4xl font-bold mb-10">
        📊 Attendance & Analytics Dashboard
      </h1>

      {/* View Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setView("today")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            view === "today"
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          📅 Today's Attendance
        </button>
        <button
          onClick={() => {
            setView("analytics");
            if (selectedStylist) fetchAnalytics(selectedStylist._id);
          }}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            view === "analytics"
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          📈 Analytics (30 Days)
        </button>
        <button
          onClick={() => {
            setView("monthly");
            if (selectedStylist)
              fetchMonthlyData(selectedStylist._id, selectedMonth);
          }}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            view === "monthly"
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          📋 Monthly Report
        </button>
        {/* 🔥 NEW: Daily View Button */}
        <button
          onClick={() => setView("daily")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            view === "daily"
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          🔍 Daily Breakdown
        </button>
      </div>

      {/* VIEW 1: TODAY'S ATTENDANCE */}
      {view === "today" && (
        <div>
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Today's Attendance</h2>

            {loading ? (
              <p className="text-zinc-400">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Stylist</th>
                      <th className="px-4 py-3 text-left">Check-in</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Check-out</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stylists.map((s) => (
                      <tr
                        key={s._id}
                        className="border-b border-zinc-700 hover:bg-zinc-800"
                      >
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3">
                          {formatTime(s.checkInTime)}
                        </td>
                        <td className="px-4 py-3">
                          {!s.checkInTime ? (
                            <span className="px-2 py-1 rounded bg-zinc-600 text-xs">
                              Absent
                            </span>
                          ) : s.status === "half" ? (
                            <span className="px-2 py-1 rounded bg-yellow-600 text-xs">
                              Half Day
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-green-600 text-xs">
                              Full Day
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {formatTime(s.checkoutTime)}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          {!s.checkInTime && (
                            <>
                              <button
                                onClick={() => markPresent(s._id)}
                                className="px-3 py-1 bg-green-600 rounded text-xs hover:bg-green-700"
                              >
                                Full Day
                              </button>
                              <button
                                onClick={() => markHalfDay(s._id)}
                                className="px-3 py-1 bg-yellow-600 rounded text-xs hover:bg-yellow-700"
                              >
                                Half Day
                              </button>
                            </>
                          )}
                          {s.checkInTime && !s.checkoutTime && (
                            <button
                              onClick={() => markCheckout(s._id)}
                              className="px-3 py-1 bg-purple-600 rounded text-xs hover:bg-purple-700"
                            >
                              Checkout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ANALYTICS */}
      {view === "analytics" && (
        <div>
          {/* Stylist Selector */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">
              Select Stylist
            </label>
            <select
              value={selectedStylist?._id || ""}
              onChange={(e) => {
                const stylist = stylists.find((s) => s._id === e.target.value);
                if (stylist) handleStylistChange(stylist);
              }}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
            >
              {stylists.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stats Cards */}
          {analyticsData?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <p className="text-zinc-400 text-sm">Customers (30 days)</p>
                <p className="text-3xl font-bold text-green-500">
                  {analyticsData.stats.totalCustomers}
                </p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <p className="text-zinc-400 text-sm">Revenue</p>
                <p className="text-3xl font-bold text-blue-500">
                  ₹{analyticsData.stats.totalRevenue}
                </p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <p className="text-zinc-400 text-sm">Avg Customers/Day</p>
                <p className="text-3xl font-bold text-purple-500">
                  {analyticsData.stats.averageCustomersPerDay.toFixed(1)}
                </p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <p className="text-zinc-400 text-sm">Attendance %</p>
                <p className="text-3xl font-bold text-yellow-500">
                  {analyticsData.stats.attendancePercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          )}

          {/* Charts */}
          {analyticsData?.chartData && analyticsData.chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Customers Chart */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Customers Handled Daily
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #444",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="customers"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Chart */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #444",
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Hours Chart */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Hours Worked Daily
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #444",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Attendance Status Pie */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg border border-zinc-700 p-6 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                    📊 Attendance Breakdown
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Monthly attendance summary (Last 30 days)
                  </p>

                  {/* DEBUG PANEL */}
                  <div className="mt-3 bg-red-900/50 border-2 border-red-500 rounded p-3 text-sm text-red-200 font-mono">
                    <p className="font-bold">🔍 DEBUG DATA:</p>
                    <p>
                      ✅ Present:{" "}
                      <span className="text-green-400 font-bold">
                        {analyticsData?.stats?.presentDays ?? "N/A"}
                      </span>
                    </p>
                    <p>
                      ❌ Absent:{" "}
                      <span className="text-red-400 font-bold">
                        {analyticsData?.stats?.absenceDays ?? "N/A"}
                      </span>
                    </p>
                    <p>
                      📅 Total:{" "}
                      <span className="text-blue-400 font-bold">
                        {analyticsData?.stats?.totalDays ?? "N/A"}
                      </span>
                    </p>
                    <p className="text-xs mt-2">Backend API Response Check ✓</p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Chart */}
                  <div className="flex-1 flex justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Present",
                              value: Math.max(
                                1,
                                analyticsData.stats.presentDays,
                              ),
                            },
                            {
                              name: "Absent",
                              value: Math.max(
                                1,
                                analyticsData.stats.absenceDays,
                              ), // ✅ Use actual absence days
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          fill="#8884d8"
                          dataKey="value"
                          labelLine={true}
                          label={({ name, value, payload }) => {
                            const actualValue =
                              payload.payload.name === "Present"
                                ? analyticsData.stats.presentDays
                                : analyticsData.stats.absenceDays; // ✅ Show actual count
                            return (
                              <span className="font-semibold text-lg fill-white">
                                {name}: {actualValue}
                              </span>
                            );
                          }}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "2px solid #3b82f6",
                            borderRadius: "8px",
                            padding: "12px",
                          }}
                          formatter={(value, name, props) => {
                            const actualValue =
                              props.payload.name === "Present"
                                ? analyticsData.stats.presentDays
                                : analyticsData.stats.absenceDays; // ✅ Show actual count in tooltip
                            return [actualValue, props.payload.name];
                          }}
                          labelFormatter={(label) => `${label}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats Cards */}
                  <div className="flex flex-col justify-center gap-4 min-w-[250px]">
                    {/* Present Card */}
                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-4 hover:border-green-600 transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 font-semibold">
                          Present
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-green-400">
                        {analyticsData.stats.presentDays}
                      </div>
                      <p className="text-xs text-green-300 mt-1">
                        {analyticsData.stats.totalDays > 0
                          ? (
                              (analyticsData.stats.presentDays /
                                analyticsData.stats.totalDays) *
                              100
                            ).toFixed(1)
                          : 0}
                        % attendance rate
                      </p>
                    </div>

                    {/* Absent Card */}
                    <div className="bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-700/50 rounded-lg p-4 hover:border-red-600 transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-red-400 font-semibold">
                          Absent
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-red-400">
                        {analyticsData.stats.absenceDays}{" "}
                        {/* ✅ Use actual absence days */}
                      </div>
                      <p className="text-xs text-red-300 mt-1">
                        {analyticsData.stats.totalDays > 0
                          ? (
                              (analyticsData.stats.absenceDays /
                                analyticsData.stats.totalDays) *
                              100
                            ).toFixed(1)
                          : 0}
                        % absence rate
                      </p>
                    </div>

                    {/* Total Days Card */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-lg p-4 hover:border-blue-600 transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-400 font-semibold">
                          Total Days
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-blue-400">
                        {analyticsData.stats.totalDays}
                      </div>{" "}
                      {/* ✅ Show actual total days */}
                      <p className="text-xs text-blue-300 mt-1">
                        Tracked in last 30 days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Information */}
          {schedule && (
            <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
              <h3 className="text-lg font-semibold mb-4">
                📅 Shift & Schedule
              </h3>

              {/* DEBUG PANEL FOR SCHEDULE */}
              <div className="mb-4 bg-orange-900/50 border-2 border-orange-500 rounded p-2 text-sm text-orange-200 font-mono">
                <p className="font-bold">🔍 SCHEDULE DEBUG:</p>
                <p>
                  Holidays:{" "}
                  <span className="text-red-400 font-bold">
                    {schedule?.holidays?.length ?? 0}
                  </span>{" "}
                  {schedule?.holidays && schedule.holidays.length > 0
                    ? `[${schedule.holidays.join(", ")}]`
                    : "[]"}
                </p>
                <p>
                  Half Days:{" "}
                  <span className="text-yellow-400 font-bold">
                    {schedule?.halfDays?.length ?? 0}
                  </span>{" "}
                  {schedule?.halfDays && schedule.halfDays.length > 0
                    ? `[${schedule.halfDays.join(", ")}]`
                    : "[]"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-zinc-400 text-sm">Shift Start Time</p>
                  <p className="text-xl font-semibold">
                    {schedule.shiftStartTime}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Shift End Time</p>
                  <p className="text-xl font-semibold">
                    {schedule.shiftEndTime}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Holidays</p>
                  <p className="text-xl font-semibold">
                    {schedule.holidays.length}
                  </p>
                </div>
              </div>

              {/* Holidays List */}
              {schedule.holidays.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-red-500 mb-2">🚫 Holidays</p>
                  <div className="flex flex-wrap gap-2">
                    {schedule.holidays.map((date) => (
                      <span
                        key={date}
                        className="px-2 py-1 bg-red-900 rounded text-sm"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Half Days List */}
              {schedule.halfDays.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-yellow-500 mb-2">
                    ⚠️ Half Days
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {schedule.halfDays.map((date) => (
                      <span
                        key={date}
                        className="px-2 py-1 bg-yellow-900 rounded text-sm"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: MONTHLY REPORT */}
      {view === "monthly" && (
        <div>
          {/* Month Selector */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
            />
          </div>

          {monthlyData?.stats && (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                  <p className="text-zinc-400 text-sm">Full Days</p>
                  <p className="text-3xl font-bold text-green-500">
                    {monthlyData.stats.fullDays}
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                  <p className="text-zinc-400 text-sm">Half Days</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {monthlyData.stats.halfDays}
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                  <p className="text-zinc-400 text-sm">Absent Days</p>
                  <p className="text-3xl font-bold text-red-500">
                    {monthlyData.stats.absentDays}
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                  <p className="text-zinc-400 text-sm">Total Customers</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {monthlyData.stats.totalCustomers}
                  </p>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Detailed Attendance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-800">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Check-in</th>
                        <th className="px-4 py-3 text-left">Check-out</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Customers</th>
                        <th className="px-4 py-3 text-left">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.data.map((record) => (
                        <tr
                          key={record._id}
                          className="border-b border-zinc-700 hover:bg-zinc-800"
                        >
                          <td className="px-4 py-3">{record.date}</td>
                          <td className="px-4 py-3 text-zinc-300">
                            {formatTime(record.checkInTime)}
                          </td>
                          <td className="px-4 py-3 text-zinc-300">
                            {formatTime(record.checkoutTime)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                record.status === "full"
                                  ? "bg-green-600"
                                  : record.status === "half"
                                    ? "bg-yellow-600"
                                    : record.status === "holiday"
                                      ? "bg-purple-600"
                                      : "bg-red-600"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {record.customersHandled}
                          </td>
                          <td className="px-4 py-3">₹{record.totalRevenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 🔥 VIEW 4: DAILY BREAKDOWN */}
      {view === "daily" && (
        <div>
          {/* Date Selector */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
            />
          </div>

          {/* Daily Attendance Table - All Stylists */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <h3 className="text-lg font-semibold mb-4">
              📅 All Stylists Activity on {selectedDate}
            </h3>

            {dailyAttendanceData && dailyAttendanceData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Stylist Name</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Check-in</th>
                      <th className="px-4 py-3 text-left">Check-out</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Customers</th>
                      <th className="px-4 py-3 text-left">Revenue</th>
                      <th className="px-4 py-3 text-left">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAttendanceData.map((record) => (
                      <tr
                        key={record._id}
                        className="border-b border-zinc-700 hover:bg-zinc-800"
                      >
                        <td className="px-4 py-3 font-medium">
                          {record.stylistId?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 capitalize text-zinc-400">
                          {record.stylistId?.role || "--"}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {formatTime(record.checkInTime)}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {formatTime(record.checkoutTime)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              record.status === "full"
                                ? "bg-green-600 text-white"
                                : record.status === "half"
                                  ? "bg-yellow-600 text-white"
                                  : record.status === "holiday"
                                    ? "bg-purple-600 text-white"
                                    : record.status === "absent"
                                      ? "bg-red-600 text-white"
                                      : "bg-zinc-600 text-white"
                            }`}
                          >
                            {record.status || "absent"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {record.customersHandled || 0}
                        </td>
                        <td className="px-4 py-3 text-green-400 font-medium">
                          ₹{record.totalRevenue || 0}
                        </td>
                        <td className="px-4 py-3 text-blue-400">
                          {record.hoursWorked
                            ? record.hoursWorked.toFixed(2)
                            : "--"}{" "}
                          hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-400 text-lg">
                  No attendance records for {selectedDate}
                </p>
                <p className="text-zinc-500 text-sm mt-2">
                  All stylists were absent on this day
                </p>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {dailyAttendanceData && dailyAttendanceData.length > 0 && (
            <>
              {(() => {
                const summary = {
                  present: dailyAttendanceData.filter(
                    (r) => r.status !== "absent",
                  ).length,
                  absent: dailyAttendanceData.filter(
                    (r) => r.status === "absent",
                  ).length,
                  totalCustomers: dailyAttendanceData.reduce(
                    (sum, r) => sum + (r.customersHandled || 0),
                    0,
                  ),
                  totalRevenue: dailyAttendanceData.reduce(
                    (sum, r) => sum + (r.totalRevenue || 0),
                    0,
                  ),
                };

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                        <p className="text-zinc-400 text-sm">Present</p>
                        <p className="text-3xl font-bold text-green-500">
                          {summary.present}
                        </p>
                      </div>
                      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                        <p className="text-zinc-400 text-sm">Absent</p>
                        <p className="text-3xl font-bold text-red-500">
                          {summary.absent}
                        </p>
                      </div>
                      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                        <p className="text-zinc-400 text-sm">Total Customers</p>
                        <p className="text-3xl font-bold text-blue-500">
                          {summary.totalCustomers}
                        </p>
                      </div>
                      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                        <p className="text-zinc-400 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold text-yellow-500">
                          ₹{summary.totalRevenue}
                        </p>
                      </div>
                    </div>

                    {/* Today's Attendance Pie Chart */}
                    <div className="mt-8 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg border border-zinc-700 p-6 shadow-lg">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                          📊 Today's Attendance Breakdown
                        </h3>
                        <p className="text-zinc-400 text-sm">
                          Live attendance status
                        </p>
                      </div>

                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Pie Chart */}
                        <div className="flex-1 flex justify-center">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    name: "Present",
                                    value: summary.present,
                                  },
                                  {
                                    name: "Absent",
                                    value: summary.absent,
                                  },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                                labelLine={false}
                                label={({ name, value, percent }) => (
                                  <text className="font-semibold text-sm fill-white">
                                    {`${name}: ${value}`}
                                  </text>
                                )}
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1f2937",
                                  border: "2px solid #3b82f6",
                                  borderRadius: "8px",
                                  padding: "12px",
                                }}
                                formatter={(value) => [value, "Stylists"]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Stats Cards */}
                        <div className="flex flex-col justify-center gap-4 min-w-[240px]">
                          {/* Present Today */}
                          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-4 hover:border-green-600 transition">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-400 font-semibold">
                                Present Today
                              </span>
                            </div>
                            <div className="text-3xl font-bold text-green-400">
                              {summary.present}
                            </div>
                            <p className="text-xs text-green-300 mt-1">
                              {summary.present + summary.absent > 0
                                ? (
                                    (summary.present /
                                      (summary.present + summary.absent)) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              % checked in
                            </p>
                          </div>

                          {/* Absent Today */}
                          <div className="bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-700/50 rounded-lg p-4 hover:border-red-600 transition">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span className="text-red-400 font-semibold">
                                Absent Today
                              </span>
                            </div>
                            <div className="text-3xl font-bold text-red-400">
                              {summary.absent}
                            </div>
                            <p className="text-xs text-red-300 mt-1">
                              {summary.present + summary.absent > 0
                                ? (
                                    (summary.absent /
                                      (summary.present + summary.absent)) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              % not checked in
                            </p>
                          </div>

                          {/* Total Stylists */}
                          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-4 hover:border-purple-600 transition">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="text-purple-400 font-semibold">
                                Total Stylists
                              </span>
                            </div>
                            <div className="text-3xl font-bold text-purple-400">
                              {summary.present + summary.absent}
                            </div>
                            <p className="text-xs text-purple-300 mt-1">
                              On roster today
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* Monthly Attendance Breakdown */}
          {selectedStylist && analyticsData && (
            <div className="mt-8 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg border border-zinc-700 p-6 shadow-lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                  📊 {selectedMonth} - Attendance Breakdown
                </h3>
                <p className="text-zinc-400 text-sm">
                  Monthly attendance summary (30 days)
                </p>

                {/* DEBUG PANEL */}
                <div className="mt-3 bg-zinc-800 border border-yellow-600 rounded p-2 text-xs text-yellow-300 font-mono">
                  <p>🔍 DEBUG - Backend Data:</p>
                  <p>
                    Present: {analyticsData?.stats?.presentDays ?? "undefined"}{" "}
                    | Absent: {analyticsData?.stats?.absenceDays ?? "undefined"}{" "}
                    | Total: {analyticsData?.stats?.totalDays ?? "undefined"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Pie Chart */}
                <div className="flex-1 flex justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Present",
                            value: Math.max(
                              1,
                              analyticsData?.stats?.presentDays ?? 0,
                            ),
                          },
                          {
                            name: "Absent",
                            value: Math.max(
                              1,
                              analyticsData?.stats?.absenceDays ?? 0,
                            ),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={true}
                        label={({ name, value, payload }) => {
                          // Show actual value, not the min(1) padded value
                          const actualValue =
                            payload.payload.name === "Present"
                              ? (analyticsData?.stats?.presentDays ?? 0)
                              : (analyticsData?.stats?.absenceDays ?? 0);
                          return (
                            <span className="font-bold text-lg fill-white">
                              {name}: {actualValue}
                            </span>
                          );
                        }}
                      >
                        <Cell fill="#10b981" /> {/* Green for Present */}
                        <Cell fill="#ef4444" /> {/* Red for Absent */}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "2px solid #3b82f6",
                          borderRadius: "8px",
                          padding: "12px",
                          color: "#fff",
                        }}
                        formatter={(value, name, props) => {
                          // Show actual value in tooltip
                          const actualValue =
                            props.payload.name === "Present"
                              ? analyticsData.stats.presentDays
                              : analyticsData.stats.absenceDays; // ✅ Use actual absence days
                          return [actualValue, props.payload.name];
                        }}
                        labelFormatter={(name) => `${name}`}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ paddingTop: "20px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats Cards */}
                <div className="flex flex-col justify-center gap-4 min-w-[250px]">
                  {/* Present Days */}
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-4 hover:border-green-600 transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-semibold">
                        Present Days
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      {analyticsData.stats.presentDays}
                    </div>
                    <p className="text-xs text-green-300 mt-1">
                      {analyticsData.stats.totalDays > 0
                        ? (
                            (analyticsData.stats.presentDays /
                              analyticsData.stats.totalDays) *
                            100
                          ).toFixed(1)
                        : 0}
                      % attendance rate
                    </p>
                  </div>

                  {/* Absent Days */}
                  <div className="bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-700/50 rounded-lg p-4 hover:border-red-600 transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-red-400 font-semibold">
                        Absent Days
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-red-400">
                      {analyticsData.stats.absenceDays}{" "}
                      {/* ✅ Use actual absence days */}
                    </div>
                    <p className="text-xs text-red-300 mt-1">
                      {analyticsData.stats.totalDays > 0
                        ? (
                            (analyticsData.stats.absenceDays /
                              analyticsData.stats.totalDays) *
                            100
                          ).toFixed(1)
                        : 0}
                      % absence rate
                    </p>
                  </div>

                  {/* Total Days */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-lg p-4 hover:border-blue-600 transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-400 font-semibold">
                        Total Days
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {analyticsData.stats.totalDays}
                    </div>{" "}
                    {/* ✅ Show actual total days */}
                    <p className="text-xs text-blue-300 mt-1">
                      Tracked in last 30 days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceAnalytics;
