// src/pages/ManageService.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { ExportContext } from "../layout/ExportContext";
import { filterByDate, getAvailableYears } from "../layout/dateFilterUtils";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

const ManageService = () => {
  const [formData, setFormData] = useState({
    service: "",
    description: "",
    duration: "",
    customDuration: "",
    price: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [services, setServices] = useState([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  useEffect(() => {
    fetchServices();
  }, []);

  // Export & filtering: services list
  const { setExportData, filterType, filterValue, setAvailableYears } =
    useContext(ExportContext);

  const displayedServices = filterByDate(
    services || [],
    "createdAt",
    filterType,
    filterValue,
  );

  useEffect(() => {
    const years = getAvailableYears(services || [], "createdAt");
    setAvailableYears(years);
  }, [services, setAvailableYears]);

  const exportRowsServices = useMemo(() => {
    return (displayedServices || []).map((s) => ({
      Service: s.service || "",
      Description: s.description || "",
      Duration: s.duration || "",
      Price: s.price ?? "",
    }));
  }, [displayedServices]);

  useEffect(() => {
    setExportData(exportRowsServices);
  }, [exportRowsServices, setExportData]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/Manageservices",
      );
      // server might return array directly or an object — handle both
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.services || response.data;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleEdit = (id) => {
    const serviceToEdit = services.find((s) => s._id === id);
    if (serviceToEdit) {
      setEditingId(id);
      const standardDurations = [
        "10 Minutes",
        "30 Minutes",
        "1 Hour",
        "1 Hour 30 Minutes",
        "2 Hours",
        "2 Hours 30 Minutes",
        "3 Hours",
      ];
      const isStandard = standardDurations.includes(serviceToEdit.duration);
      setFormData({
        service: serviceToEdit.service || "",
        description: serviceToEdit.description || "",
        duration: isStandard ? serviceToEdit.duration || "" : "manual",
        customDuration: isStandard ? "" : serviceToEdit.duration || "",
        price: serviceToEdit.price?.toString() || "",
      });
      // Scroll to form (guarded)
      document.querySelector(".manage-service-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleCheckbox = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const handleDelete = async () => {
    if (selectedServices.length === 0) return;
    if (
      !window.confirm(`Delete ${selectedServices.length} selected service(s)?`)
    )
      return;

    const toastId = toast.loading("Deleting services...");
    try {
      // parallel deletes for speed
      await Promise.all(
        selectedServices.map((id) =>
          axios.delete(`http://localhost:5000/api/Manageservices/${id}`),
        ),
      );
      toast.success("Deleted selected services", { id: toastId });
      setSelectedServices([]);
      await fetchServices();
    } catch (error) {
      console.error("Error deleting services:", error);
      toast.error("Failed to delete some services", { id: toastId });
    }
  };

  const handleSort = (order) => {
    setSortOrder(order);
    const sortedServices = [...services].sort((a, b) =>
      order === "asc"
        ? a.service.localeCompare(b.service)
        : b.service.localeCompare(a.service),
    );
    setServices(sortedServices);
    setShowSortOptions(false);
  };

  const toggleExpand = (id) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    const { service, description, duration, customDuration, price } = formData;
    if (!service || !description || !price) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!duration) {
      toast.error("Please select a duration");
      return;
    }
    if (duration === "manual" && !customDuration?.trim()) {
      toast.error("Please enter custom duration");
      return;
    }

    const durationToSave =
      duration === "manual" ? customDuration.trim() : duration;

    try {
      if (editingId) {
        const response = await axios.put(
          `http://localhost:5000/api/Manageservices/${editingId}`,
          {
            service,
            description,
            duration: durationToSave,
            price: Number(price),
          },
        );
        toast.success(
          response.data?.message || "✅ Service updated successfully!",
        );
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/Manageservices",
          {
            service,
            description,
            duration: durationToSave,
            price: Number(price),
          },
        );
        toast.success(
          response.data?.message || "✅ Service added successfully!",
        );
      }

      await fetchServices();

      setFormData({
        service: "",
        description: "",
        duration: "",
        customDuration: "",
        price: "",
      });
      setEditingId(null);
      document
        .querySelector(".services-list")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(
        error.response?.data?.message ||
          "Error saving service. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center pl-55 py-10 px-4 bg-black shadow-xl">
      {/* Toaster: mount once (can move to App.jsx for global usage) */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* Manage Service Form */}
      <div className="bg-zinc-900 p-6 shadow-xl rounded-lg border border-zinc-700 w-125 manage-service-form">
        <h2 className="text-center text-3xl font-semibold text-white mb-4 pt-2">
          {editingId ? "Edit Service" : "Add New Service"}
        </h2>

        <input
          type="text"
          name="service"
          placeholder="Service name"
          value={formData.service}
          onChange={handleChange}
          className="w-full border border-zinc-700 bg-zinc-800 text-white p-3 mb-3 rounded placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border border-zinc-700 bg-zinc-800 text-white p-3 mb-3 rounded h-24 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
        />

        <select
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="w-full border border-zinc-700 bg-zinc-800 text-white p-3 mb-3 rounded focus:outline-none focus:ring-1 focus:ring-purple-600"
        >
          <option value="" className="text-zinc-400 bg-zinc-800">
            Select Duration
          </option>
          <option value="10 Minutes" className="bg-zinc-800 text-white">
            10 Minutes
          </option>
          <option value="30 Minutes" className="bg-zinc-800 text-white">
            30 Minutes
          </option>
          <option value="1 Hour" className="bg-zinc-800 text-white">
            1 Hour
          </option>
          <option value="1 Hour 30 Minutes" className="bg-zinc-800 text-white">
            1 Hour 30 Minutes
          </option>
          <option value="2 Hours" className="bg-zinc-800 text-white">
            2 Hours
          </option>
          <option value="2 Hours 30 Minutes" className="bg-zinc-800 text-white">
            2 Hours 30 Minutes
          </option>
          <option value="3 Hours" className="bg-zinc-800 text-white">
            3 Hours
          </option>
          <option value="manual" className="bg-zinc-800 text-white">
            Manual (enter custom)
          </option>
        </select>

        {formData.duration === "manual" && (
          <input
            type="text"
            name="customDuration"
            placeholder="e.g. 45 Minutes or 1 Hour 15 Minutes"
            value={formData.customDuration}
            onChange={handleChange}
            className="w-full border border-zinc-700 bg-zinc-800 text-white p-3 mb-3 rounded placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
        )}

        <input
          type="number"
          name="price"
          placeholder="Price (₹)"
          value={formData.price}
          onChange={handleChange}
          className="w-full border border-zinc-700 bg-zinc-800 text-white p-3 mb-4 rounded placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
        />

        <div className="flex gap-2 pt-15">
          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 py-3 rounded text-white font-medium hover:bg-purple-700"
          >
            {editingId ? "Update Service" : "Add Service"}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  service: "",
                  description: "",
                  duration: "",
                  price: "",
                });
              }}
              className="w-1/4 bg-zinc-800 border border-zinc-700 py-3 rounded text-zinc-300 font-medium hover:bg-zinc-800/90"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* All Services */}
      <div className="bg-zinc-900 w-260 mt-10 p-6 rounded-lg shadow-xl border border-zinc-700 services-list text-white">
        <h2 className="text-center text-3xl text-white font-semibold mb-4">
          All Service
        </h2>

        <div className="flex gap-4 w-280 text-sm my-5 pl-190 m-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-purple-600 border border-purple-600 px-3 py-1 rounded-md hover:bg-purple-700/10 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedServices.length === 0}
          >
            🗑 Delete{" "}
            {selectedServices.length > 0 && `(${selectedServices.length})`}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center gap-1 text-purple-600 border border-zinc-700 px-3 py-1 rounded-md hover:bg-zinc-800/30"
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

        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-800 text-zinc-200 border-b border-zinc-700">
            <tr>
              <th className="border p-2 text-left w-1/5">Service</th>
              <th className="border p-2 text-left w-2/5">Description</th>
              <th className="border p-2 text-left w-1/6">Duration</th>
              <th className="border p-2 text-left w-1/6">Amount</th>
              <th className="border p-2 w-16">Edit</th>
              <th className="border p-2 w-16">Select</th>
            </tr>
          </thead>
          <tbody>
            {displayedServices.map((s) => (
              <tr
                key={s._id}
                className="border-b hover:bg-zinc-800 transition-colors"
              >
                <td className="border py-5 p-2">{s.service}</td>
                <td className="border py-5 p-2 align-top">
                  <div className="flex flex-col h-full">
                    <div
                      className={`${
                        expandedDescriptions[s._id]
                          ? ""
                          : "max-h-20 overflow-hidden"
                      } whitespace-pre-wrap text-left`}
                    >
                      {s.description}
                    </div>
                    {s.description && s.description.length > 120 && (
                      <button
                        onClick={() => toggleExpand(s._id)}
                        className="text-purple-400 mt-2 self-end text-sm"
                      >
                        {expandedDescriptions[s._id]
                          ? "Read less"
                          : "Read more"}
                      </button>
                    )}
                  </div>
                </td>
                <td className="border py-5 p-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm">
                    {s.duration}
                  </span>
                </td>
                <td className="border py-5 p-2 text-right font-semibold text-white">
                  ₹{s.price}
                </td>
                <td className="border py-5 p-2 text-center">
                  <button
                    onClick={() => handleEdit(s._id)}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Edit
                  </button>
                </td>
                <td className="border py-5 p-2 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-purple-600"
                    checked={selectedServices.includes(s._id)}
                    onChange={() => handleCheckbox(s._id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageService;
