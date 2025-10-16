import React, { useState } from "react";
import { MdUpload } from "react-icons/md";

function Dashboard() {
  const [bookings] = useState([
    {
      id: 1,
      customer: "Clara Bennett",
      phone: "555-123-4567",
      stylist: "Emily",
      date: "10:00 AM, July 26",
      service: "Haircut & Style",
      amount: "$100",
      status: "Paid",
    },
    {
      id: 2,
      customer: "Owen Harper",
      phone: "555-987-6543",
      stylist: "Olivia",
      date: "11:30 AM, July 26",
      service: "Manicure",
      amount: "$50",
      status: "Pending",
    },
    {
      id: 3,
      customer: "Ava Mitchell",
      phone: "555-246-8013",
      stylist: "Ethan",
      date: "1:00 PM, July 26",
      service: "Facial",
      amount: "$80",
      status: "Paid",
    },
    {
      id: 4,
      customer: "Lucas Foster",
      phone: "555-135-7911",
      stylist: "Ava",
      date: "2:30 PM, July 26",
      service: "Massage",
      amount: "$70",
      status: "Paid",
    },
  ]);

  return (
    <div className="min-h-screen w-365 p-6 text-black  pl-80 pt-8 ">

      <div className="text-3xl font-semibold mb-4">
       <h1>Dashboard</h1>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-40 w-250">
          <div className="bg-white rounded-ms shadow-lg p-4 text-center">
            <p className="text-gray-500">Total Bookings</p>
            <h2 className="text-3xl font-bold mt-1">25</h2>
          </div>

          <div className="bg-[#d6b740] text-black border rounded-xl shadow-lg p-4 text-center">
            <p className="text-gray-800 font-medium">Total Earnings</p>
            <h2 className="text-3xl font-bold mt-1">$2,500</h2>
          </div>

          <div className="bg-white rounded-sm shadow-lg p-4 text-center">
            <p className="text-gray-500">Active Stylists</p>
            <h2 className="text-3xl font-bold mt-1">5</h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 text-sm my-5 pl-230">
          <button className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50">
            🗑 Delete
          </button>
          <button className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50">
            🔍 Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone No</th>
                <th className="py-3 px-4">Stylist</th>
                <th className="py-3 px-4">Date and Time</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-center">Work Done</th>
                <th className="py-3 px-4 text-center">Edit</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="py-8 p-15 px-4">{b.customer}</td>
                  <td className="py-8 p-15 px-4">{b.phone}</td>
                  <td className="py-3 p-15px-4">{b.stylist}</td>
                  <td className="py-3 p-15 px-4">{b.date}</td>
                  <td className="py-3 p-15 px-4">{b.service}</td>
                  <td className="py-3 p-15 px-4">{b.amount}</td>
                  <td className="py-3 p-15 px-4">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        b.status === "Paid"
                          ? "bg-yellow-100 text-gray-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input type="checkbox" className="w-4 h-4" />
                  </td>
                  <td className="py-3 px-4 text-center text-blue-600 font-medium cursor-pointer">
                    Edit
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    
  );
}

export default Dashboard;
