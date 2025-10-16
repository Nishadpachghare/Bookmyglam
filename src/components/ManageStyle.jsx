import React from "react";
import { FiSearch } from "react-icons/fi";

function ManageStyle() {
  const stylists = [
    { name: "Sophia Bennett", phone: "(555) 123-4567", status: "Active" },
    { name: "Ethan Carter", phone: "(555) 987-6543", status: "Active" },
    { name: "Olivia Davis", phone: "(555) 246-8013", status: "Inactive" },
    { name: "Liam Foster", phone: "(555) 369-1215", status: "Active" },
    { name: "Ava Green", phone: "(555) 789-0123", status: "Active" },
  ];

  return (
    <div className="p-10 bg-gray-50 min-h-screen  pl-80 shadow-xl">
    
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Manage Stylists
      </h1>

      <div className="flex items-center bg-[#F5F0E6] rounded-md px-4 py-3 w-full max-w-5xl">
        <FiSearch className="text-gray-500 text-xl" />
        <input
          type="text"
          placeholder="Search stylists"
          className="bg-transparent outline-none ml-3 w-full text-gray-700"
        />
      </div>

     
      <div className="flex gap-8 mt-6 pb-2 text-lg font-medium">
        <button className="text-[#D3AF37]  border-b- #D3AF37 pb-1">
          All Stylists
        </button>
        <button className="text-gray-500 hover:text-[#D3AF37] pb-1">
          Active Stylists
        </button>
      </div>

 {/* Action Buttons */}
        <div className="flex gap-4 w-280 text-sm my-5 pl-228 m-2">
          <button className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50">
            🗑 Delete
          </button>
          <button className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50">
            🔍 Filters
          </button>
        </div>

      <div className="mt-6 bg-white rounded-lg border border-gray-300 overflow-hidden w-280 p-5">
        <table className="w-310 text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-6 text-gray-700 font-semibold">Stylist Name</th>
              <th className="py-3 px-6 text-gray-700 font-semibold">Phone Number</th>
              <th className="py-3 px-6 text-gray-700 font-semibold">Status</th>
              <th className="py-3 px-6 text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stylists.map((stylist, index) => (
              <tr
                key={index}
                className="border-b last:border-none hover:bg-gray-50 transition"
              >
                <td className="py-3 px-6">{stylist.name}</td>
                <td className="py-3 px-6">{stylist.phone}</td>
                <td className="py-3 px-6">
                  <span
                    className={`px-4 py-1 rounded-full text-sm ${
                      stylist.status === "Active"
                        ? "bg-[#F5F0E6] text-[#D3AF37]"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {stylist.status}
                  </span>
                </td>
                <td className="py-3 px-6 font-medium">
                  Manage Styles
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Button */}
      <div className="mt-6 flex justify-end w-270 ">
        <button className="bg-[#D3AF37] text-white px-5 py-2 rounded-md hover:bg-[#b6912f] transition">
          Add New Stylist
        </button>
      </div>
    </div>
  );
}

export default ManageStyle;
