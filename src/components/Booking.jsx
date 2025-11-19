import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

function Booking() {
  // State for form validation
  const [formErrors, setFormErrors] = useState({});
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({
    service: [],
    customerName: "",
    phone: "",
    email: "",
    date: "",
    time: "",
  });

  // Add error state for more detailed error messages
  const [error, setError] = useState("");

  // Calculate total price of selected services
  const totalPrice = selectedServices.reduce((total, service) => {
    return total + service.price;
  }, 0);

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/Manageservices"
      );
      const raw = response?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.services)
        ? raw.services
        : [];

      const normalized = list.map((s) => ({
        _id:
          s._id?.toString?.() ??
          s.id?.toString?.() ??
          String(s._id ?? s.id ?? ""),
        serviceName: s.serviceName ?? s.service ?? "",
        duration: s.duration ?? s.time ?? "",
        price: Number(s.price ?? 0),
        // keep original for any other fields
        ...s,
      }));

      setServices(normalized);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "service") {
      const selectedService = services.find(
        (s) => (s._id ?? "").toString() === value.toString()
      );
      if (
        selectedService &&
        !selectedServices.some((s) => s._id === selectedService._id)
      ) {
        const updatedSelectedServices = [...selectedServices, selectedService];
        setSelectedServices(updatedSelectedServices);
        setFormData({
          ...formData,
          service: updatedSelectedServices.map(
            (s) => s.serviceName ?? s.service
          ),
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const removeService = (serviceId) => {
    const updatedServices = selectedServices.filter((s) => s._id !== serviceId);
    setSelectedServices(updatedServices);
    setFormData({
      ...formData,
      service: updatedServices.map((s) => s.serviceName),
    });
  };
  const validateForm = () => {
    const errors = {};

    if (selectedServices.length === 0) {
      errors.services = "Please select at least one service";
    }
    if (!formData.customerName.trim()) {
      errors.customerName = "Customer name is required";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!formData.date) {
      errors.date = "Date is required";
    }
    if (!formData.time) {
      errors.time = "Time is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    try {
      const bookingData = {
        selectedServices,
        ...formData,
      };

      console.log("Sending booking data:", bookingData);

      const res = await axios.post(
        "http://localhost:5000/api/bookings",
        bookingData
      );
      if (res.status === 201) {
        setMessage("✅ Booking added successfully!");
        setFormData({
          service: [],
          customerName: "",
          phone: "",
          email: "",
          date: "",
          time: "",
        });
        setSelectedServices([]);
        setError(""); // Clear any previous errors
      }
    } catch (err) {
      console.error("Error:", err);
      console.error("Error response:", err.response?.data);

      // Get detailed error message
      const errorMessage =
        err.response?.data?.message || "Failed to add booking";
      const errorDetails = err.response?.data?.details
        ? Array.isArray(err.response.data.details)
          ? err.response.data.details.join(", ")
          : err.response.data.details
        : "Please try again";

      setError(`${errorMessage}: ${errorDetails}`);
      setMessage(`❌ ${errorMessage}: ${errorDetails}`);
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#fffdfa] pl-55 pt-15">
      <div className="bg-white border rounded-xl shadow-xl p-6 w-full max-w-md ">
        <h2 className="text-3xl font-semibold text-center mb-6 text-black">
          New Booking
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Service Selection */}
            <div>
              <select
                name="service"
                value=""
                onChange={handleChange}
                className={`w-full border ${
                  formErrors.services ? "border-red-500" : "border-gray-300"
                } rounded-md px-4 py-3 bg-[#fdfaf6]`}
              >
                <option value="">Select Service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.serviceName} ({service.duration}) - ₹
                    {service.price}
                  </option>
                ))}
              </select>
              {formErrors.services && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.services}
                </p>
              )}
            </div>

            {/* Selected Services List */}
            {selectedServices.length > 0 && (
              <div className="bg-[#fdfaf6] p-4 rounded-md border border-gray-300">
                <h3 className="font-medium mb-2">Selected Services:</h3>
                {selectedServices.map((service) => (
                  <div
                    key={service._id}
                    className="flex justify-between items-center py-2 "
                  >
                    <div>
                      <span className="font-medium">{service.serviceName}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({service.duration})
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        ₹{service.price}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(service._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-semibold">₹{totalPrice}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <input
              type="text"
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.customerName ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#fdfaf6]`}
            />
            {formErrors.customerName && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.customerName}
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.phone ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#fdfaf6]`}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
            )}
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.email ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#fdfaf6]`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.date ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#fdfaf6]`}
            />
            {formErrors.date && (
              <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
            )}
          </div>

          <div>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.time ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#fdfaf6]`}
            />
            {formErrors.time && (
              <p className="text-red-500 text-sm mt-1">{formErrors.time}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#d6b740] text-black font-semibold py-3 rounded-md hover:bg-[#c1a235]"
          >
            Add Booking
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}

export default Booking;
