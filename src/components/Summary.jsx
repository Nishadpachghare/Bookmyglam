import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Summary() {
  const data = [
    { name: "Jan", value: 6561 },
    { name: "Feb", value: 3060 },
    { name: "Mar", value: 3000 },
    { name: "Apr", value: 6000 },
    { name: "May", value: 3000 },
    { name: "Jun", value: 9000 },
    { name: "Jul", value: 1800 },
    { name: "Aug", value: 8000 },
    { name: "Sep", value: 4200 },
    { name: "Oct", value: 8800 },
    { name: "Nov", value: 5300 },
    { name: "Dec", value: 10000 },
  ];

  return (
    <div className="p-6 space-y-6 w-350 pl-80">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-800">
        Summary (Master Report)
      </h1>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-xl shadow-md">
        <h2 className="text-sm text-gray-500 mb-2">
          Total Revenue vs Total Expenses (Profit/Loss)
        </h2>
        <p className="text-3xl font-bold text-gray-800">₹15,000</p>
        <p className="text-green-600 text-sm mb-4">This Month +45%</p>

        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#a3a3a3", fontSize: 12 }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#d4af37"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#D3AF37] text-black rounded-xl p-5 text-center shadow">
          <p className="text-sm">Total Appointments</p>
          <p className="text-3xl font-bold">250</p>
        </div>

        <div className="bg-white rounded-xl p-5 text-center shadow">
          <p className="text-sm text-gray-500">Client Retention Rate</p>
          <p className="text-3xl font-bold text-gray-800">85%</p>
        </div>

        <div className="bg-white rounded-xl p-5 text-center shadow">
          <p className="text-sm text-gray-500">Avg. Stylist Rating</p>
          <p className="text-3xl font-bold text-gray-800">4.8</p>
        </div>
      </div>
    </div>
  );
}
