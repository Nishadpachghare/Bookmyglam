import React, { createContext, useState } from "react";
/* eslint-disable react-refresh/only-export-components */
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";

export const ExportContext = createContext();

export function ExportProvider({ children }) {
  const [exportData, setExportData] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  // Shared bookings so Summary can reflect the same data as Dashboard
  const [bookings, setBookings] = useState([]);

  // Use current location to include page name in exported filename
  const location = useLocation();
  const pathToName = (path) => {
    const map = {
      "/dashboard": "Dashboard",
      "/inventory": "Inventory",
      "/managestyle": "ManageStyle",
      "/managestyle1": "ManageStyle_Add",
      "/earning": "Earnings",
      "/earningweek": "EarningWeek",
      "/manageservice": "ManageService",
      "/pending": "Pending",
      "/addexpense": "Expenses",
      "/summary": "Summary",
      "/booking": "Bookings",
      "/Inactivestylist": "InactiveStylists",
    };
    if (map[path]) return map[path];
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return "Salon_Report";
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("_");
  };

  const handleExport = (fileName) => {
    const generateFileName = () => {
      const base = pathToName(location?.pathname || "");
      let name = base || "Salon_Report";
      if (filterType && filterType !== "all") {
        name += `_${filterType}`;
        if (filterValue) name += `_${filterValue}`;
      }
      return `${name}.xlsx`;
    };

    // If a non-string (e.g., click event) is passed as fileName, ignore it
    if (fileName && typeof fileName !== "string") {
      console.warn("[Export] ignored non-string fileName", fileName);
      fileName = undefined;
    }

    const outFileName = fileName || generateFileName();

    let dataToExport = exportData;

    console.log("[Export] starting", { exportDataLength: exportData?.length });

    try {
      // If exportData is empty, attempt to extract data from the first visible table on the page
      if (
        (!dataToExport || dataToExport.length === 0) &&
        typeof document !== "undefined"
      ) {
        const table = document.querySelector("table");
        if (table) {
          // Prefer the last header row if there are multiple header rows
          let headers = [];
          const headerRows = table.querySelectorAll("thead tr");
          if (headerRows.length > 0) {
            const lastHeader = headerRows[headerRows.length - 1];
            headers = Array.from(lastHeader.querySelectorAll("th")).map((th) =>
              th.innerText.trim()
            );
          } else {
            // Fallback to first row's cells
            const firstRow = table.querySelector("tr");
            if (firstRow) {
              headers = Array.from(firstRow.querySelectorAll("th,td")).map(
                (h, i) => h.innerText.trim() || `Column ${i + 1}`
              );
            }
          }

          // If still no headers, generate generic ones based on first body row
          if (!headers || headers.length === 0) {
            const firstBodyRow = table.querySelector("tbody tr");
            if (firstBodyRow) {
              const count = firstBodyRow.querySelectorAll("td,th").length || 1;
              headers = Array.from({ length: count }).map(
                (_, i) => `Column ${i + 1}`
              );
            }
          }

          const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
          const rows = [];

          bodyRows.forEach((tr) => {
            const cells = Array.from(tr.querySelectorAll("td,th")).map((td) =>
              td.innerText.trim()
            );

            // Skip group header rows that have a single cell with colspan spanning all columns
            if (cells.length === 1) {
              const colspan = tr
                .querySelector("td,th")
                ?.getAttribute("colspan");
              if (colspan && Number(colspan) >= headers.length) return; // skip
            }

            const obj = {};
            headers.forEach((h, i) => {
              obj[h || `Column ${i + 1}`] = cells[i] ?? "";
            });
            rows.push(obj);
          });

          if (rows.length > 0) dataToExport = rows;
        }
      }

      if (!dataToExport || dataToExport.length === 0) {
        toast.error("❌ No data available to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      XLSX.writeFile(workbook, outFileName);

      toast.success("✅ Exported " + outFileName);
      console.log("[Export] success", {
        file: outFileName,
        rows: dataToExport.length,
      });
    } catch (err) {
      console.error("[Export] failed", err);
      toast.error("❌ Export failed: " + (err?.message || err));
    }
  };

  return (
    <ExportContext.Provider
      value={{
        exportData,
        setExportData,
        filterType,
        setFilterType,
        filterValue,
        setFilterValue,
        availableYears,
        setAvailableYears,
        // shared bookings
        bookings,
        setBookings,
        handleExport,
      }}
    >
      {children}
    </ExportContext.Provider>
  );
}
