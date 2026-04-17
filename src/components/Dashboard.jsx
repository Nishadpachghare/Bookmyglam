import React, {
  startTransition,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { ExportContext } from "../layout/ExportContext";
import { filterByDate, getAvailableYears } from "../layout/dateFilterUtils";
import { FiSearch, FiEdit3 } from "react-icons/fi";
import {
  deleteBookings,
  getActiveStylists,
  getBookingAmount,
  getBookings,
  getManageServices,
  getServiceTotal,
  updateBooking,
} from "../services";

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [editingBooking, setEditingBooking] = useState(null);
  const [, setIsSaving] = useState(false);
  const [, setIsClosing] = useState(false);
  const editFormRef = useRef(null);
  const {
    filterType,
    filterValue,
    setAvailableYears,
    setBookings: setGlobalBookings,
    setExportData,
  } = useContext(ExportContext);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

  // ✅ Helper to handle different backend response structures safely
  // 1. Fetch Bookings
  const fetchBookings = useCallback(async ({ force = false } = {}) => {
    try {
      const nextBookings = await getBookings({ force });
      setBookings(nextBookings);
      if (typeof setGlobalBookings === "function") {
        setGlobalBookings(nextBookings);
      }
      return nextBookings;
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
      if (typeof setGlobalBookings === "function") {
        setGlobalBookings([]);
      }
      return [];
    }
  }, [setGlobalBookings]);

  // 2. Fetch Stylists
  const fetchStylists = useCallback(async ({ force = false } = {}) => {
    try {
      const nextStylists = await getActiveStylists({ force });
      setStylists(nextStylists);
      return nextStylists;
    } catch (error) {
      console.error("Error fetching stylists:", error);
      setStylists([]);
      return [];
    }
  }, []);

  // 3. Fetch Services
  const fetchAllServices = useCallback(async ({ force = false } = {}) => {
    try {
      const nextServices = await getManageServices({ force });
      setAllServices(nextServices);
      return nextServices;
    } catch (error) {
      console.error("Error fetching services:", error);
      setAllServices([]);
      return [];
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchStylists(), fetchAllServices()]);
      if (active) setLoading(false);
    };
    fetchData();

    // Check if returning from payment success - refetch after a short delay
    const params = new URLSearchParams(window.location.search);
    const fromPayment = params.get("from_payment");
    if (fromPayment === "true") {
      console.log("🔄 Detected return from payment - refetching bookings...");
      const refetchTimeout = setTimeout(() => {
        if (active) {
          fetchBookings({ force: true });
        }
      }, 1000);
      return () => {
        active = false;
        clearTimeout(refetchTimeout);
      };
    }

    return () => {
      active = false;
    };
  }, [fetchAllServices, fetchBookings, fetchStylists]);

  const safeBookings = useMemo(
    () => (Array.isArray(bookings) ? bookings : []),
    [bookings],
  );
  const totalStylists = Array.isArray(stylists) ? stylists.length : 0;

  const filteredBookingsByGlobal = useMemo(
    () => filterByDate(safeBookings, "date", filterType, filterValue),
    [safeBookings, filterType, filterValue],
  );

  // keep stats in sync with the currently visible set of bookings
  const totalBookings = filteredBookingsByGlobal.length;

  useEffect(() => {
    setAvailableYears(getAvailableYears(safeBookings, "date"));
  }, [safeBookings, setAvailableYears]);

  // Scroll to edit form when a booking is selected for editing (and focus)
  useEffect(() => {
    if (editingBooking && editFormRef.current) {
      setTimeout(() => {
        const el = editFormRef.current;
        if (el && el.scrollIntoView)
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        const first = el.querySelector("input, select, textarea");
        if (first) first.focus();
      }, 80);
    }
  }, [editingBooking]);

  // Prevent body scroll while modal open and add ESC key handler
  useEffect(() => {
    if (editingBooking) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    const onKey = (e) => {
      if (e.key === "Escape" && editingBooking) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [editingBooking]);

  // ✅ REAL-LIFE LOGIC: Only calculate Earnings if status is "Paid"
  const totalEarnings = useMemo(
    () =>
      filteredBookingsByGlobal.reduce((sum, booking) => {
        const status = (booking.paymentStatus || "Pending")
          .toString()
          .toLowerCase();

        if (status !== "paid") {
          return sum;
        }

        return sum + getBookingAmount(booking);
      }, 0),
    [filteredBookingsByGlobal],
  );

  const exportRows = useMemo(
    () =>
      filteredBookingsByGlobal.map((booking) => ({
        "Customer Name": booking.customerName || "",
        Phone: booking.phone || "",
        Email: booking.email || "",
        Date: booking.date || "",
        Time: booking.time || "",
        "Payment Status": booking.paymentStatus || "",
        "Total Amount": getBookingAmount(booking),
        "Coupon Code": booking.couponCode || "-",
        "Discount Amount": booking.discountAmount || 0,
      })),
    [filteredBookingsByGlobal],
  );

  useEffect(() => {
    setExportData(exportRows);
  }, [exportRows, setExportData]);

  const filteredBookings = useMemo(() => {
    if (!normalizedSearchTerm) {
      return filteredBookingsByGlobal;
    }

    return filteredBookingsByGlobal.filter((booking) => {
      const name = (booking.customerName || "").toString().toLowerCase();
      const phone = (booking.phone || "").toString().toLowerCase();
      return (
        name.includes(normalizedSearchTerm) ||
        phone.includes(normalizedSearchTerm)
      );
    });
  }, [filteredBookingsByGlobal, normalizedSearchTerm]);

  const selectedBookingSet = useMemo(
    () => new Set(selectedBookings),
    [selectedBookings],
  );

  const stylistNamesById = useMemo(
    () =>
      new Map(
        (stylists || []).map((stylist) => [
          (stylist._id ?? "").toString(),
          stylist.name || "-",
        ]),
      ),
    [stylists],
  );

  // Sort Logic
  const handleSort = (order) => {
    setSortOrder(order);
    setShowSortOptions(false);
    startTransition(() => {
      const sorted = [...safeBookings].sort((a, b) => {
        const nameA = (a.customerName || "").toLowerCase();
        const nameB = (b.customerName || "").toLowerCase();
        if (order === "asc") return nameA.localeCompare(nameB);
        return nameB.localeCompare(nameA);
      });

      setBookings(sorted);
      if (typeof setGlobalBookings === "function") {
        setGlobalBookings(sorted);
      }
    });
  };

  // Selection Logic
  const handleSelectBooking = (id) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id],
    );
  };

  // Delete Logic
  const handleDelete = async () => {
    if (selectedBookings.length === 0) return;
    try {
      await deleteBookings(selectedBookings);
      setBookings((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (booking) => !selectedBookings.includes(booking?._id),
        ),
      );
      if (typeof setGlobalBookings === "function") {
        setGlobalBookings((prev) =>
          (Array.isArray(prev) ? prev : []).filter(
            (booking) => !selectedBookings.includes(booking?._id),
          ),
        );
      }
      setSelectedBookings([]);
      toast.success("Selected bookings deleted");
    } catch (error) {
      console.error("Error deleting bookings:", error);
      toast.error("Failed to delete bookings");
    }
  };

  // --- EDIT HANDLERS ---
  const handleEditClick = (booking) => {
    setEditingBooking({
      ...booking,
      paymentStatus: booking.paymentStatus || "Pending",
      services: Array.isArray(booking.services)
        ? booking.services.map((s) => ({
            serviceName: s.serviceName || s.service || "",
            price: s.price || 0,
            duration: s.duration || "",
          }))
        : [],
    });
  };

  const handleEditChange = (field, value) => {
    setEditingBooking((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    setEditingBooking((prev) => {
      const services = [...(prev?.services || [])];
      const updatedService = { ...services[index] };
      if (field === "price") updatedService.price = Number(value) || 0;
      else if (field === "serviceName") updatedService.serviceName = value;
      else if (field === "duration") updatedService.duration = value;
      services[index] = updatedService;
      return { ...prev, services };
    });
  };

  const handleAddService = () => {
    setEditingBooking((prev) => ({
      ...prev,
      services: [
        ...(prev?.services || []),
        { serviceName: "", price: 0, duration: "" },
      ],
    }));
  };

  const handleAddServiceFromDropdown = (serviceId) => {
    if (!serviceId || !editingBooking) return;
    const selected = (allServices || []).find(
      (s) => (s._id ?? "").toString() === serviceId.toString(),
    );
    if (!selected) return;

    setEditingBooking((prev) => {
      const currentServices = prev.services || [];
      const already = currentServices.some(
        (s) =>
          (s.serviceName || "").toLowerCase() ===
          (selected.serviceName || selected.service || "").toLowerCase(),
      );
      if (already) return prev;

      const newService = {
        serviceName: selected.serviceName ?? selected.service ?? "",
        price: selected.price || 0,
        duration: selected.duration || "",
      };
      return { ...prev, services: [...currentServices, newService] };
    });
  };

  const handleRemoveService = (index) => {
    setEditingBooking((prev) => {
      const services = [...(prev.services || [])];
      services.splice(index, 1);
      return { ...prev, services };
    });
  };

  // Close modal with animation
  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setEditingBooking(null);
    }, 220);
  };

  // ✅ REAL-LIFE LOGIC: Update Local State Immediately on Save (with toast & animated close)
  const handleEditSave = async () => {
    if (!editingBooking) return;
    setIsSaving(true);
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

      const updated = await updateBooking(editingBooking._id, payload);

      // Update the local bookings array immediately
      setBookings((prev) =>
        (Array.isArray(prev) ? prev : []).map((b) =>
          b._id === updated._id ? updated : b,
        ),
      );

      // Also sync with global bookings for other pages
      if (typeof setGlobalBookings === "function") {
        setGlobalBookings((prev) =>
          (Array.isArray(prev) ? prev : []).map((b) =>
            b._id === updated._id ? updated : b,
          ),
        );
      }

      toast.success("Changes saved successfully");
      // animate close
      closeModal();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Update failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const editingTotal = editingBooking?.finalAmount
    ? Number(editingBooking.finalAmount)
    : getServiceTotal(editingBooking?.services);

  return (
    <div className="min-h-screen w-full p-8 text-white  bg-black pl-80 ">
      <div className="text-3xl font-semibold mb-8">
        <h1>Dashboard</h1>
      </div>

      {/* Search Bar (consistent dark style) */}
      <div className="flex items-center bg-zinc-900 px-4 py-3 w-full max-w-6xl border border-zinc-700 rounded-md mb-6">
        <FiSearch className="text-gray-300 text-xl" />
        <input
          type="text"
          placeholder="Search booking by customer name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none ml-3 w-full text-white placeholder-gray-400"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-4 text-sm my-5 pl-233">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 text-purple-600 border border-purple-600 px-3 py-1 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedBookings.length === 0}
        >
          🗑 Delete{" "}
          {selectedBookings.length > 0 && `(${selectedBookings.length})`}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center gap-1 text-purple-700 border px-3 py-1 rounded-md hover:bg-gray-50"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white text-black rounded-xl shadow-md p-6 text-center">
          <p className="text-black text-sm">Total Bookings</p>
          <h2 className="text-3xl font-bold mt-2">{totalBookings}</h2>
        </div>

        {/* ✅ Total Earnings Card: Shows ONLY Paid Amounts */}
        <div className="bg-[#4c0080] text-black rounded-xl shadow-md p-6 text-center">
          <p className="text-black-800 font-medium text-sm">Total Earnings</p>
          <h2 className="text-3xl font-bold mt-2">
            ₹{totalEarnings.toLocaleString()}
          </h2>
          <p className="text-xs mt-1 opacity-80">(Verified Paid Only)</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-black text-sm">Active Stylists</p>
          <h2 className="text-3xl font-bold mt-2 text-black">
            {totalStylists}
          </h2>
        </div>
      </div>

      {/* Edit Form */}
      {editingBooking && (
        <div
          ref={editFormRef}
          className="bg-zinc-900 text-white border border-zinc-800 rounded-xl shadow-md p-6 mb-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-white">
            Edit Booking
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={editingBooking.customerName || ""}
                onChange={(e) =>
                  handleEditChange("customerName", e.target.value)
                }
                className="w-full border rounded-md p-2 text-sm bg-zinc-800 text-white border-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Phone</label>
              <input
                type="text"
                value={editingBooking.phone || ""}
                onChange={(e) => handleEditChange("phone", e.target.value)}
                className="w-full border rounded-md p-2 text-sm bg-zinc-800 text-white border-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Date</label>
              <input
                type="text"
                value={editingBooking.date || ""}
                onChange={(e) => handleEditChange("date", e.target.value)}
                className="w-full border rounded-md p-2 text-sm bg-zinc-800 text-white border-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Time</label>
              <input
                type="text"
                value={editingBooking.time || ""}
                onChange={(e) => handleEditChange("time", e.target.value)}
                className="w-full border rounded-md p-2 text-sm bg-zinc-800 text-white border-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">
                Payment Status
              </label>
              <select
                value={editingBooking.paymentStatus || "Pending"}
                onChange={(e) =>
                  handleEditChange("paymentStatus", e.target.value)
                }
                className="w-full border rounded-md p-2 text-sm bg-zinc-800 text-white border-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">
                Add Service
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  handleAddServiceFromDropdown(e.target.value);
                  e.target.value = "";
                }}
                className="w-full border border-zinc-700 rounded-md px-4 py-2 bg-zinc-800 text-sm text-white"
              >
                <option value="" disabled>
                  Select Service
                </option>
                {(allServices || []).map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.serviceName ?? service.service} - ₹{service.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddService}
                className="text-xs px-3 py-1 rounded-md border border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                + Add Empty Service
              </button>
            </div>

            {editingBooking.services && editingBooking.services.length > 0 && (
              <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700 space-y-2">
                {editingBooking.services.map((service, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={service.serviceName || ""}
                        onChange={(e) =>
                          handleServiceChange(
                            idx,
                            "serviceName",
                            e.target.value,
                          )
                        }
                        className="w-full border rounded-md p-2 text-xs bg-zinc-900 text-white border-zinc-700"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={service.duration || ""}
                        onChange={(e) =>
                          handleServiceChange(idx, "duration", e.target.value)
                        }
                        className="w-full border rounded-md p-2 text-xs bg-zinc-900 text-white border-zinc-700"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={service.price ?? 0}
                        onChange={(e) =>
                          handleServiceChange(idx, "price", e.target.value)
                        }
                        className="w-full border rounded-md p-2 text-xs bg-zinc-900 text-white border-zinc-700"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-xs text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between font-semibold text-sm text-white">
                  <span>Total Amount:</span>
                  <span>₹{editingTotal}</span>
                </div>

                {editingBooking?.couponCode && (
                  <div className="mt-3 p-3 bg-green-900/20 border border-green-700/50 rounded text-sm space-y-1">
                    <div className="flex justify-between text-green-400">
                      <span>Coupon Code:</span>
                      <span className="font-bold">
                        {editingBooking.couponCode}
                      </span>
                    </div>
                    {editingBooking?.discountAmount > 0 && (
                      <div className="flex justify-between text-green-300">
                        <span>Discount:</span>
                        <span>-₹{editingBooking.discountAmount}</span>
                      </div>
                    )}
                    {editingBooking?.discountPercentage > 0 && (
                      <div className="flex justify-between text-green-300">
                        <span>Discount %:</span>
                        <span>{editingBooking.discountPercentage}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={() => setEditingBooking(null)}
              className="px-4 py-2 text-sm rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-black border border-zinc-800 rounded-xl shadow-md overflow-hidden text-white">
        {loading ? (
          <p className="p-6 text-center text-gray-400">Loading data...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="p-6 text-center text-gray-400">
            {normalizedSearchTerm
              ? "No matching bookings found."
              : "No bookings found."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-purple-700 text-white">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-medium">
                    Select
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium">
                    Customer
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium">
                    Phone
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium">
                    Stylist
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium">
                    Date & Time
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium">
                    Service
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium">
                    Amount
                  </th>
                  <th className="py-3 px-6 text-center text-sm font-medium">
                    Payment
                  </th>
                  <th className="py-3 px-6 text-center text-sm font-medium">
                    Mode
                  </th>
                  <th className="py-3 px-6 text-center text-sm font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-black divide-y divide-zinc-800 text-white">
                {filteredBookings.map((b) => {
                  const displayAmount = getBookingAmount(b);

                  const serviceNames = Array.isArray(b.services)
                    ? b.services.map((s) => s.serviceName).join(", ")
                    : "";

                  const isPaid =
                    (b.paymentStatus || "").toString().toLowerCase() === "paid";

                  const stylistName =
                    stylistNamesById.get((b.stylistId ?? "").toString()) ||
                    b.stylist?.name ||
                    "-";

                  return (
                    <tr
                      key={b._id}
                      className="even:bg-zinc-900 hover:bg-zinc-800 transition-colors"
                    >
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={selectedBookingSet.has(b._id)}
                          onChange={() => handleSelectBooking(b._id)}
                          className="w-4 h-4 accent-purple-600"
                        />
                      </td>

                      <td className="py-4 px-6 text-sm font-medium text-white">
                        {b.customerName}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-300">
                        {b.phone}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-300">
                        {stylistName}
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-300">
                        {b.time}, {b.date}
                      </td>

                      <td
                        className="py-4 px-6 text-sm text-gray-300 max-w-xs truncate"
                        title={serviceNames}
                      >
                        {serviceNames || "-"}
                      </td>

                      <td className="py-4 px-6 text-sm text-white">
                        ₹{displayAmount}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isPaid ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        {(b.mode || "").toString().toLowerCase() ===
                        "online" ? (
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-green-900 text-green-300 text-xs font-medium">
                            <span className="h-2 w-2 bg-green-500 rounded-full" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium">
                            Offline
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleEditClick(b)}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
                          aria-label={`Edit booking ${b.customerName || ""}`}
                        >
                          <FiEdit3 /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
