import React, { useState, useRef, useEffect, useContext } from "react";

import { MdUpload } from "react-icons/md";
import { ExportContext } from "../layout/ExportContext";

function Uppernav() {
  const filterRef = useRef(null);

  // FILTER STATES
  const [activeFilter, setActiveFilter] = useState("all"); // all | day | month | year
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const { handleExport, setFilterType, setFilterValue, availableYears } =
    useContext(ExportContext);

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  /* ================= APPLY FILTER ================= */
  useEffect(() => {
    if (activeFilter === "all") {
      setFilterType("all");
      setFilterValue(null);
    }

    if (activeFilter === "day" && selectedDay) {
      setFilterType("day");
      setFilterValue(selectedDay);
    }

    if (activeFilter === "month" && selectedMonth && selectedYear) {
      setFilterType("month");
      setFilterValue(`${selectedYear}-${selectedMonth}`);
    }

    if (activeFilter === "year" && selectedYear) {
      setFilterType("year");
      setFilterValue(selectedYear);
    }
  }, [
    activeFilter,
    selectedMonth,
    selectedYear,
    selectedDay,
    setFilterType,
    setFilterValue,
  ]);

  /* =============== CLOSE ON OUTSIDE CLICK =============== */
  useEffect(() => {
    const handleOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /* ================= BUTTON HANDLERS ================= */
  const handleAll = () => {
    setActiveFilter("all");
    setDropdownOpen(false);
  };

  const handleDay = () => {
    setActiveFilter("day");
    if (!selectedDay) {
      setSelectedDay(new Date().toISOString().slice(0, 10));
    }
    setDropdownOpen(true);
  };

  const handleMonth = () => {
    setActiveFilter("month");
    if (!selectedYear && availableYears?.length) {
      setSelectedYear(availableYears[0]);
    }
    setDropdownOpen(true);
  };

  const handleYear = () => {
    setActiveFilter("year");
    if (!selectedYear && availableYears?.length) {
      setSelectedYear(availableYears[0]);
    }
    setDropdownOpen(true);
  };

  /* ================= TITLE ================= */
  const getTitle = () => {
    if (activeFilter === "all") return "All Time Overview";

    if (activeFilter === "day" && selectedDay) {
      const d = new Date(selectedDay);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    if (activeFilter === "month" && selectedMonth && selectedYear) {
      const m = months.find((x) => x.value === selectedMonth);
      return `${m?.label} ${selectedYear}`;
    }

    if (activeFilter === "year" && selectedYear) {
      return `${selectedYear} Overview`;
    }

    return "Dashboard Overview";
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40">
      <div className="flex justify-between items-center">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-800 min-w-[220px]">
            {getTitle()}
          </h1>

          <div className="flex items-center gap-2 relative" ref={filterRef}>
            <button
              onClick={handleAll}
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
            >
              All
            </button>

            <button
              onClick={handleDay}
              className={`filter-btn ${activeFilter === "day" ? "active" : ""}`}
            >
              Day
            </button>

            <button
              onClick={handleMonth}
              className={`filter-btn ${
                activeFilter === "month" ? "active" : ""
              }`}
            >
              Month
            </button>

            <button
              onClick={handleYear}
              className={`filter-btn ${
                activeFilter === "year" ? "active" : ""
              }`}
            >
              Year
            </button>

            {/* DROPDOWN PANEL */}
            {dropdownOpen && activeFilter !== "all" && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-2">
                {activeFilter === "day" && (
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 text-sm"
                  />
                )}

                {activeFilter === "month" && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="">Select Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                )}

                {(activeFilter === "month" || activeFilter === "year") && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="">Select Year</option>
                    {availableYears?.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#d6b740] text-black px-5 py-2 rounded-lg font-medium shadow hover:bg-[#c5a634] transition"
        >
          Export Excel
          <MdUpload className="w-5 h-5" />
        </button>
      </div>

      {/* LOCAL STYLES */}
      <style>
        {`
          .filter-btn {
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 14px;
            background: #f3f4f6;
            color: #374151;
            transition: all 0.2s ease;
          }
          .filter-btn:hover {
            background: #e5e7eb;
          }
          .filter-btn.active {
            background: #d6b740;
            color: #000;
            font-weight: 500;
          }
        `}
      </style>
    </div>
  );
}

export default Uppernav;
