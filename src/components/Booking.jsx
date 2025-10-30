import React, { useState } from "react";
import axios from "axios";

function Booking() {
  const [formData, setFormData] = useState({
    service: "",
    customerName: "",
    phone: "",
    email: "",
    date: "",
    time: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/bookings/add", formData);
      if (res.status === 201) {
        setMessage("✅ Booking added successfully!");
        setFormData({
          service: "",
          customerName: "",
          phone: "",
          email: "",
          date: "",
          time: "",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("❌ Failed to add booking. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#fffdfa] pl-55 pt-15">
      <div className="bg-white border rounded-xl shadow-xl p-6 w-full max-w-md ">
        <h2 className="text-3xl font-semibold text-center mb-6 text-black">
          New Booking
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          >
            <option value="">Select Service</option>
            <option>Haircut</option>
            <option>Facial</option>
            <option>Manicure</option>
            <option>Massage</option>
          </select>

          <input
            type="text"
            name="customerName"
            placeholder="Customer Name"
            value={formData.customerName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <button
            type="submit"
            className="w-full bg-[#d6b740] text-black font-semibold py-3 rounded-md hover:bg-[#c9a938]"
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
