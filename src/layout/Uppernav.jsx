import React, { useState, useRef, useEffect, useContext } from "react";
import { FiDownload, FiCalendar } from "react-icons/fi";
import { ExportContext } from "../layout/ExportContext";

function Uppernav() {
  const filterRef = useRef(null);

  // FILTER STATES
  const [activeFilter, setActiveFilter] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const { handleExport, setFilterType, setFilterValue, availableYears } =
    useContext(ExportContext);

  const months = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];

  useEffect(() => {
    if (activeFilter === "all") {
      setFilterType("all");
      setFilterValue(null);
    } else if (activeFilter === "day" && selectedDay) {
      setFilterType("day");
      setFilterValue(selectedDay);
    } else if (activeFilter === "month" && selectedMonth && selectedYear) {
      setFilterType("month");
      setFilterValue(`${selectedYear}-${selectedMonth}`);
    } else if (activeFilter === "year" && selectedYear) {
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

  useEffect(() => {
    const handleOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const getTitle = () => {
    if (activeFilter === "all") return "All Time Overview";
    if (activeFilter === "day" && selectedDay) {
      return new Date(selectedDay).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    if (activeFilter === "month" && selectedMonth && selectedYear) {
      const m = months.find((x) => x.value === selectedMonth);
      return `${m?.label} ${selectedYear}`;
    }
    if (activeFilter === "year" && selectedYear)
      return `${selectedYear} Overview`;
    return "Dashboard Overview";
  };

  // Button Style Generator
  const getBtnClass = (filter) => {
    const isActive = activeFilter === filter;
    return `px-5 py-2 text-sm font-bold transition-all duration-300 rounded-lg flex items-center gap-2 ${
      isActive
        ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
    }`;
  };

  return (
    <div className="w-full bg-[#09090b] border-b border-zinc-800 px-8 py-4  pl-72 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="flex justify-between items-center mx-auto">
        {/* LEFT SECTION: Title */}
        <div className="min-w-[250px]">
          <h1 className="text-xl font-bold text-white tracking-tight leading-none">
            {getTitle()}
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mt-1">
            Status: Active
          </p>
        </div>

        {/* CENTER SECTION: Multi-Section Filter */}
        <div
          className="flex items-center bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 relative"
          ref={filterRef}
        >
          <button
            onClick={() => {
              setActiveFilter("all");
              setDropdownOpen(false);
            }}
            className={getBtnClass("all")}
          >
            All
          </button>

          <div className="h-6 w-[1px] bg-zinc-800 mx-1" />

          {/* Day Section */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveFilter("day");
                setDropdownOpen(true);
              }}
              className={getBtnClass("day")}
            >
              Day
            </button>
            {dropdownOpen && activeFilter === "day" && (
              <div className="absolute top-full mt-3 left-0 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="bg-black text-white border border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>

          {/* Month Section */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveFilter("month");
                setDropdownOpen(true);
              }}
              className={getBtnClass("month")}
            >
              Month
            </button>
            {dropdownOpen && activeFilter === "month" && (
              <div className="absolute top-full mt-3 left-0 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl w-64 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="col-span-2 bg-black text-white border border-zinc-700 rounded-lg p-2 text-xs outline-none mb-2"
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="col-span-2 bg-black text-white border border-zinc-700 rounded-lg p-2 text-xs outline-none"
                >
                  <option value="">Year</option>
                  {availableYears?.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Year Section */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveFilter("year");
                setDropdownOpen(true);
              }}
              className={getBtnClass("year")}
            >
              Year
            </button>
            {dropdownOpen && activeFilter === "year" && (
              <div className="absolute top-full mt-3 left-0 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-black text-white border border-zinc-700 rounded-lg p-2 text-sm outline-none min-w-[120px]"
                >
                  <option value="">Select Year</option>
                  {availableYears?.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: Export */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-purple-400 border border-zinc-800 rounded-xl transition-all duration-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <FiDownload className="size-4 group-hover:bounce" />
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export default Uppernav;
