import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch } from "react-icons/fi";

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [allServices, setAllServices] = useState([]); // ✅ master service list
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [editingBooking, setEditingBooking] = useState(null);

  // ✅ Fetch bookings
  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bookings");
      setBookings(res.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  // ✅ Fetch active stylists only
  const fetchStylists = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stylists");
      const activeStylists = res.data.filter(
        (stylist) => stylist.status?.toLowerCase() === "active"
      );
      setStylists(activeStylists);
    } catch (error) {
      console.error("Error fetching stylists:", error);
    }
  };

  // ✅ Fetch all services (service master for dropdown)
  const fetchAllServices = async () => {
    try {
      // 👉 Yahan apna correct services endpoint daalna:
      // e.g. /api/Manageservices ya /api/services
      const res = await axios.get("http://localhost:5000/api/Manageservices");
      setAllServices(res.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  // ✅ Fetch bookings, stylists, services on mount
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchBookings(), fetchStylists(), fetchAllServices()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // ✅ Calculate totals
  const totalBookings = bookings.length;
  const totalStylists = stylists.length;
  const totalEarnings = bookings.reduce((sum, booking) => {
    const totalServicePrice = booking.services?.reduce(
      (a, s) => a + (s.price || 0),
      0
    );
    return sum + totalServicePrice;
  }, 0);

  // ✅ Filter by search
  const filteredBookings = bookings.filter((b) => {
    const name = b.customerName?.toLowerCase() || "";
    const phone = b.phone?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase())
    );
  });

  // ✅ Sort by name (A-Z / Z-A)
  const handleSort = (order) => {
    setSortOrder(order);
    setShowSortOptions(false);

    const sorted = [...bookings].sort((a, b) => {
      const nameA = a.customerName?.toLowerCase() || "";
      const nameB = b.customerName?.toLowerCase() || "";
      if (order === "asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
    setBookings(sorted);
  };

  // ✅ Handle booking selection (for delete)
  const handleSelectBooking = (id) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  // ✅ Delete selected bookings
  const handleDelete = async () => {
    if (selectedBookings.length === 0) return;

    try {
      for (const id of selectedBookings) {
        await axios.delete(`http://localhost:5000/api/bookings/${id}`);
      }
      await fetchBookings(); // refresh data
      setSelectedBookings([]);
    } catch (error) {
      console.error("Error deleting bookings:", error);
    }
  };

  // ✅ When user clicks Edit button in table
  const handleEditClick = (booking) => {
    setEditingBooking({
      ...booking,
      paymentStatus: booking.paymentStatus || "Pending",
      services: booking.services
        ? booking.services.map((s) => ({
            serviceName: s.serviceName || "",
            price: s.price || 0,
            duration: s.duration || "",
          }))
        : [],
    });
  };

  // ✅ Update simple fields in edit form
  const handleEditChange = (field, value) => {
    setEditingBooking((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ Update a service (name / price / duration)
  const handleServiceChange = (index, field, value) => {
    setEditingBooking((prev) => {
      const services = [...(prev.services || [])];
      const updatedService = { ...services[index] };

      if (field === "price") {
        updatedService.price = Number(value) || 0;
      } else if (field === "serviceName") {
        updatedService.serviceName = value;
      } else if (field === "duration") {
        updatedService.duration = value;
      }

      services[index] = updatedService;
      return { ...prev, services };
    });
  };

  // ✅ Add new empty service row manually
  const handleAddService = () => {
    setEditingBooking((prev) => ({
      ...prev,
      services: [
        ...(prev.services || []),
        {
          serviceName: "",
          price: 0,
          duration: "",
        },
      ],
    }));
  };

  // ✅ Add service from dropdown (master service list)
  const handleAddServiceFromDropdown = (serviceId) => {
    if (!serviceId || !editingBooking) return;

    const selected = allServices.find(
      (s) => (s._id ?? "").toString() === serviceId.toString()
    );
    if (!selected) return;

    setEditingBooking((prev) => {
      const currentServices = prev.services || [];

      // optional: avoid duplicates by serviceName
      const already = currentServices.some(
        (s) =>
          (s.serviceName || "").toLowerCase() ===
          (selected.serviceName || selected.service).toLowerCase()
      );
      if (already) return prev;

      const newService = {
        serviceName: selected.serviceName ?? selected.service ?? "",
        price: selected.price || 0,
        duration: selected.duration || "",
      };

      return {
        ...prev,
        services: [...currentServices, newService],
      };
    });
  };

  // ✅ Remove service row
  const handleRemoveService = (index) => {
    setEditingBooking((prev) => {
      const services = [...(prev.services || [])];
      services.splice(index, 1);
      return { ...prev, services };
    });
  };

  const handleEditCancel = () => {
    setEditingBooking(null);
  };

  // ✅ Save edited booking (including services)
  const handleEditSave = async () => {
    if (!editingBooking) return;

    try {
      const payload = {
        customerName: editingBooking.customerName,
        phone: editingBooking.phone,
        email: editingBooking.email || "",
        date: editingBooking.date,
        time: editingBooking.time,
        paymentStatus: editingBooking.paymentStatus || "Pending",
        services: (editingBooking.services || []).map((s) => ({
          serviceName: s.serviceName,
          price: Number(s.price) || 0,
          duration: s.duration || "",
        })),
      };

      console.log("👉 Save clicked, sending payload:", {
        id: editingBooking._id,
        payload,
      });

      const res = await axios.put(
        `http://localhost:5000/api/bookings/${editingBooking._id}`,
        payload
      );

      console.log("✅ Update response:", res.data);
      const updated = res.data.booking || res.data;

      setBookings((prev) =>
        prev.map((b) => (b._id === updated._id ? updated : b))
      );

      setEditingBooking(null);
    } catch (error) {
      console.error("❌ Error updating booking:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        alert(
          `Update failed: ${error.response.data?.message || "Check console"}`
        );
      } else {
        alert("Update failed: Network or server error");
      }
    }
  };

  // 💰 Total for currently editing booking
  const editingTotal =
    editingBooking?.services?.reduce(
      (sum, s) => sum + (Number(s.price) || 0),
      0
    ) || 0;

  return (
    <div className="min-h-screen w-full p-8 text-black pl-80 bg-gray-50">
      {/* Header */}
      <div className="text-3xl font-semibold mb-8">
        <h1>Dashboard</h1>
      </div>

      {/* ✅ Search Bar */}
      <div className="flex items-center bg-[#f0f0f0] px-4 py-3 w-full max-w-6xl border rounded-md mb-6">
        <FiSearch className="text-gray-500 text-xl" />
        <input
          type="text"
          placeholder="Search booking by customer name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none ml-3 w-full text-gray-700"
        />
      </div>

      {/* ✅ Controls */}
      <div className="flex gap-4 text-sm my-5 pl-233">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedBookings.length === 0}
        >
          🗑 Delete{" "}
          {selectedBookings.length > 0 && `(${selectedBookings.length})`}
        </button>

        <div className="relative ">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className=" flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50"
          >
            🔍 Sort {sortOrder === "asc" ? "(A-Z)" : "(Z-A)"}
          </button>
          {showSortOptions && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleSort("asc")}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sort A-Z (Ascending)
                </button>
                <button
                  onClick={() => handleSort("desc")}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sort Z-A (Descending)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-500 text-sm">Total Bookings</p>
          <h2 className="text-3xl font-bold mt-2">{totalBookings}</h2>
        </div>

        <div className="bg-[#d6b740] text-black rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-800 font-medium text-sm">Total Earnings</p>
          <h2 className="text-3xl font-bold mt-2">₹{totalEarnings}</h2>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-500 text-sm">Active Stylists</p>
          <h2 className="text-3xl font-bold mt-2">{totalStylists}</h2>
        </div>
      </div>

      {/* 🔧 Edit Box (Inline, includes services + dropdown) */}
      {editingBooking && (
        <div className="bg-white border rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Edit Booking – {editingBooking.customerName}
          </h2>

          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={editingBooking.customerName || ""}
                onChange={(e) =>
                  handleEditChange("customerName", e.target.value)
                }
                className="w-full border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-[#d6b740]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={editingBooking.phone || ""}
                onChange={(e) => handleEditChange("phone", e.target.value)}
                className="w-full border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-[#d6b740]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Date</label>
              <input
                type="text"
                value={editingBooking.date || ""}
                onChange={(e) => handleEditChange("date", e.target.value)}
                className="w-full border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-[#d6b740]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={editingBooking.time || ""}
                onChange={(e) => handleEditChange("time", e.target.value)}
                className="w-full border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-[#d6b740]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={editingBooking.paymentStatus || "Pending"}
                onChange={(e) =>
                  handleEditChange("paymentStatus", e.target.value)
                }
                className="w-full border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-[#d6b740]"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Services Editor – with dropdown */}
          <div className="space-y-4">
            {/* Service Dropdown */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Add Service
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  handleAddServiceFromDropdown(e.target.value);
                  e.target.value = "";
                }}
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#fdfaf6] text-sm"
              >
                <option value="" disabled>
                  Select Service
                </option>
                {allServices.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.serviceName ?? service.service}{" "}
                    {service.duration ? `(${service.duration})` : ""} - ₹
                    {service.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Add button (if needed) */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddService}
                className="text-xs px-3 py-1 rounded-md border border-[#d6b740] text-[#d6b740] hover:bg-yellow-50"
              >
                + Add Empty Service
              </button>
            </div>

            {/* Selected Services List (editable) */}
            {(!editingBooking.services ||
              editingBooking.services.length === 0) && (
              <p className="text-xs text-gray-500">
                No services selected. Choose from dropdown above or click
                &quot;Add Empty Service&quot;.
              </p>
            )}

            {editingBooking.services && editingBooking.services.length > 0 && (
              <div className="bg-[#fdfaf6] p-4 rounded-md border border-gray-200 space-y-2">
                {(editingBooking.services || []).map((service, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Service name"
                        value={service.serviceName || ""}
                        onChange={(e) =>
                          handleServiceChange(
                            idx,
                            "serviceName",
                            e.target.value
                          )
                        }
                        className="w-full border rounded-md p-2 text-xs outline-none focus:ring-1 focus:ring-[#d6b740]"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Duration"
                        value={service.duration || ""}
                        onChange={(e) =>
                          handleServiceChange(idx, "duration", e.target.value)
                        }
                        className="w-full border rounded-md p-2 text-xs outline-none focus:ring-1 focus:ring-[#d6b740]"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={service.price ?? 0}
                        onChange={(e) =>
                          handleServiceChange(idx, "price", e.target.value)
                        }
                        className="w-full border rounded-md p-2 text-xs outline-none focus:ring-1 focus:ring-[#d6b740]"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total inside edit box */}
                <div className="mt-3 pt-3 border-t flex justify-between items-center text-sm">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-semibold">₹{editingTotal}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={handleEditCancel}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              className="px-4 py-2 text-sm rounded-md bg-[#d6b740] text-black font-medium hover:bg-[#bca030]"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Table Section */}
      <div className="bg-white border rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <p className="p-4 text-gray-500 text-center">Loading data...</p>
        ) : bookings.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">No bookings found.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-6 font-medium text-gray-700">Select</th>
                <th className="py-3 px-6 font-medium text-gray-700">
                  Customer
                </th>
                <th className="py-3 px-6 font-medium text-gray-700">Phone</th>
                <th className="py-3 px-6 font-medium text-gray-700">
                  Date & Time
                </th>
                <th className="py-3 px-6 font-medium text-gray-700">Service</th>
                <th className="py-3 px-6 font-medium text-gray-700">Amount</th>
                <th className="py-3 px-6 font-medium text-gray-700 text-center">
                  Payment
                </th>
                <th className="py-3 px-6 font-medium text-gray-700 text-center">
                  Edit
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((b) => {
                const totalAmount = b.services?.reduce(
                  (sum, s) => sum + (s.price || 0),
                  0
                );
                const serviceNames = b.services
                  ?.map((s) => s.serviceName)
                  .join(", ");

                const paymentStatus = b.paymentStatus || "Pending";
                const isPaid = paymentStatus === "Paid";

                return (
                  <tr
                    key={b._id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(b._id)}
                        onChange={() => handleSelectBooking(b._id)}
                        className="w-4 h-4 accent-[#d6b740] cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6">{b.customerName}</td>
                    <td className="py-4 px-6">{b.phone}</td>
                    <td className="py-4 px-6">
                      {b.time}, {b.date}
                    </td>
                    <td className="py-4 px-6">{serviceNames}</td>
                    <td className="py-4 px-6">₹{totalAmount}</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-semibold ${
                          isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-blue-600 font-medium cursor-pointer hover:underline">
                      <button onClick={() => handleEditClick(b)}>Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
