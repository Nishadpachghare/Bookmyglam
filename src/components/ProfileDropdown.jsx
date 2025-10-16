import React from "react";
import { FiEdit2, FiLogOut, FiSave, FiX } from "react-icons/fi";

export default function ProfileDropdown({ onClose }) {
  return (
    <div className="absolute top-12 right-0 mt-2 w-85 bg-white rounded-3xl border  shadow-lg p-6 z-50  m-8">
      
        <FiX size={28} onClick={onClose}
        className="absolute top-4 right-4 text-gray hover:text-black"
        aria-label="Close profile" />
     

      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <img
            src="/Admin _pic.png"
            alt="profile"
            className="w-20 h-20 rounded-full border-2 border-gray-300"
          />
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow cursor-pointer">
            <FiEdit2 className="text-gray-700" size={14} />
          </div>
        </div>
        <h2 className="text-lg font-semibold mt-3">Hi, <span className="text-gray-700">Shraddha!</span></h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-500">Name</label>
          <input
            type="text"
            defaultValue=""
            className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500">E-mail</label>
          <input
            type="email"
            defaultValue=""
            className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500">Phone no.</label>
          <input
            type="text"
            defaultValue=""
            className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500">Country</label>
          <input
            type="text"
            defaultValue=""
            className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button className="flex items-center gap-2 bg-[#d6b740] text-black px-4 py-2 rounded-md shadow hover:bg-yellow-500">
          <FiSave /> Save
        </button>
        <button className="flex items-center gap-2 bg-white border px-4 py-2 rounded-md shadow hover:bg-gray-100">
          <FiEdit2 /> Edit
        </button>
      </div>

      <div className="flex justify-center mt-6">
        <button className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium">
          <FiLogOut /> Log out
        </button>
      </div>
    </div>
  );
}
