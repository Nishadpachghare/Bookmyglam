import React from "react";
import { useNavigate } from "react-router-dom";

function ManageStyle1() {
  const navigate = useNavigate();
  return (  <> 
  <div className="flex gap-8 mt-6 pb-2 pl-100 text-lg font-medium shadow-xl">
        <button 
          onClick={() => navigate('/managestyle')}
          className="text-gray-500 hover:text-[#D3AF37] pb-1"
        >
          All Stylists
        </button>


        <button 
        
          className="text-[#D3AF37] border-b- #D3AF37 pb-1"
        >
          Active Stylists
        </button>
       
      </div>
    
    <div className="p-10 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Add New Stylist</h1>

      <form className="space-y-6">
        {/* Stylist Name */}
        <div>
          <label className="block font-medium mb-1">Stylist Name</label>
          <input
            type="text"
            placeholder="Enter stylist's full name"
            className="w-full border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#D3AF37] "
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block font-medium mb-1">Phone Number</label>
          <input
            type="text"
            placeholder="Enter stylist's phone number"
            className="w-full border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#D3AF37]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter stylist's email address"
            className="w-full border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#D3AF37]"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block font-medium mb-1">Role</label>
          <input
            type="text"
            placeholder="Select stylist's role"
            className="w-full border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#D3AF37]"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Upload Stylist Photo</label>
          <div className="flex gap-3">
            <input
              type="file"
              className="border border-gray-200 p-3 rounded-md w-full text-gray-500"
            />
            <button
              type="button"
              className="bg-[#D3AF37] text-white px-4 py-2 rounded-md hover:bg-[#c7a433]"
            >
              Upload
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mt-6 mb-2">Initial Shifts</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Start Time</label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#D3AF37]"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Time</label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#D3AF37]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={() => navigate('/managestyle')}
            className="border border-gray-300 bg-gray-50 px-5 py-2 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#D3AF37] text-white px-5 py-2 rounded-md hover:bg-[#c5a230]"
          >
            Save Stylist
          </button>
        </div>
      </form>
    </div> </> 
  );
}

export default ManageStyle1;