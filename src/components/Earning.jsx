import React, { useState, useEffect, useMemo, useContext } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
import axios from "axios";
import { toast } from "react-hot-toast";
import { ExportContext } from "../layout/ExportContext";
import { filterByDate } from "../layout/dateFilterUtils";

function Earning() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openYears, setOpenYears] = useState({});
  const [sortOrder, setSortOrder] = useState("asc");

  // UI-only states from user's design
  const [selectedEarning, setSelectedEarning] = useState([]);
  const [showSortOptions, setShowSortOptions] = useState(false);

  const { setExportData, filterType, filterValue, setAvailableYears } =
    useContext(ExportContext);

  /* ================= FETCH BOOKINGS ================= */
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/bookings");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.bookings || [];

        setBookings(data);

        const currentYear = new Date().getFullYear();
        const years = [
          ...new Set(data.map((b) => new Date(b.date).getFullYear())),
        ];

        const open = {};
        years.forEach((y) => (open[y] = y === currentYear));
        setOpenYears(open);
      } catch (err) {
        console.error(err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  /* ================= YEARS ================= */
  // All available years (for dropdown) come from full bookings
  const years = useMemo(() => {
    return [
      ...new Set(
        (bookings || [])
          .map((b) => new Date(b.date))
          .filter((d) => !isNaN(d))
          .map((d) => d.getFullYear())
      ),
    ].sort();
  }, [bookings]);

  useEffect(() => {
    setAvailableYears(years);
  }, [years, setAvailableYears]);

  // Determine the bookings to display after applying global filter
  const displayedBookings = useMemo(() => {
    return filterByDate(bookings || [], "date", filterType, filterValue);
  }, [bookings, filterType, filterValue]);

  /* ================= MONTHLY AGG ================= */
  const monthlyData = useMemo(() => {
    const result = {};
    years.forEach((y) => {
      result[y] = MONTHS.map((m, i) => ({
        year: y,
        month: m,
        index: i,
        totalAppointments: 0,
        totalAmount: 0,
        paid: 0,
        notPaid: 0,
      }));
    });

    displayedBookings.forEach((b) => {
      if (!b.date) return;
      const d = new Date(b.date);
      if (isNaN(d)) return;

      const y = d.getFullYear();
      const i = d.getMonth();
      if (!result[y]) return;

      const total =
        b.services?.reduce((s, x) => s + Number(x.price || 0), 0) || 0;

      result[y][i].totalAppointments += 1;
      result[y][i].totalAmount += total;

      if ((b.paymentStatus || "").toLowerCase() === "paid")
        result[y][i].paid += total;
      else result[y][i].notPaid += total;
    });

    return result;
  }, [displayedBookings, years]);

  /* ================= SORT + FLATTEN ================= */
  const sortedMonthly = useMemo(() => {
    const arr = [];
    // use display years only
    const displayYears = Object.keys(monthlyData)
      .map((y) => Number(y))
      .sort();
    displayYears.forEach((y) => {
      const m = [...monthlyData[y]];
      m.sort((a, b) =>
        sortOrder === "asc" ? a.index - b.index : b.index - a.index
      );
      arr.push(...m);
    });
    return arr;
  }, [monthlyData, sortOrder]);

  /* ================= FILTER (kept logic unchanged) ================= */
  const filteredMonthly = useMemo(() => {
    if (filterType === "year" && filterValue) {
      return sortedMonthly.filter((m) => m.year.toString() === filterValue);
    }

    if (filterType === "month" && filterValue) {
      const [yStr, mStr] = filterValue.split("-");
      const y = Number(yStr);
      const m = Number(mStr) - 1;
      if (Number.isNaN(y) || Number.isNaN(m)) return [];
      return sortedMonthly.filter((mm) => mm.year === y && mm.index === m);
    }

    if (filterType === "day" && filterValue) {
      const d = new Date(filterValue);
      if (isNaN(d)) return [];
      let totalAppointments = 0;
      let totalAmount = 0;
      let paid = 0;
      let notPaid = 0;

      displayedBookings.forEach((b) => {
        const bd = new Date(b.date);
        if (isNaN(bd)) return;
        if (
          bd.getFullYear() === d.getFullYear() &&
          bd.getMonth() === d.getMonth() &&
          bd.getDate() === d.getDate()
        ) {
          totalAppointments += 1;
          const t =
            b.services?.reduce((s, x) => s + Number(x.price || 0), 0) || 0;
          totalAmount += t;
          if ((b.paymentStatus || "").toLowerCase() === "paid") paid += t;
          else notPaid += t;
        }
      });

      return [
        {
          year: d.getFullYear(),
          month: d.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
          }),
          index: d.getDate(),
          totalAppointments,
          totalAmount,
          paid,
          notPaid,
        },
      ];
    }

    return sortedMonthly;
  }, [sortedMonthly, filterType, filterValue, displayedBookings]);

  // keep the UI behavior: open only selected year when year filter applied
  useEffect(() => {
    if (filterType === "year" && filterValue) {
      setOpenYears((prev) => {
        const newOpen = {};
        Object.keys(prev).forEach((y) => {
          newOpen[y] = y === filterValue; // only selected year is open
        });
        return newOpen;
      });
    }
  }, [filterType, filterValue]);

  /* ================= EXPORT DATA ================= */
  const exportRowsEarning = useMemo(() => {
    return (filteredMonthly || []).map((m) => ({
      Year: m.year,
      Month: m.month,
      Appointments: m.totalAppointments,
      Total: m.totalAmount,
      Paid: m.paid,
      NotPaid: m.notPaid,
    }));
  }, [filteredMonthly]);

  useEffect(() => {
    setExportData(exportRowsEarning);
    // debug: ensure export data is set as expected
    console.log("[Earning] setExportData", {
      length: exportRowsEarning?.length,
      sample: exportRowsEarning?.[0],
    });
  }, [exportRowsEarning, setExportData]);

  const format = (v) => (v ?? 0).toLocaleString("en-IN");

  /* ================= UI (use provided layout, no logic changes) ================= */
  const toggleYear = (year) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const handleDelete = () => {
    if (selectedEarning.length === 0) return;
    toast.info(
      `Delete action clicked for months: ${selectedEarning.join(
        ", "
      )} (frontend only)`
    );
    setSelectedEarning([]);
  };

  const handleSort = (order) => {
    setSortOrder(order);
    setShowSortOptions(false);
  };

  /* ================= UI ================= */
  return (
    <div className="p-10 w-355 pl-80 mx-5 text-gray-800">
      <h1 className="text-3xl font-bold mb-1">Earnings</h1>
      <p className="text-[#D3AF37] mb-6 text-sm">
        View your monthly earnings summary
      </p>

      {/* Controls */}
      <div className="flex gap-4 text-sm my-2 pl-200">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedEarning.length === 0}
        >
          🗑 Delete {selectedEarning.length > 0 && `(${selectedEarning.length})`}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50"
          >
            🔍 Sort {sortOrder === "asc" ? "(Jan-Dec)" : "(Dec-Jan)"}
          </button>
          {showSortOptions && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleSort("asc")}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Jan → Dec
                </button>
                <button
                  onClick={() => handleSort("desc")}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Dec → Jan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-265 rounded-md border border-gray-300 shadow bg-white">
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading earnings...</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#D3AF37] text-black">
                <th className="p-3 border border-gray-300 text-left">Month</th>
                <th className="p-3 border border-gray-300 text-center">
                  Total Appointments
                </th>
                <th className="p-3 border border-gray-300 text-center">
                  Total Amount
                </th>
                <th className="p-3 border border-gray-300 text-center">
                  Paid Amount
                </th>
                <th className="p-3 border border-gray-300 text-center">
                  Not Paid Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {[...new Set(filteredMonthly.map((m) => m.year))].map((year) => (
                <React.Fragment key={year}>
                  {/* Year Header */}
                  <tr
                    onClick={() => toggleYear(year)}
                    className=" font-bold bg-gray-100 hover:bg-gray-200 cursor-pointer border-b border-gray-100 "
                  >
                    <td colSpan={6} className="px-4 py-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-lg text-[#ae8b17]">{year}</span>
                        <button className=" text-[11px] text-[#ae8b17]">
                          {openYears[year] ? "▲" : "▼"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Monthly Rows */}
                  {openYears[year] &&
                    filteredMonthly
                      .filter((m) => m.year === year)
                      .map((item) => (
                        <tr
                          key={`${item.year}-${item.month}`}
                          className="bg-white hover:bg-gray-100"
                        >
                          <td className="p-2">{item.month}</td>
                          <td className="p-2 text-center">
                            {item.totalAppointments}
                          </td>
                          <td className="p-2 text-center">
                            ₹{format(item.totalAmount)}
                          </td>
                          <td className="p-2 text-center">
                            ₹{format(item.paid)}
                          </td>
                          <td className="p-2 text-center">
                            ₹{format(item.notPaid)}
                          </td>
                        </tr>
                      ))}

                  {/* Yearly Total */}
                  <tr className=" font-bold text-[#ae8b17] bg-gray-100 hover:bg-gray-200 border-b border-gray-300">
                    <td className="p-2">Total of {year}</td>
                    <td className="p-2 text-center">
                      {filteredMonthly
                        .filter((m) => m.year === year)
                        .reduce((acc, m) => acc + m.totalAppointments, 0)}
                    </td>
                    <td className="p-2 text-center">
                      ₹
                      {format(
                        filteredMonthly
                          .filter((m) => m.year === year)
                          .reduce((acc, m) => acc + m.totalAmount, 0)
                      )}
                    </td>
                    <td className="p-2 text-center">
                      ₹
                      {format(
                        filteredMonthly
                          .filter((m) => m.year === year)
                          .reduce((acc, m) => acc + m.paid, 0)
                      )}
                    </td>
                    <td className="p-2 text-center">
                      ₹
                      {format(
                        filteredMonthly
                          .filter((m) => m.year === year)
                          .reduce((acc, m) => acc + m.notPaid, 0)
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}

              {/* Grand Total */}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Earning;
