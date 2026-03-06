import React, { useState } from "react";

export default function FullOfferPage() {

  const [selectedServices, setSelectedServices] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOfferTitle, setSelectedOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTill, setValidTill] = useState("");
  const [discount, setDiscount] = useState("");
  const [offers, setOffers] = useState([]);
  const [offerImage, setOfferImage] = useState(null);

  // COUPON STATES
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [couponFrom, setCouponFrom] = useState("");
  const [couponTill, setCouponTill] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [coupons, setCoupons] = useState([]);

  const servicesList = [
    "Hair Spa",
    "Hair Cutting",
    "Hair Colour",
    "Beard Styling",
    "Facial",
    "Manicure",
  ];

  const offerTitles = [
    "Special Day Offer",
    "Holi Special Offer",
    "Summer Offer",
    "Weekend Offer",
    "Monthly Offer",
  ];

  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOfferImage(URL.createObjectURL(file));
    }
  };

  const handleAddOffer = () => {
    if (!selectedOfferTitle || selectedServices.length === 0) {
      alert("Please fill required fields");
      return;
    }

    const newOffer = {
      id: Date.now(),
      title: selectedOfferTitle,
      services: selectedServices,
      description: offerDescription,
      validFrom,
      validTill,
      discount,
      image: offerImage,
      published: false,
    };

    setOffers([...offers, newOffer]);

    setSelectedOfferTitle("");
    setSelectedServices([]);
    setOfferDescription("");
    setValidFrom("");
    setValidTill("");
    setDiscount("");
    setOfferImage(null);
  };

  const handlePublish = (id) => {
    setOffers(
      offers.map((offer) =>
        offer.id === id ? { ...offer, published: true } : offer
      )
    );
  };

  const handleDelete = (id) => {
    setOffers(offers.filter((offer) => offer.id !== id));
  };

  // ADD COUPON
  const handleAddCoupon = () => {

    if (!couponCode) {
      alert("Enter Coupon Code");
      return;
    }

    const exists = coupons.find(
      (c) => c.code.toLowerCase() === couponCode.toLowerCase()
    );

    if (exists) {
      alert("Coupon already exists");
      return;
    }

    const newCoupon = {
      id: Date.now(),
      code: couponCode,
      discount: couponDiscount,
      validFrom: couponFrom,
      validTill: couponTill,
      minAmount: minAmount,
    };

    setCoupons([...coupons, newCoupon]);

    setCouponCode("");
    setCouponDiscount("");
    setCouponFrom("");
    setCouponTill("");
    setMinAmount("");
  };

  return (
    <div className="min-h-screen flex bg-black text-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#111111] border-r border-gray-800 p-6">
        <h1 className="text-3xl font-bold text-purple-500 mb-10">
          Admin Panel
        </h1>

        <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-600">
          Offers & Coupons
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10 overflow-y-auto">

        <h2 className="text-4xl font-bold mb-8 text-purple-500">
          Offer Management
        </h2>

        {/* CREATE OFFER */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10">

          <h3 className="text-2xl font-semibold mb-6 text-purple-400">
            Create New Offer
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">

            <select
              value={selectedOfferTitle}
              onChange={(e) => setSelectedOfferTitle(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3"
            >
              <option value="" disabled>
                Select Offer Title
              </option>

              {offerTitles.map((title, index) => (
                <option key={index}>{title}</option>
              ))}
            </select>

            {/* SERVICES */}
            <div className="relative">

              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-black border border-gray-700 rounded-xl p-3 cursor-pointer"
              >
                {selectedServices.length > 0
                  ? selectedServices.join(", ")
                  : "Select Services"}
              </div>

              {dropdownOpen && (
                <div className="absolute mt-2 w-full bg-[#1c1c1c] border border-gray-700 rounded-xl p-4 space-y-2">
                  {servicesList.map((service, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service)}
                        onChange={() => toggleService(service)}
                      />
                      <span>{service}</span>
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
            className="w-full bg-black border border-gray-700 rounded-xl p-4 mb-6"
          />

          <div className="grid grid-cols-2 gap-6 mb-6">

            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3"
            />

            <input
              type="date"
              value={validTill}
              onChange={(e) => setValidTill(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl p-3"
            />
          </div>

          <input
            type="number"
            placeholder="Discount %"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mb-6"
          />

          <input
            type="file"
            onChange={handleImageChange}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mb-6"
          />

          <button
            onClick={handleAddOffer}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl"
          >
            Add Offer
          </button>
        </div>

        {/* ACTIVE OFFERS */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10">

          <h3 className="text-2xl font-semibold mb-6 text-purple-400">
            Active Offer ({offers.length})
          </h3>

          {offers.length === 0 ? (
            <div className="text-gray-500 text-center py-10">
              No offers added yet
            </div>
          ) : (

            // GRID LAYOUT
            <div className="grid grid-cols-4 gap-4">

              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-black border border-gray-700 rounded-xl p-6"
                >

                  {offer.image && (
                    <img
                      src={offer.image}
                      alt="Offer"
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}

                  <h4 className="text-xl font-bold text-purple-400">
                    {offer.title}
                  </h4>

                  <p className="text-gray-400 mt-2">
                    <strong>Services:</strong> {offer.services.join(", ")}
                  </p>

                  <p className="text-gray-400">
                    <strong>Description:</strong> {offer.description}
                  </p>

                  <p className="text-gray-400">
                    <strong>Discount:</strong> {offer.discount}%
                  </p>

                  <p className="text-gray-500 text-sm mt-2">
                    <strong>Valid:</strong> {offer.validFrom} - {offer.validTill}
                  </p>

                  <div className="flex space-x-4 mt-4">

                    {!offer.published && (
                      <button
                        onClick={() => handlePublish(offer.id)}
                        className="bg-green-600 px-4 py-2 rounded-lg"
                      >
                        Publish
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="bg-red-600 px-4 py-2 rounded-lg"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* COUPON MANAGEMENT */}

        <div>

          <h2 className="text-4xl font-bold mb-8">
            Coupon Management
          </h2>

          <div className="bg-[#141414] rounded-2xl p-8 border border-gray-800 mb-10">

            <h3 className="text-2xl font-semibold mb-6 text-purple-400">
              Create New Coupon
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">

              <input
                type="text"
                placeholder="Coupon Code"
                value={couponCode}
                onChange={(e) =>
                  setCouponCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
                }
                className="bg-black border border-gray-700 rounded-xl p-3"
              />

              <input
                type="number"
                placeholder="Discount %"
                value={couponDiscount}
                onChange={(e) => setCouponDiscount(e.target.value)}
                className="bg-black border border-gray-700 rounded-xl p-3"
              />

            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">

              <input
                type="date"
                value={couponFrom}
                onChange={(e) => setCouponFrom(e.target.value)}
                className="bg-black border border-gray-700 rounded-xl p-3"
              />

              <input
                type="date"
                value={couponTill}
                onChange={(e) => setCouponTill(e.target.value)}
                className="bg-black border border-gray-700 rounded-xl p-3"
              />

            </div>

            <input
              type="number"
              placeholder="Minimum Booking Amount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-xl p-3 mb-6"
            />

            <button
              onClick={handleAddCoupon}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl"
            >
              Add Coupon
            </button>

          </div>

          {/* ACTIVE COUPONS */}

<div className="bg-[#141414] rounded-2xl p-8 border border-gray-800">

  <h3 className="text-2xl font-semibold mb-6 text-purple-400">
    Active Coupons ({coupons.length})
  </h3>

  {coupons.length === 0 ? (
    <div className="text-center text-gray-500 py-16">
      No coupons added yet
    </div>
  ) : (

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {coupons.map((c) => (
        <div
          key={c.id}
          className="bg-black border border-gray-700 rounded-xl p-4 hover:border-purple-500 transition"
        >
          <p><strong>Code:</strong> {c.code}</p>
          <p><strong>Discount:</strong> {c.discount}%</p>
          <p><strong>Valid:</strong> {c.validFrom} - {c.validTill}</p>
          <p><strong>Min Amount:</strong> ₹{c.minAmount}</p>
        </div>
      ))}

    </div>
  )}
  </div>
  </div>

</div>

          </div>

        
  );
}