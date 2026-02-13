import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiSearch } from "react-icons/fi";
import { ExportContext } from "../layout/ExportContext";
import { formatDisplayDate } from "../layout/dateFilterUtils";

const Pending = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingData, setPendingData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { setExportData, filterType, filterValue } = useContext(ExportContext);

  // Fetch pending bookings from API
  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const bookingsRes = await axios.get("http://localhost:5000/api/bookings");
      const raw = bookingsRes.data;
      const allBookings = Array.isArray(raw)
        ? raw
        : raw?.bookings || raw?.data || [];

      // Filter only pending bookings (case-insensitive)
      const pendingBookings = allBookings.filter(
        (booking) =>
          (booking.paymentStatus || "").toString().toLowerCase() === "pending",
      );

      // Transform data to match component structure
      const transformedData = pendingBookings.map((booking) => {
        const totalAmount =
          booking.services?.reduce(
            (sum, service) => sum + (Number(service.price) || 0),
            0,
          ) || 0;
        const serviceNames =
          booking.services?.map((s) => s.serviceName || s.service).join(", ") ||
          "No services";
        return {
          _id: booking._id,
          customer: booking.customerName || booking.customer || "",
          phone: booking.phone || "",
          date: booking.date ? booking.date.slice(0, 16) : "",
          time: booking.time || "",
          service: serviceNames,
          amount: `₹${totalAmount}`,
          totalAmount,
          status: "pending",
          originalBooking: booking,
        };
      });

      setPendingData(transformedData);
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      setPendingData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const filteredData = useMemo(() => {
    return pendingData
      .filter(
        (item) =>
          (item.customer || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (item.phone || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .filter((item) => {
        if (filterType === "month" && filterValue) {
          const bookingMonthYear = item.date ? item.date.slice(0, 7) : ""; // "YYYY-MM"
          return bookingMonthYear === filterValue;
        } else if (filterType === "year" && filterValue) {
          const bookingYear = item.date ? item.date.slice(0, 4) : ""; // "YYYY"
          return bookingYear === filterValue;
        }
        return true; // "all" filter
      });
  }, [pendingData, searchTerm, filterType, filterValue]);

  // Send filtered data to export (safe: memoized + key)
  const exportRows = useMemo(() => {
    return (filteredData || []).map((d) => ({
      Customer: d.customer,
      Phone: d.phone,
      Date: formatDisplayDate(d.date),
      Time: d.time,
      Service: d.service,
      Amount: d.amount,
      Status: d.status,
    }));
  }, [filteredData]);

  useEffect(() => {
    setExportData(exportRows);
  }, [exportRows, setExportData]);

  const handleCheckboxChange = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (
      selectedRows.length === filteredData.length &&
      filteredData.length > 0
    ) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map((item) => item._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one entry to delete.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedRows.length} selected entr${
        selectedRows.length > 1 ? "ies" : "y"
      }?`,
    );

    if (!confirmDelete) return;

    try {
      for (const bookingId of selectedRows) {
        await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`);
      }

      await fetchPendingBookings();
      setSelectedRows([]);
      toast.success("Selected entries deleted successfully!");
    } catch (error) {
      console.error("Error deleting bookings:", error);
      toast.error("Failed to delete some entries. Please try again.");
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one entry to mark as paid.");
      return;
    }

    const confirmMarkPaid = window.confirm(
      `Are you sure you want to mark ${selectedRows.length} selected booking${
        selectedRows.length > 1 ? "s" : ""
      } as paid?`,
    );

    if (!confirmMarkPaid) return;

    try {
      for (const bookingId of selectedRows) {
        const booking = pendingData.find((item) => item._id === bookingId);
        if (booking && booking.originalBooking) {
          const payload = { ...booking.originalBooking, paymentStatus: "Paid" };
          await axios.put(
            `http://localhost:5000/api/bookings/${bookingId}`,
            payload,
          );
        }
      }

      await fetchPendingBookings();
      setSelectedRows([]);
      toast.success("Selected bookings marked as paid successfully!");
    } catch (error) {
      console.error("Error marking bookings as paid:", error);
      toast.error("Failed to update some bookings. Please try again.");
    }
  };

  const totalPendingAmount = useMemo(
    () => filteredData.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
    [filteredData],
  );

  return (
    <div className="min-h-screen pl-55 flex flex-col items-center py-10 px-4 bg-black shadow-xl">
      {/* Header */}
      <div className="w-full max-w-5xl mb-6">
        <h2 className="text-2xl font-bold text-white border-purple-500 pb-2">
          Pending amount
        </h2>
        {/* <p className="text-[#D3AF37] text-sm mt-1"> */}
        <p className="text-purple-500 text-sm mt-1">
          View your Pending amount summary • Total Pending: ₹
          {totalPendingAmount.toLocaleString()}
        </p>
      </div>

      {/* ✅ Search Bar (consistent dark style) */}
      <div className="flex items-center bg-zinc-900 px-4 py-3 w-full max-w-6xl border border-zinc-700 rounded-md">
        <FiSearch className="text-gray-300 text-xl" />
        <input
          type="text"
          placeholder="Search pending bookings by customer name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none ml-3 w-full text-white placeholder-gray-400"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end text-sm my-5 m-2 w-full max-w-6xl">
        <button
          onClick={handleMarkAsPaid}
          // className="flex items-center gap-1 text-green-600 border border-green-600 px-3 py-1 rounded-md hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          className="flex items-center gap-1 bg-green-600 text-white border border-green-800 px-4 py-2 rounded-md hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedRows.length === 0}
        >
          ✅ Mark as Paid{" "}
          {selectedRows.length > 0 && `(${selectedRows.length})`}
        </button>
        <button
          onClick={handleBulkDelete}
          className="flex items-center gap-1 bg-red-600 text-white border border-red-800 px-4 py-2 rounded-md hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedRows.length === 0}
        >
          🗑 Delete {selectedRows.length > 0 && `(${selectedRows.length})`}
        </button>
        <button
          onClick={fetchPendingBookings}
          className="flex items-center gap-1 bg-blue-900 text-white border border-blue-800 px-4 py-2 rounded-md hover:bg-blue-800 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 w-full max-w-6xl rounded-lg shadow border border-zinc-700 overflow-x-auto text-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="p-3 text-left border-b border-zinc-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-purple-600"
                  checked={
                    filteredData.length > 0 &&
                    selectedRows.length === filteredData.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-3 text-left border-b border-zinc-700">
                Customer
              </th>
              <th className="p-3 text-left border-b border-zinc-700">
                Phone No
              </th>
              <th className="p-3 text-left border-b border-zinc-700">
                Date and Time
              </th>
              <th className="p-3 text-left border-b border-zinc-700">
                Service
              </th>
              <th className="p-3 text-left border-b border-zinc-700">Amount</th>
              <th className="p-3 text-left border-b border-zinc-700">
                Payment Status
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center text-zinc-400 py-6 text-md"
                >
                  Loading pending bookings...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center text-zinc-400 py-6 text-md"
                >
                  {pendingData.length === 0
                    ? "No pending bookings found."
                    : "No entries found for the selected filter."}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-zinc-700 hover:bg-zinc-800 transition-colors"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-purple-600"
                      checked={selectedRows.includes(item._id)}
                      onChange={() => handleCheckboxChange(item._id)}
                    />
                  </td>

                  <td className="p-3 py-5 text-white">{item.customer}</td>
                  <td className="p-3 py-5 text-zinc-300">{item.phone}</td>
                  <td className="p-3 py-5 text-zinc-300">
                    {formatDisplayDate(item.date)}{" "}
                    {item.time && `at ${item.time}`}
                  </td>
                  <td
                    className="p-3 py-5 max-w-xs truncate text-zinc-300"
                    title={item.service}
                  >
                    {item.service}
                  </td>
                  <td className="p-3 py-5 font-semibold text-purple-600">
                    {item.amount}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-900 text-purple-300 border border-purple-700">
                      Pending
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pending;
