// src/pages/Booking.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

function Booking() {
  // form + errors
  const [formErrors, setFormErrors] = useState({});
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({
    service: [],
    stylist: "",
    customerName: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    mode: "offline",
  });

  // OTP (email only)
  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  // UI messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalPrice = selectedServices.reduce((total, service) => {
    return total + (Number(service.price) || 0);
  }, 0);

  // Today's date in YYYY-MM-DD format (used to restrict past dates)
  const todayStr = new Date().toISOString().slice(0, 10);

  // fetch services + stylists on mount
  useEffect(() => {
    fetchServices();
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      const resp = await axios.get("http://localhost:5000/api/stylists");
      const list = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.stylists || [];
      // only active stylists
      const active = list.filter((s) => (s.status || "active") === "active");
      setStylists(
        active.map((s) => ({
          _id: s._id,
          name: s.name || s.displayName || s.email,
        })),
      );
    } catch (err) {
      console.error("Error fetching stylists:", err);
      // non-fatal
    }
  };

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/Manageservices",
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
        ...s,
      }));

      setServices(normalized);
    } catch (err) {
      console.error("Error fetching services:", err);
      toast.error("Unable to load services");
    }
  };

  // handle inputs: strict rules for name & phone remain
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "service") {
      const selectedService = services.find(
        (s) => (s._id ?? "").toString() === value.toString(),
      );
      if (
        selectedService &&
        !selectedServices.some((s) => s._id === selectedService._id)
      ) {
        const updated = [...selectedServices, selectedService];
        setSelectedServices(updated);
        setFormData((fd) => ({
          ...fd,
          service: updated.map((s) => s.serviceName ?? s.service),
        }));
      }
      return;
    }

    // Customer name: letters + spaces only
    if (name === "customerName") {
      const sanitized = value.replace(/[^A-Za-z\s]/g, "");
      setFormData((prev) => ({ ...prev, customerName: sanitized }));
      setFormErrors((prev) => ({ ...prev, customerName: undefined }));
      return;
    }

    // Phone: digits only, max 10 (no phone OTP)
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
      setFormErrors((prev) => ({ ...prev, phone: undefined }));
      return;
    }

    // Email / date / time
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      // changing email should unverify previous verification and stop any active OTP process
      if (emailVerified) setEmailVerified(false);
      setOtpCooldown(0);
      setOtpCode("");
    }
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const removeService = (serviceId) => {
    const updated = selectedServices.filter((s) => s._id !== serviceId);
    setSelectedServices(updated);
    setFormData((fd) => ({
      ...fd,
      service: updated.map((s) => s.serviceName),
    }));
  };

  // Validation helpers
  const nameIsValid = (name) => /^[A-Za-z\s]+$/.test(name.trim());
  const phoneIsValid = (phone) => /^\d{10}$/.test(phone.trim());
  const emailIsValid = (email) => /^\S+@\S+\.\S+$/.test(email.trim());

  const validateForm = () => {
    const errors = {};
    if (selectedServices.length === 0)
      errors.services = "Please select at least one service";

    if (!formData.customerName || !formData.customerName.trim()) {
      errors.customerName = "Customer name is required";
    } else if (!nameIsValid(formData.customerName)) {
      errors.customerName = "Name must contain only letters and spaces";
    }

    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!phoneIsValid(formData.phone)) {
      errors.phone = "Phone must be exactly 10 digits";
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailIsValid(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.date) errors.date = "Date is required";
    else {
      const d = new Date(formData.date);
      if (isNaN(d.getTime())) {
        errors.date = "Please enter a valid date";
      } else {
        const min = new Date(todayStr);
        min.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        if (d < min) {
          errors.date = "Cannot book past dates";
        }
      }
    }
    if (!formData.time) errors.time = "Time is required";

    if (!formData.stylist || !formData.stylist.trim()) {
      errors.stylist = "Please select a stylist";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ------------------ EMAIL OTP functions ------------------
  // send OTP -> backend expects { to, channel } with channel: 'email'
  const sendOtpEmail = async () => {
    setError("");
    if (otpCooldown > 0) {
      toast.error(`Please wait ${otpCooldown}s before resending`);
      return;
    }
    if (!emailIsValid(formData.email)) {
      setFormErrors((p) => ({ ...p, email: "Enter a valid email first" }));
      return;
    }

    try {
      setOtpLoading(true);
      const to = formData.email.trim();
      const resp = await axios.post("http://localhost:5000/api/auth/send-otp", {
        to,
        channel: "email",
      });
      if (resp.data?.ok) {
        setOtpCooldown(60); // 60s cooldown
        toast.success(`OTP sent to ${to} — check your inbox (expires in 60s)`);
      } else {
        throw new Error(resp.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("sendOtpEmail error:", err);
      toast.error(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // verify OTP -> backend expects { to, code, channel }
  const verifyOtpEmail = async () => {
    setError("");
    if (!otpCode || !otpCode.trim()) {
      toast.error("Enter the OTP first");
      return;
    }
    const to = formData.email.trim();
    try {
      setOtpLoading(true);
      const resp = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          to,
          code: otpCode.trim(),
          channel: "email",
        },
      );
      if (resp.data?.ok) {
        toast.success("Email verified");
        setEmailVerified(true);
        setOtpCode("");
        setOtpCooldown(0); // stop countdown on successful verification
      } else {
        throw new Error(resp.data?.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("verifyOtpEmail error:", err);
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // ------------------ Submit booking ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    // IMPORTANT: require email verification before booking
    if (!emailVerified) {
      toast.error(
        "Please verify your email with the OTP before adding booking",
      );
      setFormErrors((p) => ({ ...p, email: "Email must be verified" }));
      return;
    }

    try {
      const bookingData = {
        selectedServices,
        stylist: formData.stylist,
        ...formData,
      };

      const res = await axios.post(
        "http://localhost:5000/api/bookings",
        bookingData,
      );
      if (res.status === 201 || res.data?.ok) {
        setMessage("✅ Booking added successfully!");
        setFormData({
          service: [],
          stylist: "",
          customerName: "",
          phone: "",
          email: "",
          date: "",
          time: "",
        });
        setSelectedServices([]);
        setEmailVerified(false);
        toast.success("Booking created");
      } else {
        throw new Error(res.data?.message || "Booking failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      const em = err.response?.data?.message || "Failed to add booking";
      setError(em);
      toast.error(em);
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#000000] pl-55 pt-10 pb-2 min-h-screen ">
      <div className="bg-gray text-white rounded-xl shadow-xl  border p-6 w-full max-w-md ">
        <h2 className="text-3xl font-semibold text-center mb-6 text-white">
          New Booking
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Service */}
          <div>
            <select
              name="service"
              value=""
              onChange={handleChange}
              className={`w-full border ${
                formErrors.services ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#000000]`}
            >
              <option value="">Select Service</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.serviceName} ({service.duration}) - ₹{service.price}
                </option>
              ))}
            </select>
            {formErrors.services && (
              <p className="text-red-500 text-sm mt-1">{formErrors.services}</p>
            )}
          </div>

          {/* Selected services list */}
          {selectedServices.length > 0 && (
            <div className="bg-[#fdfaf6] p-4 rounded-md border border-gray-300">
              <h3 className="font-medium mb-2">Selected Services:</h3>
              {formData.stylist ? (
                <div className="text-sm text-gray-700 mb-2">
                  Stylist:{" "}
                  <span className="font-semibold">
                    {(stylists.find((s) => s._id === formData.stylist) || {})
                      .name || "—"}
                  </span>
                </div>
              ) : null}

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

          {/* Stylist selection */}
          <div>
            <select
              name="stylist"
              value={formData.stylist}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.stylist ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#000000] text-white`}
            >
              <option value="">Select Stylist</option>
              {stylists.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {formErrors.stylist && (
              <p className="text-red-500 text-sm mt-1">{formErrors.stylist}</p>
            )}
          </div>

          {/* Customer name */}
          <div>
            <input
              type="text"
              name="customerName"
              placeholder="Customer Name (letters only)"
              value={formData.customerName}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.customerName ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#000000]`}
            />
            {formErrors.customerName && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.customerName}
              </p>
            )}
          </div>

          {/* Phone (no OTP) */}
          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone (10 digits)"
              value={formData.phone}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={10}
              pattern="\d*"
              className={`w-full border ${
                formErrors.phone ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#000000]`}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
            )}
          </div>

          {/* Email + OTP (email only) */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={`flex-1 border ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                } rounded-md px-4 py-3 bg-[#000000]`}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={sendOtpEmail}
                  disabled={otpLoading || otpCooldown > 0}
                  className="px-3 py-2 bg-[#4C0099] rounded text-white font-semibold"
                >
                  {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : "Send OTP"}
                </button>
                {otpCooldown > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCooldown(0);
                      setOtpCode("");
                      setEmailVerified(false);
                      toast("OTP cancelled", { icon: "⚠️" });
                    }}
                    className="px-2 py-2 border rounded text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}

            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 bg-000000"
              />
              <button
                type="button"
                onClick={verifyOtpEmail}
                disabled={otpLoading || !otpCode}
                className={`px-3 py-2 rounded text-white ${
                  emailVerified ? "bg-purple-900" : "bg-purple-900"
                }`}
              >
                {emailVerified ? "Verified" : "Verify"}
              </button>
            </div>
            {otpCooldown > 0 && !emailVerified && (
              <p className="text-sm text-slate-500 mt-2">
                OTP sent — please check your inbox. Expires in {otpCooldown}s.
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <input
              type="date"
              name="date"
              min={todayStr}
              value={formData.date}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.date ? "border-red-500" : "border-gray-300"
              } rounded-md px-4 py-3 bg-[#000000]`}
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
              } rounded-md px-4 py-3 bg-[#000000]`}
            />
            {formErrors.time && (
              <p className="text-red-500 text-sm mt-1">{formErrors.time}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#4C0099] text-white font-semibold py-3 rounded-md hover:bg-[#c1a235]"
          >
            Add Booking
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
        )}
        {error && (
          <p className="text-center mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}

export default Booking;
