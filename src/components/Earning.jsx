import React from "react";

function Earning() {
  const data = [
    { month: "January", totalAppointments: 150, totalAmount: "12,500", paid: "10,000", notPaid: "2,500" },
    { month: "February", totalAppointments: 135, totalAmount: "11,200", paid: "9,500", notPaid: "1,700" },
    { month: "March", totalAppointments: 160, totalAmount: "13,800", paid: "12,000", notPaid: "1,800" },
    { month: "April", totalAppointments: 145, totalAmount: "12,000", paid: "10,500", notPaid: "1,500" },
    { month: "May", totalAppointments: 170, totalAmount: "14,500", paid: "13,000", notPaid: "1,500" },
    { month: "June", totalAppointments: 155, totalAmount: "13,200", paid: "11,800", notPaid: "1,400" },
    { month: "July", totalAppointments: 165, totalAmount: "14,000", paid: "12,500", notPaid: "1,500" },
    { month: "August", totalAppointments: 175, totalAmount: "15,000", paid: "13,500", notPaid: "1,500" },
    { month: "September", totalAppointments: 160, totalAmount: "13,500", paid: "12,000", notPaid: "1,500" },
    { month: "October", totalAppointments: 180, totalAmount: "15,500", paid: "14,000", notPaid: "1,500" },
    { month: "November", totalAppointments: 165, totalAmount: "14,200", paid: "12,800", notPaid: "1,400" },
    { month: "December", totalAppointments: 165, totalAmount: "14,200", paid: "12,800", notPaid: "1,400" },
  ];

  return (
    <div className="p-10 w-300 pl-50 mx-auto text-gray-800 shadow-xl">
      <h1 className="text-3xl font-bold mb-1">Earnings</h1>
      <p className="text-[#D3AF37] mb-6 text-sm">View your monthly earnings summary</p>

       {/* Action Buttons */}
        <div className="flex gap-4 w-280 text-sm my-5 pl-200 m-2">
          <button className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50">
            🗑 Delete
          </button>
          <button className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50">
            🔍 Filters
          </button>
        </div>

      <div className="overflow-x-auto w-265 rounded-md border border-gray-300 shadow">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#D3AF37] text-black">
              <th className="p-4 border border-gray-300">Months</th>
              <th className="p-3 border border-gray-300">Total Appointments</th>
              <th className="p-3 border border-gray-300">Total Amount</th>
              <th className="p-3 border border-gray-300">Paid Amount</th>
              <th className="p-3 border border-gray-300">Not Paid Amount</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="even:bg-gray-50 hover:bg-gray-100">
                <td className="p-6 border border-gray-200">{item.month}</td>
                <td className="p-5 border border-gray-200">{item.totalAppointments}</td>
                <td className="p-5 border border-gray-200">{item.totalAmount}</td>
                <td className="p-5 border border-gray-200">{item.paid}</td>
                <td className="p-5 border border-gray-200">{item.notPaid}</td>
              </tr>
            ))}

            <tr className="bg-gray-100 font-semibold ">
              <td className="p-3 border border-gray-300">Total (Yearly)</td>
              <td className="p-3 border border-gray-300">190</td>
              <td className="p-3 border border-gray-300">16,8000</td>
              <td className="p-3 border border-gray-300">15,0000</td>
              <td className="p-3 border border-gray-300">1,800</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Earning;