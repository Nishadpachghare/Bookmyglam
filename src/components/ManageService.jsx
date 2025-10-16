import React, { useState } from "react";

const ManageService = () => {
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [services, setServices] = useState([
    { service: "Haircut & Style", description: "Clara Bennett", date: "10:00 AM, July 26", amount: "$100" },
    { service: "Manicure", description: "Owen Harper", date: "11:30 AM, July 26", amount: "$50" },
    { service: "Facial", description: "Ava Mitchell", date: "1:00 PM, July 26", amount: "$80" },
    { service: "Massage", description: "Lucas Foster", date: "2:30 PM, July 26", amount: "$70" },
  ]);

  const addService = () => {
    if (!service || !description || !duration || !price) return;
    setServices([
      ...services,
      { service, description, date: "Custom", amount: `₹${price}` },
    ]);
    setService("");
    setDescription("");
    setDuration("");
    setPrice("");
  };

  return (
    <div className="min-h-screen w-full  bg-gray-50 flex flex-col items-center pl-55 py-10 px-4 shadow-xl">
      {/* Manage Service */}
      <div className="bg-white p-6 shadow-xl rounded-lg border h-120 w-100 ">
        <h2 className="text-center text-3xl font-semibold mb-4">Manage Service</h2>
        <input
          type="text"
          placeholder="Select Service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full border p-5 mb-3 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-5 mb-3 rounded h-20"
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full border p-5 mb-3 rounded"
        />
        <input
          type="number"
          placeholder="Price (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-5 mb-4 rounded"
        />
        <button
          onClick={addService}
          className="w-full bg-[#D3AF37] py-3 rounded text-black font-medium hover:bg-[#D3AF37]"
        >
          Add Service
        </button>
      </div>

      {/* All Services */}
      <div className="bg-white w-260 mt-10 p-6 rounded-lg shadow-xl border">
        <h2 className="text-center text-3xl font-semibold mb-4">All Service</h2>
         {/* Action Buttons */}
        <div className="flex gap-4 w-280 text-sm my-5 pl-197 m-2">
          <button className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50">
            🗑 Delete
          </button>
          <button className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50">
            🔍 Filters
          </button>
        </div>
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              
              <th className="border p-2 text-left">Service</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Date & Time</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2">Work Done</th>
              <th className="border p-2">Edit</th>
            
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={i}>
                <td className="border py-5 p-2">{s.service}</td>
                <td className="border py-5 p-2">{s.description}</td>
                <td className="border py-5 p-2">{s.date}</td>
                <td className="border py-5 p-2">{s.amount}</td>
                <td className="border py-5 p-2 text-center">
                  <input type="checkbox" />
                </td>
                <td className="border p-2 text-center cursor-pointer">
                  Edit
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageService;