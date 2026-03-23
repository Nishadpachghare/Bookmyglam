import React, { useState, useEffect } from "react";
import axios from "axios";

export default function FullOfferPage() {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Offer States
  const [selectedOfferTitle, setSelectedOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTill, setValidTill] = useState("");
  const [discount, setDiscount] = useState("");
  const [offers, setOffers] = useState([]);
  const [offerImage, setOfferImage] = useState(null);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [couponFrom, setCouponFrom] = useState("");
  const [couponTill, setCouponTill] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [activeOfferKey, setActiveOfferKey] = useState("");

  useEffect(() => {
    fetchServices();
    fetchOffers();
    fetchCoupons();
    fetchActiveOffer();
  }, []);

  const fetchActiveOffer = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/offers/active");
      const active = res.data?.data || [];
      if (active.length > 0) {
        const key = active[0]._id || active[0].title || "";
        setActiveOfferKey(key);
      } else {
        setActiveOfferKey("No active offer");
      }
    } catch (err) {
      console.log("Active offer fetch error", err);
      setActiveOfferKey("Unavailable");
    }
  };
  const fetchServices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/manageservices");
      const data = res.data?.data || res.data || [];
      setServices(
        data.map((s) => ({
          ...s,
          serviceName: s.serviceName ?? s.service ?? "",
        })),
      );
    } catch (error) {
      console.log("Service fetch error", error);
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/offers");
      setOffers(res.data?.data || res.data || []);
    } catch (err) {
      console.log("Offer fetch error", err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/coupons");
      const data = res.data?.data || res.data || [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Coupon fetch error", err);
      setCoupons([]);
    }
  };

  /* ===============================
      OFFER ACTIONS
  =============================== */
  const handleAddOffer = async () => {
    if (!selectedOfferTitle || selectedServices.length === 0) {
      alert("Please fill required fields");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("title", selectedOfferTitle);
      formData.append("description", offerDescription);
      formData.append("discount", discount);
      formData.append("startDate", validFrom);
      formData.append("endDate", validTill);
      formData.append("services", JSON.stringify(selectedServices));

      if (offerImage) formData.append("image", offerImage);

      await axios.post("http://localhost:5000/api/offers", formData);

      alert("Offer created successfully");

      setSelectedOfferTitle("");
      setSelectedServices([]);
      setOfferDescription("");
      setValidFrom("");
      setValidTill("");
      setDiscount("");
      setOfferImage(null);

      fetchOffers();
    } catch (err) {
      alert("Offer creation failed");
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/offers/${id}`);
      setOffers(offers.filter((o) => o._id !== id));
      fetchActiveOffer();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handlePublishOffer = async (offer) => {
    try {
      // publish endpoint exists for setting published true
      await axios.put(`http://localhost:5000/api/offers/publish/${offer._id}`);
      alert(`${offer.title || "Offer"} published successfully`);
      await fetchOffers();
      await fetchActiveOffer();
    } catch (err) {
      console.error("Publish offer error", err);
      alert("Failed to publish offer");
    }
  };

  /* ===============================
      COUPON ACTIONS
  =============================== */
  const handleAddCoupon = async () => {
    if (!couponCode || !couponDiscount) {
      alert("Please fill Coupon Code and Discount");
      return;
    }

    const couponData = {
      code: couponCode.toUpperCase(),
      discount: couponDiscount,
      validFrom: couponFrom,
      validTill: couponTill,
      minAmount: minAmount,
    };

    try {
      await axios.post("http://localhost:5000/api/coupons", couponData);

      setCouponCode("");
      setCouponDiscount("");
      setCouponFrom("");
      setCouponTill("");
      setMinAmount("");

      alert("Coupon Added Successfully!");

      fetchCoupons();
    } catch (err) {
      alert("Failed to add coupon.");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/coupons/${id}`);
      setCoupons(coupons.filter((c) => c._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-black text-white font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#111111] border-r border-gray-800 p-6 fixed h-full">
        <h1 className="text-3xl font-bold text-purple-500 mb-10">
          Admin Panel
        </h1>

        <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-600 mb-2 font-bold transition-colors">
          Offers & Coupons
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-64 p-10 overflow-y-auto">
        <h2 className="text-4xl font-bold mb-8 text-purple-500">
          Offer & Coupon Management
        </h2>

        {/* CREATE OFFER FORM */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-purple-400">
            Create New Offer
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              placeholder="Offer Title"
              value={selectedOfferTitle}
              onChange={(e) => setSelectedOfferTitle(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none"
            />

            <div className="relative">
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-black border border-gray-700 rounded-xl p-3 cursor-pointer text-gray-300"
              >
                {selectedServices.length > 0
                  ? selectedServices.join(", ")
                  : "Select Services"}
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

          <textarea
            placeholder="Offer Description"
            value={offerDescription}
            onChange={(e) => setOfferDescription(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-4 mb-6 focus:border-purple-500 outline-none"
            rows="2"
          />

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

          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="number"
              placeholder="Discount %"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none"
            />

            <input
              type="file"
              onChange={(e) => setOfferImage(e.target.files[0])}
              className="bg-black border border-gray-700 rounded-xl p-3 text-sm text-gray-400"
            />
          </div>

          <button
            onClick={handleAddOffer}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95"
          >
            Add Offer
          </button>
        </div>

        {/* ACTIVE OFFERS LIST */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-16 shadow-lg">
          <h3 className="text-2xl font-semibold mb-2 text-purple-400">
            Active Offer Key (for device sync)
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            {activeOfferKey || "Loading active offer..."}
          </p>

          <h3 className="text-2xl font-semibold mb-8 text-purple-400 flex justify-between items-center">
            Active Offers
            <span className="bg-purple-900/30 text-purple-400 text-sm px-3 py-1 rounded-full border border-purple-800">
              {offers.length} Running
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="bg-black border border-gray-700 rounded-2xl overflow-hidden hover:border-purple-500 transition-all group shadow-md"
              >
                <div className="h-40 bg-gray-900 relative">
                  {offer.image ? (
                    <img
                      src={
                        offer.image.startsWith("http")
                          ? offer.image
                          : `http://localhost:5000/uploads/${offer.image}`
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
                </div>

                <div className="p-5">
                  <h4 className="text-lg font-bold text-white mb-1">
                    {offer.title}
                  </h4>

                  {/* SERVICES DISPLAY */}
                  {offer.services && offer.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {offer.services.map((service, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-purple-900/40 text-purple-400 px-2 py-1 rounded border border-purple-700"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {offer.description}
                  </p>

                  <div className="text-left text-[11px] text-gray-400 space-y-2 mb-6 border-t border-gray-800 pt-4">
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePublishOffer(offer)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        offer.published
                          ? "bg-green-700 text-white hover:bg-green-600"
                          : "bg-purple-700 text-white hover:bg-purple-600"
                      }`}
                    >
                      {offer.published ? "Published" : "Publish"}
                    </button>

                    <button
                      onClick={() => handleDeleteOffer(offer._id)}
                      className="flex-1 bg-red-600/10 text-red-500 border border-red-600/50 py-2 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-900 mb-16" />

        {/* CREATE COUPON FORM */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-purple-400">
            Create New Coupon
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              placeholder="Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3 focus:border-purple-500 outline-none uppercase font-bold text-purple-400"
            />

            <input
              type="number"
              placeholder="Discount %"
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

        {/* ACTIVE COUPONS LIST */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10 shadow-lg">
          <h3 className="text-2xl font-semibold mb-8 text-purple-400 flex justify-between items-center">
            Active Coupons
            <span className="bg-purple-900/30 text-purple-400 text-sm px-3 py-1 rounded-full border border-purple-800">
              {coupons.length} Available
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coupons.length > 0 ? (
              coupons.map((coupon, index) => (
                <div
                  key={coupon._id || index}
                  className="relative bg-black border-2 border-dashed border-gray-700 rounded-2xl p-6 hover:border-purple-500 transition-all group shadow-xl"
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
                        <span className="text-white font-bold text-xs">
                          ₹{coupon.minAmount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span className="text-white font-bold text-xs">
                          {(coupon.validTill || "Never").split("T")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-green-900/20 text-green-500 border border-green-800/30 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-default">
                        Active
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(coupon._id)}
                        className="flex-1 bg-red-600/10 text-red-500 border border-red-600/20 py-2 rounded-lg text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 border border-dashed border-gray-800 rounded-xl text-gray-500 italic">
                No active coupons available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
