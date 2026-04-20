import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://bookmyglam-backend.vercel.app";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

export default function FullOfferPage() {
  // ── Services ──────────────────────────────────────────────────────────────
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ── Offer form ────────────────────────────────────────────────────────────
  const [selectedOfferTitle, setSelectedOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTill, setValidTill] = useState("");
  const [discount, setDiscount] = useState("");
  const [offerImage, setOfferImage] = useState(null); // File object
  const [offerImagePreview, setOfferImagePreview] = useState(""); // preview URL

  // ── Offer list ────────────────────────────────────────────────────────────
  const [offers, setOffers] = useState([]);
  const [activeOfferKey, setActiveOfferKey] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);

  // ── Coupon form ───────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [couponFrom, setCouponFrom] = useState("");
  const [couponTill, setCouponTill] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchOffers();
    fetchCoupons();
    fetchActiveOffer();
  }, []);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchActiveOffer = async () => {
    try {
      const res = await api.get("/api/offers/active");
      const active = res.data?.data || [];
      setActiveOfferKey(
        active.length > 0
          ? active[0]._id || active[0].title || "Active"
          : "No active offer",
      );
    } catch {
      setActiveOfferKey("Unavailable");
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get("/api/manageservices");
      const data = res.data?.data || res.data || [];
      setServices(
        data.map((s) => ({
          ...s,
          serviceName: s.serviceName ?? s.service ?? "",
        })),
      );
    } catch (err) {
      console.warn("Service fetch error", err.message);
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await api.get("/api/offers");
      setOffers(res.data?.data || res.data || []);
    } catch (err) {
      console.warn("Offer fetch error", err.message);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await api.get("/api/coupons");
      const data = res.data?.data || res.data || [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Coupon fetch error", err.message);
      setCoupons([]);
    }
  };

  // ── Image picker ──────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOfferImage(file);
    setOfferImagePreview(URL.createObjectURL(file));
  };

  // ── ADD OFFER ─────────────────────────────────────────────────────────────
  const handleAddOffer = async () => {
    // Validation
    if (!selectedOfferTitle.trim()) {
      alert("Offer title is required");
      return;
    }
    if (selectedServices.length === 0) {
      alert("Please select at least one service");
      return;
    }
    if (discount === "" || discount === undefined) {
      alert("Discount is required");
      return;
    }

    try {
      setOfferLoading(true);

      // ✅ FormData — multer needs this to parse req.body on backend
      const formData = new FormData();
      formData.append("title", selectedOfferTitle.trim());
      formData.append("description", offerDescription.trim());
      formData.append("discount", String(discount));
      formData.append("published", "false");
      formData.append("services", JSON.stringify(selectedServices));

      if (validFrom) formData.append("startDate", validFrom);
      if (validTill) formData.append("endDate", validTill);

      // ✅ field name "image" must match upload.single("image") in backend route
      if (offerImage) formData.append("image", offerImage);

      // ✅ Debug — check in browser console
      console.log("[Offer] FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(
          `  ${key}:`,
          value instanceof File ? `File(${value.name})` : value,
        );
      }

      // ✅ Do NOT set Content-Type header — axios sets multipart/form-data with boundary automatically
      const response = await api.post("/api/offers", formData);

      if (response.data.success) {
        alert("✅ Offer created successfully!");
        setOffers((prev) => [response.data.data, ...prev]);
        await fetchActiveOffer();

        // Reset form
        setSelectedOfferTitle("");
        setSelectedServices([]);
        setOfferDescription("");
        setValidFrom("");
        setValidTill("");
        setDiscount("");
        setOfferImage(null);
        setOfferImagePreview("");
      }
    } catch (err) {
      console.error("[Offer] Full error:", err);
      console.error("[Offer] Response data:", err.response?.data);
      console.error("[Offer] Response status:", err.response?.status);
      alert(
        "Offer creation failed: " +
          (err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Unknown error"),
      );
    } finally {
      setOfferLoading(false);
    }
  };

  // ── DELETE OFFER ──────────────────────────────────────────────────────────
  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await api.delete(`/api/offers/${id}`);
      setOffers((prev) => prev.filter((o) => o._id !== id));
      await fetchActiveOffer();
    } catch {
      alert("Delete failed");
    }
  };

  // ── PUBLISH OFFER ─────────────────────────────────────────────────────────
  const handlePublishOffer = async (offer) => {
    try {
      if (offer.published) {
        // Unpublish
        await api.put(`/api/offers/unpublish/${offer._id}`);
        alert(`"${offer.title}" unpublished`);
      } else {
        // Publish
        await api.put(`/api/offers/publish/${offer._id}`);
        alert(`"${offer.title}" published successfully!`);
      }
      await fetchOffers();
      await fetchActiveOffer();
    } catch (err) {
      console.error("Publish/unpublish error", err);
      alert("Failed to update offer status");
    }
  };

  // ── TOGGLE OFFER ACTIVE STATUS ────────────────────────────────────────────
  const handleToggleOfferActive = async (id, currentStatus) => {
    try {
      const res = await api.put(`/api/offers/${id}/toggle-active`);
      if (res.data.success) {
        setOffers((prev) =>
          prev.map((o) =>
            o._id === id ? { ...o, active: !currentStatus } : o,
          ),
        );
        alert(
          `Offer ${!currentStatus ? "activated" : "deactivated"} successfully!`,
        );
      }
    } catch (err) {
      console.error("Toggle offer error:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to update offer status";
      alert(msg);
    }
  };

  // ── ADD COUPON ────────────────────────────────────────────────────────────
  const handleAddCoupon = async () => {
    if (!couponCode.trim() || !couponDiscount) {
      alert("Coupon Code and Discount are required");
      return;
    }

    try {
      await api.post("/api/coupons", {
        code: couponCode.toUpperCase().trim(),
        discount: couponDiscount,
        validFrom: couponFrom,
        validTill: couponTill,
        minAmount: minAmount,
      });

      alert("✅ Coupon added successfully!");
      setCouponCode("");
      setCouponDiscount("");
      setCouponFrom("");
      setCouponTill("");
      setMinAmount("");
      await fetchCoupons();
    } catch {
      alert("Failed to add coupon");
    }
  };

  // ── DELETE COUPON ─────────────────────────────────────────────────────────
  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/api/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  // ── TOGGLE COUPON ACTIVE STATUS ───────────────────────────────────────────
  const handleToggleCouponActive = async (id, currentStatus) => {
    try {
      const res = await api.put(`/api/coupons/${id}/toggle-active`);
      if (res.data.success) {
        setCoupons((prev) =>
          prev.map((c) =>
            c._id === id ? { ...c, active: !currentStatus } : c,
          ),
        );
        alert(
          `Coupon ${!currentStatus ? "activated" : "deactivated"} successfully!`,
        );
      }
    } catch (err) {
      console.error("Toggle coupon error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to update coupon status";
      alert(msg);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-black text-white font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#111111] border-r border-gray-800 p-6 fixed h-full">
        <h1 className="text-3xl font-bold text-purple-500 mb-10">
          Admin Panel
        </h1>
        <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-600 mb-2 font-bold">
          Offers & Coupons
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 ml-64 p-10 overflow-y-auto">
        <h2 className="text-4xl font-bold mb-8 text-purple-500">
          Offer & Coupon Management
        </h2>

        {/* ── CREATE OFFER FORM ── */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-purple-400">
            Create New Offer
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Title */}
            <input
              type="text"
              placeholder="Offer Title *"
              value={selectedOfferTitle}
              onChange={(e) => setSelectedOfferTitle(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none"
            />

            {/* Services dropdown */}
            <div className="relative">
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-black border border-gray-700 rounded-xl p-3 cursor-pointer text-gray-300"
              >
                {selectedServices.length > 0
                  ? selectedServices.join(", ")
                  : "Select Services *"}
              </div>
              {dropdownOpen && (
                <div className="absolute z-20 mt-2 w-full bg-[#1c1c1c] border border-gray-700 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto shadow-2xl">
                  {services.map((s, i) => (
                    <label
                      key={i}
                      className="flex items-center space-x-2 cursor-pointer hover:text-purple-400"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(s.serviceName)}
                        onChange={() => {
                          const name = s.serviceName;
                          setSelectedServices((prev) =>
                            prev.includes(name)
                              ? prev.filter((x) => x !== name)
                              : [...prev, name],
                          );
                        }}
                        className="accent-purple-600"
                      />
                      <span>{s.serviceName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <textarea
            placeholder="Offer Description"
            value={offerDescription}
            onChange={(e) => setOfferDescription(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-4 mb-6 focus:border-purple-500 outline-none"
            rows="2"
          />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 text-gray-400"
            />
            <input
              type="date"
              value={validTill}
              onChange={(e) => setValidTill(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 text-gray-400"
            />
          </div>

          {/* Discount + Image */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="number"
              placeholder="Discount % *"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              min="0"
              max="100"
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none"
            />
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="bg-black border border-gray-700 rounded-xl p-3 text-sm text-gray-400 w-full"
              />
              {offerImagePreview && (
                <img
                  src={offerImagePreview}
                  alt="Preview"
                  className="mt-2 h-20 rounded-lg object-cover border border-gray-700"
                />
              )}
            </div>
          </div>

          <button
            onClick={handleAddOffer}
            disabled={offerLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95"
          >
            {offerLoading ? "Adding..." : "Add Offer"}
          </button>
        </div>

        {/* ── OFFERS LIST ── */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-16 shadow-lg">
          <p className="text-sm text-gray-400 mb-2">
            Active Offer Key:{" "}
            <span className="text-white font-bold">
              {activeOfferKey || "Loading..."}
            </span>
          </p>

          <h3 className="text-2xl font-semibold mb-8 text-purple-400 flex justify-between items-center">
            All Offers
            <span className="bg-purple-900/30 text-purple-400 text-sm px-3 py-1 rounded-full border border-purple-800">
              {offers.length} Total
            </span>
          </h3>

          {offers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl text-gray-500 italic">
              No offers yet. Create one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map((offer) => (
                <div
                  key={offer._id}
                  className={`bg-black border rounded-2xl overflow-hidden transition-all group shadow-md ${
                    offer.active
                      ? "border-gray-700 hover:border-purple-500"
                      : "border-gray-700 opacity-60 hover:border-gray-600"
                  }`}
                >
                  <div className="h-40 bg-gray-900 relative">
                    {offer.image ? (
                      <img
                        src={
                          offer.image.startsWith("http")
                            ? offer.image
                            : `${API_BASE_URL}/uploads/${offer.image}`
                        }
                        alt="Offer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 italic">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-purple-600 text-white font-bold px-2 py-1 rounded text-xs">
                      {offer.discount}% OFF
                    </div>
                    {offer.published && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white font-bold px-2 py-1 rounded text-xs">
                        LIVE
                      </div>
                    )}
                    {offer.active && (
                      <div className="absolute bottom-3 left-3 bg-blue-600 text-white font-bold px-2 py-1 rounded text-xs">
                        Active
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h4 className="text-lg font-bold text-white mb-1">
                      {offer.title}
                    </h4>

                    {offer.services?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {offer.services.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-purple-900/40 text-purple-400 px-2 py-1 rounded border border-purple-700"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {offer.description}
                    </p>

                    <div className="text-[11px] text-gray-400 space-y-2 mb-6 border-t border-gray-800 pt-4">
                      <div className="flex justify-between">
                        <span>Valid From:</span>
                        <span className="text-white font-bold">
                          {
                            (offer.startDate || offer.validFrom || "N/A").split(
                              "T",
                            )[0]
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valid Till:</span>
                        <span className="text-white font-bold">
                          {
                            (offer.endDate || offer.validTill || "Never").split(
                              "T",
                            )[0]
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => handlePublishOffer(offer)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                          offer.published
                            ? "bg-green-700 hover:bg-yellow-600 text-white"
                            : "bg-purple-700 hover:bg-purple-600 text-white"
                        }`}
                      >
                        {offer.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(offer._id)}
                        className="flex-1 bg-red-600/10 text-red-500 border border-red-600/50 py-2 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleToggleOfferActive(offer._id, offer.active)
                        }
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          offer.active
                            ? "bg-green-900/30 text-green-400 border border-green-600/50 hover:bg-yellow-600 hover:text-white hover:border-yellow-600"
                            : "bg-red-900/30 text-red-400 border border-red-600/50 hover:bg-green-600 hover:text-white hover:border-green-600"
                        }`}
                      >
                        {offer.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-900 mb-16" />

        {/* ── CREATE COUPON FORM ── */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-purple-400">
            Create New Coupon
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              placeholder="Coupon Code *"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none uppercase font-bold text-purple-400"
            />
            <input
              type="number"
              placeholder="Discount % *"
              value={couponDiscount}
              onChange={(e) => setCouponDiscount(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <input
              type="date"
              value={couponFrom}
              onChange={(e) => setCouponFrom(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 text-gray-400"
            />
            <input
              type="date"
              value={couponTill}
              onChange={(e) => setCouponTill(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 text-gray-400"
            />
            <input
              type="number"
              placeholder="Min. Amount ₹"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none"
            />
          </div>

          <button
            onClick={handleAddCoupon}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95"
          >
            Add Coupon
          </button>
        </div>

        {/* ── COUPONS LIST ── */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10 shadow-lg">
          <h3 className="text-2xl font-semibold mb-8 text-purple-400 flex justify-between items-center">
            All Coupons
            <span className="bg-purple-900/30 text-purple-400 text-sm px-3 py-1 rounded-full border border-purple-800">
              {coupons.length} Available
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coupons.length > 0 ? (
              coupons.map((coupon, index) => (
                <div
                  key={coupon._id || index}
                  className={`relative bg-black border-2 border-dashed rounded-2xl p-6 transition-all shadow-xl ${
                    coupon.active
                      ? "border-purple-500 hover:border-purple-400"
                      : "border-gray-700 opacity-60 hover:border-gray-600"
                  }`}
                >
                  <div className="text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">
                      Limited Offer
                    </span>
                    <h4 className="text-4xl font-black text-purple-500 my-2 tracking-tighter">
                      {coupon.code}
                    </h4>
                    <div className="bg-purple-600/10 text-purple-400 inline-block px-4 py-1 rounded-full text-xs font-bold mb-4 border border-purple-500/20">
                      SAVE {coupon.discount}%
                    </div>
                    <div className="text-left text-[11px] text-gray-400 space-y-2 mb-6 border-t border-gray-800 pt-4">
                      <div className="flex justify-between">
                        <span>Min Spend:</span>
                        <span className="text-white font-bold">
                          ₹{coupon.minAmount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span className="text-white font-bold">
                          {(coupon.validTill || "Never").split("T")[0]}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span
                          className={`text-white font-bold ${
                            coupon.active ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {coupon.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleToggleCouponActive(coupon._id, coupon.active)
                        }
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          coupon.active
                            ? "bg-green-900/30 text-green-400 border border-green-600/50 hover:bg-yellow-600 hover:text-white hover:border-yellow-600"
                            : "bg-red-900/30 text-red-400 border border-red-600/50 hover:bg-green-600 hover:text-white hover:border-green-600"
                        }`}
                      >
                        {coupon.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon._id)}
                        className="flex-1 bg-red-600/10 text-red-500 border border-red-600/20 py-2 rounded-lg text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all uppercase"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 border border-dashed border-gray-800 rounded-xl text-gray-500 italic">
                No coupons available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
