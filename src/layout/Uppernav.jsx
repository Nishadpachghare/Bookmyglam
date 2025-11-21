import React, { useState, useRef, useEffect } from "react";
import { MdUpload, MdSettings } from "react-icons/md";
import ProfileDropdown from "../components/ProfileDropdown";

function Uppernav() {
  const [selected, setSelected] = useState("Today");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="w-full pt-5 pb-5 pl-80 border-gray-200 relative">
      <div className="flex justify-between items-center">
        {/* Left Side - Title + Dropdown */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-black">
            {selected}'s snapshot
          </h1>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This year </option>
          </select>
        </div>

        <button className="flex items-center text-black font-medium text-xl pr-80 rounded-lg">
          Export to Excel
          <MdUpload className="ml-2 w-5 h-5" />
        </button>

        {/* <div className="flex items-center gap-6" ref={containerRef}>
          <button className="p-2 rounded-full hover:bg-gray-100 transition">
            <MdSettings className="text-2xl text-gray-700" />
          </button> */}

        <div className="relative flex items-center space-x-2 cursor-pointer pr-5">
          <img
            src="/Admin _pic.png"
            alt="Admin"
            className="w-10 h-10 rounded-full"
            onClick={() => setOpen((v) => !v)}
          />
          <span className="hidden sm:block font-medium text-gray-800 ">
            Admin
          </span>

          {open && <ProfileDropdown onClose={() => setOpen(false)} />}
        </div>
      </div>
    </div>
    // </div>
  );
}

export default Uppernav;
