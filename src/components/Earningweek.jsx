import React from "react";

function Earningweek() {
  const data = [
    {
      month: "week1,May",
      totalAppointments: 25,
      totalAmount: "12,500",
      paid: "10,000",
      notPaid: "2,500",
    },
    {
      month: "Week2,May",
      totalAppointments: 33,
      totalAmount: "11,200",
      paid: "9,500",
      notPaid: "1,700",
    },
    {
      month: "Week3,May",
      totalAppointments: 36,
      totalAmount: "13,800",
      paid: "12,000",
      notPaid: "1,800",
    },
    {
      month: "Week4,May",
      totalAppointments: 25,
      totalAmount: "12,000",
      paid: "10,500",
      notPaid: "1,500",
    },
    {
      month: "Week5,May",
      totalAppointments: 25,
      totalAmount: "14,500",
      paid: "13,000",
      notPaid: "1,500",
    },
  ];

  return (
    <div className="p-10 w-300 pl-50 mx-auto text-gray-800 shadow-xl">
      <h1 className="text-3xl font-bold mb-1">Earnings</h1>
      <p className="text-[#D3AF37] mb-6 text-sm">
        View your weekly earnings summary
      </p>

      <div className="overflow-x-auto w-265 rounded-md border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#D3AF37] text-black">
              <th className="p-3 border border-gray-300">Weeks</th>
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
                <td className="p-5 border border-gray-200">{item.notPaid}</td>
                <td className="p-5 border border-gray-200">
                  {item.totalAppointments}
                </td>
                <td className="p-5 border border-gray-200">
                  {item.totalAmount}
                </td>
                <td className="p-5 border border-gray-200">{item.paid}</td>
              </tr>
            ))}

            <tr className="bg-gray-100 font-semibold ">
              <td className="p-3 border border-gray-300">Total (Yearly)</td>
              <td className="p-3 border border-gray-300">90</td>
              <td className="p-3 border border-gray-300">16,800</td>
              <td className="p-3 border border-gray-300">15,0000</td>
              <td className="p-3 border border-gray-300">1,800</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Earningweek;
