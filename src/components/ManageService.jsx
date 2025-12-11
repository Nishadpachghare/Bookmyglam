import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ManageService = () => {
  const [formData, setFormData] = useState({
    service: "",
    description: "",
    duration: "",
    price: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEdit = (id) => {
    const serviceToEdit = services.find((s) => s._id === id);
    if (serviceToEdit) {
      setEditingId(id);
      setFormData({
        service: serviceToEdit.service,
        description: serviceToEdit.description,
        duration: serviceToEdit.duration,
        price: serviceToEdit.price.toString(),
      });
      // Scroll to form
      document.querySelector(".manage-service-form").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleCheckbox = (id) => {
    setSelectedServices((prev) => {
      if (prev.includes(id)) {
        return prev.filter((serviceId) => serviceId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleDelete = async () => {
    if (selectedServices.length === 0) return;

    try {
      for (const id of selectedServices) {
        await axios.delete(`http://localhost:5000/api/Manageservices/${id}`);
      }
      // Refresh services list after deletion
      fetchServices();
      // Clear selection
      setSelectedServices([]);
    } catch (error) {
      console.error("Error deleting services:", error);
    }
  };

  const handleSort = (order) => {
    setSortOrder(order);
    const sortedServices = [...services].sort((a, b) => {
      if (order === "asc") {
        return a.service.localeCompare(b.service);
      } else {
        return b.service.localeCompare(a.service);
      }
    });
    setServices(sortedServices);
    setShowSortOptions(false);
  };
  const [services, setServices] = useState([]);
  // Track which descriptions are expanded (by service id)
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const toggleExpand = (id) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/Manageservices"
      );
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleSubmit = async () => {
    const { service, description, duration, price } = formData;
    if (!service || !description || !duration || !price) {
      alert("Please fill in all fields");
      return;
    }

    try {
      if (editingId) {
        // Update existing service
        const response = await axios.put(
          `http://localhost:5000/api/Manageservices/${editingId}`,
          {
            service,
            description,
            duration,
            price: Number(price),
          }
        );

        if (response.data.message) {
          toast.success("✅ Service updated successfully!");
        }
      } else {
        // Add new service
        const response = await axios.post(
          "http://localhost:5000/api/Manageservices",
          {
            service,
            description,
            duration,
            price: Number(price),
          }
        );

        if (response.data.message) {
          toast.success(" ✅ Service added successfully!");
        }
      }

      // Refresh services list
      await fetchServices();

      // Reset form and editing state
      setFormData({
        service: "",
        description: "",
        duration: "",
        price: "",
      });
      setEditingId(null);

      // Scroll to the services list
      document.querySelector(".services-list").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(
        error.response?.data?.message ||
          "Error saving service. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen w-full  flex flex-col items-center pl-55 py-10 px-4 shadow-xl">
      {/* Manage Service */}
      <div className="bg-white p-6 shadow-xl rounded-lg border h-130 w-100 manage-service-form">
        <h2 className="text-center text-3xl font-semibold mb-4">
          {editingId ? "Edit Service" : "Add New Service"}
        </h2>
        <input
          type="text"
          name="service"
          placeholder="Select Service"
          value={formData.service}
          onChange={handleChange}
          className="w-full border p-5 mb-3 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-5 mb-3 rounded h-20"
        />
        <select
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="w-full border p-5 mb-2 rounded h-20"
        >
          <option value="">Select Duration</option>
          <option value="10 Minutes">10 Minutes</option>
          <option value="30 Minuts">30 Minutes</option>
          <option value="1 hour ">1 Hour</option>
          <option value="1 Hour 30 Minutes">1 Hour 30 Minutes</option>
          <option value="2 Hours">2 Hours</option>
          <option value="2 Hours 30 Minute">2 Hours 30 Minutes</option>
          <option value="3 Hours">3 Hours</option>
        </select>
        <input
          type="number"
          name="price"
          placeholder="Price (₹)"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-5 mb-4 rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#D3AF37] py-3 rounded text-black font-medium hover:bg-[#D3AF37]"
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
              className="w-1/4 bg-gray-200 py-3 rounded text-black font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* All Services */}

      <div className="bg-white w-260 mt-10 p-6 rounded-lg shadow-xl border ">
        <h2 className="text-center text-3xl font-semibold mb-4">All Service</h2>
        {/* Action Buttons */}
        <div className="flex gap-4 w-280 text-sm my-5 pl-190 m-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50"
            disabled={selectedServices.length === 0}
          >
            🗑 Delete{" "}
            {selectedServices.length > 0 && `(${selectedServices.length})`}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50"
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
        <table className="w-full border text-sm ">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left w-1/5">Service</th>
              <th className="border p-2 text-left w-2/5">Description</th>
              <th className="border p-2 text-left w-1/6">Duration</th>
              <th className="border p-2 text-left w-1/6">Amount</th>
              <th className="border p-2 w-16">Edit</th>
              <th className="border p-2 w-16">checkbox</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s._id}>
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
                        className="text-blue-600 mt-2 self-end text-sm"
                      >
                        {expandedDescriptions[s._id]
                          ? "Read less"
                          : "Read more"}
                      </button>
                    )}
                  </div>
                </td>
                <td className="border py-5 p-2">{s.duration}</td>
                <td className="border py-5 p-2">₹{s.price}</td>
                <td className="border py-5 p-2 text-center">
                  <button
                    onClick={() => handleEdit(s._id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </td>
                <td className="border py-5 p-2 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
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
