import React from 'react'

function Booking() {
  return (
    <div> 
    <div className=" flex items-center justify-center bg-[#fffdfa] pl-55 pt-15">
      <div className="bg-white border rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-3xl font-semibold  text-center mb-6 text-black">
          New Booking
        </h2>

        <form className="space-y-4">
          <select
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          >
            <option>Select Service</option>
            <option>Haircut</option>
            <option>Facial</option>
            <option>Manicure</option>
            <option>Massage</option>
          </select>

          <input
            type="text"
            placeholder="Customer Name"
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="text"
            placeholder="Phone"
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <input
            type="time"
            className="w-full border border-gray-300 rounded-md px-4 py-3 bg-[#fdfaf6]"
          />

          <button
            type="button"
            className="w-full bg-[#d6b740] text-black font-semibold py-3 rounded-md hover:bg-[#c9a938]"
          >
            Add Booking
          </button>
        </form>
      </div>
    </div>
    </div>
  ); 
}

export default Booking
