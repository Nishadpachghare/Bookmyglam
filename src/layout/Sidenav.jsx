import React from "react";
import { GoHomeFill } from "react-icons/go";
import { PiCalendarFill } from "react-icons/pi";
import { MdOutlineInventory, MdOutlinePendingActions, MdAddBox } from "react-icons/md";
import { BsPeople, BsImageFill } from "react-icons/bs";
import { LuScissors, LuWallet } from "react-icons/lu";
import { SlUserFemale } from "react-icons/sl";
import { IoAnalyticsOutline } from "react-icons/io5";
import { NavLink } from "react-router-dom";

function Sidenav() { 
  return (
    <div className="w-64 bg-white fixed inset-0 z-50  overflow-auto shadow-2xl top-0 left-0 flex flex-col">
      {/* Logo */}
      <div className="flex justify-center items-center  border-b">
        <img src="./SBMS_LOGO.png" alt="Logo" className="w-32 h-22 pb-2" />
      </div>

      {/* Menu Items */}
      <ul className="flex flex-col mt-6 text-gray-700 text-base font-medium gap-5">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <GoHomeFill className="h-8 w-10 pl-3"/> Dashboard
          </NavLink>
        </li>

        <li>
          <NavLink to="/booking" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <PiCalendarFill className="h-8 w-10 pl-3"/> Booking
          </NavLink>
        </li>

        <li className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black">
          <MdOutlineInventory className="h-8 w-10 pl-3"/> Inventory
        </li>

        <li className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black">
          <BsPeople className="h-8 w-10 pl-3"/> Attendance
        </li>

        <li>
          <NavLink to="/managestyle" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <LuScissors className="h-8 w-10 pl-3" /> Manage Style
          </NavLink>
        </li>

        <li>
          <NavLink to="/manageservice" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <SlUserFemale className="h-8 w-10 pl-3"/> Manage Service
          </NavLink>
        </li>

        <li>
          <NavLink to="/earning" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <LuWallet className="h-8 w-10 pl-3" /> View Earning
          </NavLink>
        </li>

        <li>
          <NavLink to="/pending" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <MdOutlinePendingActions className="h-8 w-10 pl-3"/> Pending Amount
          </NavLink>
        </li>

        <li>
          <NavLink to="/addexpense" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <MdAddBox className="h-8 w-10 pl-3"/> Add Expenses
          </NavLink>
        </li>

        <li>
          <NavLink to="/summary" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <IoAnalyticsOutline className="h-8 w-10 pl-3"/> Summary
          </NavLink>
        </li>

        <li>
          <NavLink to="/uploadimg" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[#D3AF37] hover:text-black ${isActive ? 'bg-[#D3AF37] text-black' : ''}`}>
            <BsImageFill className="h-8 w-10 pl-3"/> Upload Gallery
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidenav;