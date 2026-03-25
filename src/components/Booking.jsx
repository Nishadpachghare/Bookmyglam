import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ADMIN_QR_URL = "/QR.jpeg";

function Booking() {
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availableOffers, setAvailableOffers] = useState([]);

  // track any field-specific validation errors (email in particular)
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    stylist: "",
    customerName: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    mode: "offline",
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponValidated, setCouponValidated] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [discountData, setDiscountData] = useState({
    discountPercentage: 0,
    discountAmount: 0,
    finalAmount: 0,
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponSuggestions, setShowCouponSuggestions] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpTimerRef = useRef(null);

  // keep cooldown ticking down
  useEffect(() => {
    if (otpCooldown <= 0) return;
    otpTimerRef.current = setInterval(() => {
      setOtpCooldown((c) => {
        if (c <= 1) {
          clearInterval(otpTimerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(otpTimerRef.current);
  }, [otpCooldown]);

  // QR Modal state
  const [showQR, setShowQR] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [dateDisplay, setDateDisplay] = useState("");

  const totalPrice = selectedServices.reduce(
    (total, s) => total + Number(s.price || 0),
    0,
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  // Convert yyyy-mm-dd to dd-mm-yyyy
  const formatDateToDisplay = (yyyymmdd) => {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return yyyymmdd;
  };

  // Convert dd-mm-yyyy to yyyy-mm-dd
  const convertToStorageFormat = (ddmmyyyy) => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("-");
    if (
      parts.length === 3 &&
      parts[0].length === 2 &&
      parts[1].length === 2 &&
      parts[2].length === 4
    ) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return "";
  };

  // Handle date input with dd-mm-yyyy format
  const handleDateInput = (e) => {
    let value = e.target.value.replace(/[^\d-]/g, ""); // Remove non-digit and non-dash

    // Auto-format as user types: dd-mm-yyyy
    if (value.length === 2 && !value.includes("-")) {
      value = value + "-";
    } else if (value.length === 5 && value.split("-").length === 2) {
      value = value + "-";
    }

    setDateDisplay(value);

    // Validate and convert when complete (10 chars: DD-MM-YYYY)
    if (value.length === 10) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        if (
          day >= 1 &&
          day <= 31 &&
          month >= 1 &&
          month <= 12 &&
          year >= 2000
        ) {
          const storageFormat = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          setFormData({ ...formData, date: storageFormat });
        }
      }
    }
  };

  useEffect(() => {
    fetchServices();
    fetchStylists();
    fetchAvailableCoupons();
    fetchAvailableOffers();
  }, []);

  const fetchAvailableCoupons = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/coupons");
      const data = res.data?.data || res.data || [];
      // Filter only active coupons
      const activeCoupons = Array.isArray(data)
        ? data.filter((c) => c.active === true)
        : [];
      setAvailableCoupons(activeCoupons);
    } catch (err) {
      console.warn("Failed to fetch coupons:", err);
    }
  };

  const fetchAvailableOffers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/offers");
      const data = res.data?.data || res.data || [];
      // Filter only active and published offers
      const activeOffers = Array.isArray(data)
        ? data.filter((o) => o.active === true && o.published === true)
        : [];
      setAvailableOffers(activeOffers);
    } catch (err) {
      console.warn("Failed to fetch offers:", err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/manageservices");
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
      const payload = res.data;
      let list = payload?.data ?? payload;
      if (!Array.isArray(list)) list = [];
      // extra guard in case server doesn't filter
      const activeOnly = list.filter(
        (s) => (s.status || "").toString().toLowerCase() === "active",
      );
      setStylists(activeOnly);
    } catch (err) {
      console.error("Booking fetchStylists error:", err);
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

    // clear any existing error for this field, then update value
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (name === "email") {
      if (emailVerified) {
        // user changed email after verifying; require re-verification
        setEmailVerified(false);
      }
      setOtpCode("");
      setOtpCooldown(0);
      clearInterval(otpTimerRef.current);
    }
  };

  const removeService = (id) => {
    setSelectedServices((prev) => prev.filter((s) => s._id !== id));
  };

  const sendOtpEmail = async () => {
    const email = formData.email?.trim();
    if (!email) return toast.error("Enter email first");
    if (otpCooldown > 0) {
      toast.error(`Please wait ${otpCooldown}s before resending`);
      return;
    }

    try {
      setOtpLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/send-otp", {
        to: email,
        channel: "email",
      });
      if (res.data.ok) {
        toast.success("OTP Sent");
        setOtpCooldown(60);
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "OTP failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpEmail = async () => {
    const email = formData.email?.trim();
    if (!email) return toast.error("Enter email first");
    if (!otpCode) return toast.error("Enter OTP");

    try {
      setOtpLoading(true);
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
    } finally {
      setOtpLoading(false);
    }
  };

  const handleValidateCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      setCouponError("Enter coupon code or select an offer");
      return;
    }

    if (totalPrice === 0) {
      setCouponError("Select services first");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const res = await axios.post(
        "http://localhost:5000/api/coupons/validate-discount",
        {
          code,
          totalAmount: totalPrice,
          selectedServices: selectedServices.map(
            (s) => s.name || s.serviceName,
          ),
        },
      );

      if (res.data.success) {
        setDiscountData({
          discountPercentage: res.data.data.discount,
          discountAmount: res.data.data.discountAmount,
          finalAmount: res.data.data.finalAmount,
        });
        setCouponValidated(true);
        const discountType = res.data.type === "coupon" ? "Coupon" : "Offer";
        toast.success(
          `${discountType} applied! Save ₹${res.data.data.discountAmount}`,
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      setCouponError(msg || "Invalid coupon code or offer");
      setCouponValidated(false);
      toast.error(msg || "Validation failed");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponValidated(false);
    setCouponError("");
    setShowCouponSuggestions(false);
    setDiscountData({
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
    });
    toast.success("Coupon removed");
  };

  const validateForm = () => {
    // clear previous errors
    setFormErrors({});

    if (!formData.email?.trim()) {
      setFormErrors((prev) => ({ ...prev, email: "Email is required" }));
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
        couponCode: couponValidated ? couponCode.toUpperCase() : null,
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
    setCouponCode("");
    setCouponValidated(false);
    setCouponError("");
    setShowCouponSuggestions(false);
    setDiscountData({
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
    });
    setDateDisplay("");
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

          {/* COUPON SECTION */}
          {selectedServices.length > 0 && (
            <div className="bg-zinc-800 p-4 rounded border border-zinc-700 space-y-3">
              <div className="text-sm text-zinc-300 font-semibold">
                Apply Offer/Coupon
              </div>

              {!couponValidated ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Select coupon or offer"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                        setShowCouponSuggestions(true);
                      }}
                      onFocus={() => setShowCouponSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowCouponSuggestions(false), 200)
                      }
                      className="flex-1 bg-black border border-zinc-700 p-2 rounded text-white placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 rounded text-white font-semibold transition-colors"
                    >
                      {couponLoading ? "Checking..." : "Apply"}
                    </button>
                  </div>

                  {/* Available Coupons & Offers Suggestions */}
                  {showCouponSuggestions &&
                    (availableCoupons.length > 0 ||
                      availableOffers.length > 0) && (
                      <div className="bg-zinc-800 border border-zinc-700 rounded p-3 space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-xs text-zinc-400 font-semibold">
                          Available Offers & Coupons:
                        </p>
                        <div className="space-y-1">
                          {/* Coupons */}
                          {availableCoupons.map((coupon) => (
                            <button
                              key={`coupon-${coupon._id}`}
                              type="button"
                              onClick={() => {
                                setCouponCode(coupon.code);
                                setShowCouponSuggestions(false);
                              }}
                              className="w-full text-left px-2 py-1 text-xs bg-zinc-700 hover:bg-purple-700 rounded text-zinc-200 hover:text-white transition-colors"
                            >
                              <span className="font-bold text-purple-400">
                                {coupon.code}
                              </span>
                              {" - "} Save {coupon.discount}%
                              {coupon.minAmount > 0 &&
                                ` (Min: ₹${coupon.minAmount})`}
                            </button>
                          ))}

                          {/* Offers */}
                          {availableOffers.map((offer) => (
                            <button
                              key={`offer-${offer._id}`}
                              type="button"
                              onClick={() => {
                                setCouponCode(offer.title);
                                setShowCouponSuggestions(false);
                              }}
                              className="w-full text-left px-2 py-1 text-xs bg-zinc-700 hover:bg-blue-700 rounded text-zinc-200 hover:text-white transition-colors"
                            >
                              <span className="font-bold text-blue-400">
                                {offer.title}
                              </span>
                              {" - "} Save {offer.discount}% (Offer)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="bg-green-900 border border-green-700 p-3 rounded flex justify-between items-center">
                  <div>
                    <p className="text-green-400 font-semibold">
                      ✓ {couponCode} Applied
                    </p>
                    <p className="text-sm text-green-300">
                      Save ₹{discountData.discountAmount}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-red-400 text-sm">{couponError}</p>
              )}

              {couponValidated && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-300">
                    <span>Subtotal:</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Discount ({discountData.discountPercentage}%):</span>
                    <span>-₹{discountData.discountAmount}</span>
                  </div>
                  <div className="border-t border-zinc-600 pt-2 flex justify-between font-semibold text-green-400">
                    <span>Final Price:</span>
                    <span>₹{discountData.finalAmount}</span>
                  </div>
                </div>
              )}
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

          {emailVerified && (
            <p className="text-green-400 text-sm">✅ Email verified</p>
          )}

          {/* DATE & TIME */}
          <div className="space-y-3">
            {/* DATE INPUT - DD-MM-YYYY FORMAT */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                📅 Booking Date (DD-MM-YYYY)
              </label>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                value={dateDisplay || formatDateToDisplay(formData.date)}
                onChange={handleDateInput}
                maxLength="10"
                className="w-full p-2 bg-black border border-zinc-700 rounded text-white placeholder-zinc-600"
              />
              {formData.date && (
                <p className="text-xs text-purple-400 mt-1">
                  ✓ {formatDateToDisplay(formData.date)}
                </p>
              )}
            </div>

            {/* TIME INPUT */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                🕐 Booking Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
              />
            </div>
          </div>

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
