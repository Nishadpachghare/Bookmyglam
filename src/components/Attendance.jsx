import React, { useEffect, useMemo, useState } from "react";
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
import {
  getActiveStylists,
  getAttendanceAnalytics,
  getAttendanceMonthly,
  getAttendanceSchedule,
  getLocalDateString,
  hydrateAttendanceForDate,
  markAttendance as submitAttendance,
} from "../services";

function Attendance() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [view, setView] = useState("today"); // today, monthly, analytics
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [schedule, setSchedule] = useState(null);

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Fetch stylists
  useEffect(() => {
    let active = true;

    const fetchStylists = async () => {
      try {
        const stylistData = await getActiveStylists();
        const withAttendance = hydrateAttendanceForDate(stylistData, todayStr);

        if (!active) return;

        setStylists(withAttendance);
        if (withAttendance.length > 0) {
          setSelectedStylist(withAttendance[0]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load stylists");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStylists();

    return () => {
      active = false;
    };
  }, [todayStr]);

  // Format time
  const formatTime = (isoTime) => {
    if (!isoTime) return "--";
    return new Date(isoTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calculate attendance status
  const calculateStatus = (checkInTime, checkoutTime) => {
    if (!checkInTime) return "absent";

    const checkInDate = new Date(checkInTime);
    const checkInHour = checkInDate.getHours();
    const checkInMinute = checkInDate.getMinutes();
    const checkInMinutes = checkInHour * 60 + checkInMinute;

    const checkinWindowStart = 10 * 60; // 10:00 AM
    const checkinWindowEnd = 10 * 60 + 40; // 10:40 AM
    const lateCheckInLimit = 14 * 60; // 2:00 PM - NEW
    const checkoutTimeLimit = 21 * 60; // 9:00 PM

    // NEW: Check if check-in is after 2:00 PM → Absent
    if (checkInMinutes >= lateCheckInLimit) {
      return "absent";
    }

    // Check checkout time first
    if (checkoutTime) {
      const checkOutDate = new Date(checkoutTime);
      const checkOutHour = checkOutDate.getHours();
      const checkOutMinute = checkOutDate.getMinutes();
      const checkOutMinutes = checkOutHour * 60 + checkOutMinute;

      if (checkOutMinutes < checkoutTimeLimit) {
        return "half";
      }
    }

    // Check-in logic
    if (
      checkInMinutes >= checkinWindowStart &&
      checkInMinutes <= checkinWindowEnd
    ) {
      return "full";
    } else if (
      checkInMinutes > checkinWindowEnd &&
      checkInMinutes < lateCheckInLimit
    ) {
      return "half";
    } else {
      return "full";
    }
  };

  // Get status message
  const getStatusMessage = (checkInTime, checkoutTime) => {
    if (!checkInTime) return "No check-in";

    const checkInDate = new Date(checkInTime);
    const checkInHour = checkInDate.getHours();
    const checkInMinute = checkInDate.getMinutes();
    const checkInMinutes = checkInHour * 60 + checkInMinute;
    const checkInTime24 = `${String(checkInHour).padStart(2, "0")}:${String(checkInMinute).padStart(2, "0")}`;

    const checkinWindowStart = 10 * 60;
    const checkinWindowEnd = 10 * 60 + 40;
    const lateCheckInLimit = 14 * 60; // 2:00 PM - NEW
    const checkoutTimeLimit = 21 * 60;

    // NEW: Check if check-in is after 2:00 PM
    if (checkInMinutes >= lateCheckInLimit) {
      return `Too late (${checkInTime24}) - Absent`;
    }

    if (checkoutTime) {
      const checkOutDate = new Date(checkoutTime);
      const checkOutHour = checkOutDate.getHours();
      const checkOutMinute = checkOutDate.getMinutes();
      const checkOutMinutes = checkOutHour * 60 + checkOutMinute;

      if (checkOutMinutes < checkoutTimeLimit) {
        return `Early checkout (${String(checkOutHour).padStart(2, "0")}:${String(checkOutMinute).padStart(2, "0")})`;
      }
    }

    if (
      checkInMinutes >= checkinWindowStart &&
      checkInMinutes <= checkinWindowEnd
    ) {
      return `On time (${checkInTime24})`;
    } else if (
      checkInMinutes > checkinWindowEnd &&
      checkInMinutes < lateCheckInLimit
    ) {
      return `Late (${checkInTime24})`;
    } else {
      return `Early (${checkInTime24})`;
    }
  };

  // Mark check-in
  const markCheckIn = async (stylistId) => {
    try {
      const nowISO = new Date().toISOString();
      await submitAttendance({
        stylistId,
        date: todayStr,
        checkInTime: nowISO,
      });
      const status = calculateStatus(nowISO, null);

      localStorage.setItem(`attendance_${todayStr}_${stylistId}`, nowISO);
      localStorage.setItem(
        `attendance_status_${todayStr}_${stylistId}`,
        status,
      );

      setStylists((prev) =>
        prev.map((s) =>
          s._id === stylistId ? { ...s, checkInTime: nowISO, status } : s,
        ),
      );

      // Show appropriate message based on status
      const statusMsg = getStatusMessage(nowISO, null);

      // NEW: After 2:00 PM check-in = Absent
      if (status === "absent") {
        toast.error(`Check-in at ${statusMsg} - Marked as ABSENT`, {
          duration: 5000,
          icon: "❌",
        });
      } else if (status === "half") {
        toast.success(
          `Check-in recorded: ${statusMsg} - Half Day will be marked`,
        );
      } else {
        toast.success(`Check-in recorded: ${statusMsg} - Full Day`);
      }
    } catch {
      toast.error("Failed to mark check-in");
    }
  };

  const markCheckout = async (stylistId) => {
    try {
      const nowISO = new Date().toISOString();
      const stylist = stylists.find((s) => s._id === stylistId);
      if (!stylist?.checkInTime) {
        toast.error("Check-in not found for this stylist");
        return;
      }

      // Check if checkout is before 9 PM
      const checkOutDate = new Date(nowISO);
      const checkOutHour = checkOutDate.getHours();
      const checkOutMinute = checkOutDate.getMinutes();
      const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
      const checkoutTimeLimit = 21 * 60; // 9:00 PM

      await submitAttendance({
        stylistId,
        date: todayStr,
        checkoutTime: nowISO,
      });

      const newStatus = calculateStatus(stylist.checkInTime, nowISO);
      localStorage.setItem(`checkout_${todayStr}_${stylistId}`, nowISO);
      localStorage.setItem(
        `attendance_status_${todayStr}_${stylistId}`,
        newStatus,
      );

      setStylists((prev) =>
        prev.map((s) =>
          s._id === stylistId
            ? { ...s, checkoutTime: nowISO, status: newStatus }
            : s,
        ),
      );

      if (checkOutMinutes < checkoutTimeLimit) {
        toast.success(
          `Early checkout at ${String(checkOutHour).padStart(2, "0")}:${String(checkOutMinute).padStart(2, "0")} - Half Day will be marked`,
          { duration: 4000 },
        );
      } else {
        toast.success("Checkout recorded - Full Day confirmed");
      }
    } catch {
      toast.error("Failed to mark checkout");
    }
  };

  // Fetch analytics for selected stylist
  const fetchAnalytics = async (stylistId) => {
    try {
      const data = await getAttendanceAnalytics(stylistId);
      setAnalyticsData(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch analytics");
    }
  };

  // Fetch monthly data
  const fetchMonthlyData = async (stylistId, month) => {
    try {
      const data = await getAttendanceMonthly(stylistId, month);
      setMonthlyData(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch monthly data");
    }
  };

  // Fetch schedule
  const fetchSchedule = async (stylistId) => {
    try {
      const data = await getAttendanceSchedule(stylistId);
      setSchedule(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStylistChange = (stylist) => {
    setSelectedStylist(stylist);
    fetchAnalytics(stylist._id);
    fetchSchedule(stylist._id);
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    if (selectedStylist) {
      fetchMonthlyData(selectedStylist._id, month);
    }
  };

  return (
    <div className="p-10 min-h-screen pr-20 pl-80  bg-black text-white overflow-auto">
      <h1 className="text-4xl font-bold mb-10">
        Attendance & Analytics Dashboard
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
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p>{formatTime(s.checkInTime)}</p>
                            {s.checkInTime && (
                              <p className="text-xs text-zinc-400">
                                {getStatusMessage(
                                  s.checkInTime,
                                  s.checkoutTime,
                                )}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {!s.checkInTime || s.status === "absent" ? (
                            <span className="px-3 py-1 rounded bg-red-600/20 text-red-400 text-xs font-semibold border border-red-600/50">
                              Absent
                            </span>
                          ) : s.status === "half" ? (
                            <span className="px-3 py-1 rounded bg-yellow-600/20 text-yellow-400 text-xs font-semibold border border-yellow-600/50">
                              Half Day
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded bg-green-600/20 text-green-400 text-xs font-semibold border border-green-600/50">
                              Full Day
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {formatTime(s.checkoutTime)}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          {!s.checkInTime && (
                            <button
                              onClick={() => markCheckIn(s._id)}
                              className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold transition"
                            >
                              Check-in
                            </button>
                          )}
                          {s.checkInTime && !s.checkoutTime && (
                            <button
                              onClick={() => markCheckout(s._id)}
                              className="px-4 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold transition"
                            >
                              Check-out
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
              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Attendance Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Present",
                          value: analyticsData.stats.presentDays,
                        },
                        {
                          name: "Absent",
                          value:
                            analyticsData.stats.totalCustomers > 0
                              ? 30 - analyticsData.stats.presentDays
                              : 0,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #444",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Schedule Information */}
          {schedule && (
            <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
              <h3 className="text-lg font-semibold mb-4">
                📅 Shift & Schedule
              </h3>
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
    </div>
  );
}

export default Attendance;
