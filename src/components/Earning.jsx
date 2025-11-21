import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

function Earning() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEarning, setSelectedEarning] = useState([]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // asc = Jan→Dec, desc = Dec→Jan

  // 12 months list (calendar order)
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // ✅ Fetch bookings from same API as Dashboard
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/bookings");
        setBookings(res.data);
      } catch (err) {
        console.error("Error fetching bookings for earnings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // ✅ Monthly aggregation: totalAppointments, totalAmount, paid, notPaid
  const monthlyData = useMemo(() => {
    const base = MONTHS.map((m) => ({
      month: m,
      totalAppointments: 0,
      totalAmount: 0,
      paid: 0,
      notPaid: 0,
    }));

    bookings.forEach((b) => {
      if (!b.date) return;

      const d = new Date(b.date);
      if (isNaN(d)) return;

      const monthIndex = d.getMonth(); // 0–11
      const paymentStatus = b.paymentStatus || "Pending";

      const totalAmt =
        b.services?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;

      base[monthIndex].totalAppointments += 1;
      base[monthIndex].totalAmount += totalAmt;

      if (paymentStatus === "Paid") {
        base[monthIndex].paid += totalAmt;
      } else {
        base[monthIndex].notPaid += totalAmt;
      }
    });

    return base;
  }, [bookings]);

  // ✅ Sorting by calendar order using MONTHS indexes
  const sortedMonthlyData = useMemo(() => {
    const copy = [...monthlyData];
    copy.sort((a, b) => {
      const idxA = MONTHS.indexOf(a.month);
      const idxB = MONTHS.indexOf(b.month);

      if (sortOrder === "asc") {
        // January → December
        return idxA - idxB;
      } else {
        // December → January
        return idxB - idxA;
      }
    });
    return copy;
  }, [monthlyData, sortOrder]);

  // ✅ Yearly totals row
  const yearlyTotals = useMemo(
    () =>
      monthlyData.reduce(
        (acc, m) => {
          acc.totalAppointments += m.totalAppointments;
          acc.totalAmount += m.totalAmount;
          acc.paid += m.paid;
          acc.notPaid += m.notPaid;
          return acc;
        },
        { totalAppointments: 0, totalAmount: 0, paid: 0, notPaid: 0 }
      ),
    [monthlyData]
  );

  // Helper: format numbers nicely
  const formatAmount = (value) =>
    (value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  // ✅ checkbox select / unselect (per month)
  const handleCheckbox = (month) => {
    setSelectedEarning((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  // ✅ delete action (frontend only)
  const handleDelete = () => {
    if (selectedEarning.length === 0) return;
    alert(
      `Delete action clicked for months: ${selectedEarning.join(
        ", "
      )} (frontend only)`
    );
    setSelectedEarning([]);
  };

  // ✅ sort handler
  const handleSort = (order) => {
    setSortOrder(order);
    setShowSortOptions(false);
  };

  return (
    <div className="p-10 w-355 pl-80 mx-5 text-gray-800">
      <h1 className="text-3xl font-bold mb-1">Earnings</h1>
      <p className="text-[#D3AF37] mb-6 text-sm">
        View your monthly earnings summary
      </p>

      {/* ✅ Controls */}
      <div className="flex gap-4 text-sm my-2 pl-200">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedEarning.length === 0}
        >
          🗑 Delete {selectedEarning.length > 0 && `(${selectedEarning.length})`}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50"
          >
            🔍 Sort {sortOrder === "asc" ? "(Jan-Dec)" : "(Dec-Jan)"}
          </button>
          {showSortOptions && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleSort("asc")}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Jan → Dec
                </button>
                <button
                  onClick={() => handleSort("desc")}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Dec → Jan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-265 rounded-md border border-gray-300 shadow bg-white">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading earnings...</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#D3AF37] text-black">
                <th className="p-2 text-center w-16 border border-gray-300">
                  Select
                </th>
                <th className="p-3 border border-gray-300 text-left">Month</th>
                <th className="p-3 border border-gray-300 text-center">
                  Total Appointments
                </th>
                <th className="p-3 border border-gray-300 text-center">
                  Total Amount
                </th>
                <th className="p-3 border border-gray-300 text-center">
                  Paid Amount
                </th>
                <th className="p-3 border border-gray-300 text-center">
                  Not Paid Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedMonthlyData.map((item) => (
                <tr
                  key={item.month}
                  className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Select checkbox */}
                  <td className="p-3 text-center border border-gray-200">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#D3AF37] cursor-pointer"
                      checked={selectedEarning.includes(item.month)}
                      onChange={() => handleCheckbox(item.month)}
                    />
                  </td>

                  <td className="p-4 border border-gray-200">{item.month}</td>
                  <td className="p-4 border border-gray-200 text-center">
                    {item.totalAppointments}
                  </td>
                  <td className="p-4 border border-gray-200 text-center">
                    ₹{formatAmount(item.totalAmount)}
                  </td>
                  <td className="p-4 border border-gray-200 text-center">
                    ₹{formatAmount(item.paid)}
                  </td>
                  <td className="p-4 border border-gray-200 text-center">
                    ₹{formatAmount(item.notPaid)}
                  </td>
                </tr>
              ))}

              {/* ✅ Dynamic Yearly Total Row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="p-3 border border-gray-300"></td>
                <td className="p-3 border border-gray-300">Total (Yearly)</td>
                <td className="p-3 border border-gray-300 text-center">
                  {yearlyTotals.totalAppointments}
                </td>
                <td className="p-3 border border-gray-300 text-center">
                  ₹{formatAmount(yearlyTotals.totalAmount)}
                </td>
                <td className="p-3 border border-gray-300 text-center">
                  ₹{formatAmount(yearlyTotals.paid)}
                </td>
                <td className="p-3 border border-gray-300 text-center">
                  ₹{formatAmount(yearlyTotals.notPaid)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Earning;
