import React from "react";

const Pending = () => {
  const pendingData = [
    {
      customer: "Clara Bennett",
      phone: "555-123-4567",
      stylist: "Emily",
      date: "10:00 AM, July 26",
      service: "Haircut & Style",
      amount: "$100",
      status: "pending",
    },
    {
      customer: "Owen Harper",
      phone: "555-987-6543",
      stylist: "Olivia",
      date: "11:30 AM, July 26",
      service: "Manicure",
      amount: "$50",
      status: "pending",
    },
    {
      customer: "Ava Mitchell",
      phone: "555-246-8013",
      stylist: "Ethan",
      date: "1:00 PM, July 26",
      service: "Facial",
      amount: "$80",
      status: "pending",
    },
    {
      customer: "Lucas Foster",
      phone: "555-135-7911",
      stylist: "Ava",
      date: "2:30 PM, July 26",
      service: "Massage",
      amount: "$70",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen pl-55 bg-gray-50 flex flex-col items-center py-10 px-4  shadow-xl">
      {/* Header */}
      <div className="w-full max-w-5xl mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pending amount</h2>
        <p className="text-[#D3AF37] text-sm mt-1">
          View your Pending amount summary
        </p>
      </div>
      {/* Action Buttons */}
      <div className="flex gap-4 w-285 text-sm my-5 pl-236 m-2">
        <button className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50">
          🗑 Delete
        </button>
        <button className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50">
          🔍 Filters
        </button>
      </div>
      {/* Table */}
      <div className="bg-white w-full max-w-6xl rounded-lg shadow border overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#D3AF37] text-black">
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Phone No</th>
              <th className="p-3 text-left">Stylist</th>
              <th className="p-3 text-left">Date and Time</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {pendingData.map((item, index) => (
              <tr
                key={index}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-3 py-5">{item.customer}</td>
                <td className="p-3 py-5">{item.phone}</td>
                <td className="p-3 py-5">{item.stylist}</td>
                <td className="p-3 py-5">{item.date}</td>
                <td className="p-3 py-5 ">{item.service}</td>
                <td className="p-3 py-5">{item.amount}</td>
                <td className="p-3">
                  <span className="bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full border border-yellow-200">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pending;
