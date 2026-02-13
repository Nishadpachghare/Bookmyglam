import React from "react";
import { NavLink } from "react-router-dom";
import { GoHome } from "react-icons/go";
import { PiCalendarBlank } from "react-icons/pi";
import {
  MdOutlineInventory,
  MdOutlinePendingActions,
  MdOutlineAddBox,
} from "react-icons/md";
import { BsPeople, BsImage } from "react-icons/bs";
import { LuScissors, LuWallet } from "react-icons/lu";
import { SlUserFemale } from "react-icons/sl";
import { IoAnalyticsOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";

function Sidenav() {
  // Common styles for NavLinks
  const navLinkClasses = ({ isActive }) =>
    `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border-l-4 ${
      isActive
        ? "bg-purple-900/30 border-purple-900 text-purple-500"
        : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
    }`;

  return (
    <div className="w-66 bg-[#09090b] h-screen fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-800 shadow-2xl">
      {/* Custom Scrollbar Logic */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>

      {/* Brand Logo Area */}
      <div className="p-6 flex flex-col items-center">
        <div className="bg-zinc-800/50 p-2 rounded-2xl mb-2 border border-zinc-600">
          <img
            src="./SBMS-LOGO-2.png"
            alt="Logo"
            className="w-28 h-auto object-contain"
          />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
          Admin Panel
        </p>
      </div>

      {/* Navigation Scrollable Area */}
      <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-6">
        {/* Section: Main */}
        <div className="mb-6">
          <p className="px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          <ul className="space-y-1">
            <NavItem
              to="/dashboard"
              icon={<GoHome size={22} />}
              label="Dashboard"
              className={navLinkClasses}
            />
            <NavItem
              to="/booking"
              icon={<PiCalendarBlank size={22} />}
              label="Booking"
              className={navLinkClasses}
            />
            <NavItem
              to="/inventory"
              icon={<MdOutlineInventory size={22} />}
              label="Inventory"
              className={navLinkClasses}
            />
          </ul>
        </div>

        {/* Section: Management */}
        <div className="mb-6">
          <p className="px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Management
          </p>
          <ul className="space-y-1">
            <NavItem
              to="/attendance"
              icon={<BsPeople size={22} />}
              label="Attendance"
              className={navLinkClasses}
            />
            <NavItem
              to="/managestyle"
              icon={<LuScissors size={22} />}
              label="Manage Style"
              className={navLinkClasses}
            />
            <NavItem
              to="/manageservice"
              icon={<SlUserFemale size={22} />}
              label="Manage Service"
              className={navLinkClasses}
            />
          </ul>
        </div>

        {/* Section: Finance & Analytics */}
        <div className="mb-6">
          <p className="px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Operations
          </p>
          <ul className="space-y-1">
            <NavItem
              to="/earning"
              icon={<LuWallet size={22} />}
              label="View Earning"
              className={navLinkClasses}
            />
            <NavItem
              to="/pending"
              icon={<MdOutlinePendingActions size={22} />}
              label="Pending Amount"
              className={navLinkClasses}
            />
            <NavItem
              to="/offersandcoupons"
              icon={<MdOutlinePendingActions size={22} />}
              label="Offers & Coupons"
              className={navLinkClasses}
            />
            <NavItem
              to="/addexpense"
              icon={<MdOutlineAddBox size={22} />}
              label="Add Expenses"
              className={navLinkClasses}
            />
            <NavItem
              to="/summary"
              icon={<IoAnalyticsOutline size={22} />}
              label="Summary"
              className={navLinkClasses}
            />
            <NavItem
              to="/uploadimg"
              icon={<BsImage size={20} />}
              label="Gallery"
              className={navLinkClasses}
            />
          </ul>
        </div>
      </nav>

      {/* Logout Area - Fixed at bottom */}
      <div className="p-4 border-t border-zinc-800 bg-[#09090b]">
        <NavLink
          to="/r"
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </NavLink>
      </div>
    </div>
  );
}

// Helper component to keep code clean
function NavItem({ to, icon, label, className }) {
  return (
    <li>
      <NavLink to={to} className={className}>
        <span className="min-w-[30px]">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </NavLink>
    </li>
  );
}

export default Sidenav;
