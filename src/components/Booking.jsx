import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ADMIN_QR_URL = "/QR.jpeg";

function Booking() {
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [formData, setFormData] = useState({
    stylist: "",
    customerName: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    mode: "offline",
  });

  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // QR Modal state
  const [showQR, setShowQR] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const totalPrice = selectedServices.reduce(
    (total, s) => total + Number(s.price || 0),
    0,
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchServices();
    fetchStylists();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/Manageservices");
      // backend returns objects with a `service` field but many parts
      // of the client expect `serviceName`.  Normalize here so the rest
      // of the component doesn't need to worry about it.
      const data = res.data?.data || res.data || [];
      const normalized = data.map((s) => ({
        ...s,
        serviceName: s.serviceName ?? s.service ?? "",
      }));
      setServices(normalized);
    } catch {
      toast.error("Unable to load services");
    }
  };

  const fetchStylists = async () => {
    try {
      // only active stylists are relevant when creating a booking
      const res = await axios.get("http://localhost:5000/api/stylists", {
        params: { status: "active" },
      });
      const list = res.data || [];
      // extra guard in case server doesn't filter
      const activeOnly = list.filter(
        (s) => (s.status || "").toString().toLowerCase() === "active",
      );
      setStylists(activeOnly);
    } catch {
      toast.error("Unable to load stylists");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "service") {
      const service = services.find((s) => s._id === value);
      if (service && !selectedServices.some((s) => s._id === service._id)) {
        setSelectedServices([...selectedServices, service]);
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email" && emailVerified) {
      // user changed email after verifying; require re-verification
      setEmailVerified(false);
      setOtpCode("");
    }
  };

  const removeService = (id) => {
    setSelectedServices((prev) => prev.filter((s) => s._id !== id));
  };

  const sendOtpEmail = async () => {
    const email = formData.email?.trim();
    if (!email) return toast.error("Enter email first");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/send-otp", {
        to: email,
        channel: "email",
      });
      if (res.data.ok) toast.success("OTP Sent");
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "OTP failed");
    }
  };

  const verifyOtpEmail = async () => {
    const email = formData.email?.trim();
    if (!email) return toast.error("Enter email first");
    if (!otpCode) return toast.error("Enter OTP");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          to: email,
          code: otpCode.trim(),
          // channel is ignored by the server but harmless
          channel: "email",
        },
      );

      if (res.data.ok) {
        setEmailVerified(true);
        toast.success("Email verified ✅");
      } else {
        toast.error(res.data.message || "OTP verification failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "Invalid OTP");
    }
  };

  const validateForm = () => {
    if (!formData.email?.trim()) {
      toast.error("Enter email");
      return false;
    }
    if (!emailVerified) {
      toast.error("Verify your email first");
      return false;
    }
    if (selectedServices.length === 0) {
      toast.error("Select at least one service");
      return false;
    }
    if (!formData.customerName) {
      toast.error("Enter customer name");
      return false;
    }
    if (!formData.phone) {
      toast.error("Enter phone number");
      return false;
    }
    if (!formData.date) {
      toast.error("Select date");
      return false;
    }
    if (!formData.time) {
      toast.error("Select time");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // If online → show QR modal first, don't submit yet
    if (formData.mode === "online") {
      setShowQR(true);
      return;
    }

    // Offline → submit directly
    await submitBooking();
  };

  const submitBooking = async () => {
    try {
      setQrLoading(true);

      const res = await axios.post("http://localhost:5000/api/bookings", {
        // ensure services payload matches API expectations
        selectedServices: selectedServices.map((s) => ({
          ...s,
          serviceName: s.serviceName ?? s.service ?? "",
        })),
        ...formData,
      });

      if (res.data.ok) {
        toast.success(
          formData.mode === "online"
            ? "Booking submitted! Admin will verify your payment 🎉"
            : "Booking confirmed! Pay at salon 💇",
        );
        resetForm();
        setShowQR(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "Booking failed. Try again.");
      console.error("submitBooking error:", err);
    } finally {
      setQrLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedServices([]);
    setEmailVerified(false);
    setOtpCode("");
    setFormData({
      stylist: "",
      customerName: "",
      phone: "",
      email: "",
      date: "",
      time: "",
      mode: "offline",
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen pl-55 bg-black">
      <div className="bg-zinc-900 p-6 rounded-xl w-[420px] text-white">
        <h2 className="text-2xl text-center mb-5 font-semibold">New Booking</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SERVICE SELECT */}
          <select
            name="service"
            onChange={handleChange}
            className="w-full bg-black border border-zinc-700 p-2 rounded text-white"
          >
            <option value="">Select Service</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.serviceName} ₹{s.price}
              </option>
            ))}
          </select>
          {selectedServices.map((s) => (
            <div
              key={s._id}
              className="flex justify-between text-sm bg-zinc-800 px-3 py-2 rounded"
            >
              <span>
                {s.serviceName} ₹{s.price}
              </span>
              <button
                type="button"
                onClick={() => removeService(s._id)}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          ))}

          {selectedServices.length > 0 && (
            <div className="text-right text-purple-400 font-medium">
              Total: ₹{totalPrice}
            </div>
          )}

          {/* CUSTOMER INFO */}
          <input
            name="customerName"
            placeholder="Customer Name"
            value={formData.customerName}
            onChange={handleChange}
            className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
          />

          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
          />

          {/* EMAIL + OTP */}
          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
          />

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={sendOtpEmail}
              className="bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded text-sm whitespace-nowrap"
            >
              Send OTP
            </button>

            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter OTP"
              className="flex-1 bg-black border border-zinc-700 p-2 rounded text-white"
            />

            <button
              type="button"
              onClick={verifyOtpEmail}
              className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded text-sm whitespace-nowrap"
            >
              Verify
            </button>
          </div>

          {emailVerified && (
            <p className="text-green-400 text-sm">✅ Email verified</p>
          )}

          {/* DATE & TIME */}
          <input
            type="date"
            name="date"
            min={todayStr}
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
          />

          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
          />

          {/* STYLIST */}
          {stylists.length > 0 ? (
            <select
              name="stylist"
              onChange={handleChange}
              className="w-full bg-black border border-zinc-700 p-2 rounded text-white"
            >
              <option value="">Any Stylist</option>
              {stylists.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-zinc-400 text-sm">No stylist available</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, mode: "offline" })}
              className={`flex-1 py-2 rounded border transition-all ${
                formData.mode === "offline"
                  ? "bg-gray-600 border-gray-400 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-gray-500"
              }`}
            >
              💵 Pay After
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, mode: "online" })}
              className={`flex-1 py-2 rounded border transition-all ${
                formData.mode === "online"
                  ? "bg-green-700 border-green-500 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-green-700"
              }`}
            >
              📱 Pay Online (UPI)
            </button>
          </div>

          {formData.mode === "online" && (
            <p className="text-xs text-zinc-400 text-center">
              A QR code will appear — scan & pay, then submit your booking.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded font-semibold transition-colors"
          >
            {formData.mode === "online" ? "Proceed to Pay →" : "Add Booking"}
          </button>
        </form>
      </div>
      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-[360px] text-white text-center shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-1">Scan & Pay</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Pay{" "}
              <span className="text-green-400 font-bold text-lg">
                ₹{totalPrice}
              </span>{" "}
              using any UPI app
            </p>
            {/* QR CODE */}
            <div className="bg-white p-3 rounded-xl inline-block mb-4">
              <img
                src={ADMIN_QR_URL}
                alt="UPI QR Code"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                style={{ display: "none" }}
                className="w-48 h-48 bg-gray-200 rounded flex flex-col items-center justify-center text-gray-600 text-sm"
              >
                <span className="text-3xl mb-2">📷</span>
                <span>Add QR image</span>
                <span className="text-xs mt-1">at /public/upi-qr.png</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mb-6">
              After payment, click the button below to confirm your booking.
              Admin will verify within a few minutes.
            </p>

            {/* Steps */}
            <div className="text-left bg-zinc-800 rounded-lg p-3 mb-6 space-y-1 text-sm text-zinc-300">
              <p>1️⃣ Open PhonePe / GPay / Paytm</p>
              <p>2️⃣ Scan this QR code</p>
              <p>3️⃣ Pay ₹{totalPrice}</p>
              <p>4️⃣ Click "I've Paid" below</p>
            </div>

            {/* Confirm button */}
            <button
              onClick={submitBooking}
              disabled={qrLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-900 py-3 rounded-lg font-semibold transition-colors"
            >
              {qrLoading ? "Submitting..." : "✅ I've Paid — Confirm Booking"}
            </button>

            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-sm py-2"
            >
              Go back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;
