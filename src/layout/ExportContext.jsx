import React, { createContext, useCallback, useMemo, useState } from "react";
/* eslint-disable react-refresh/only-export-components */
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

export const ExportContext = createContext();

function resolveUpdater(nextValue, previousValue) {
  return typeof nextValue === "function" ? nextValue(previousValue) : nextValue;
}

function arePrimitiveArraysEqual(previousValue = [], nextValue = []) {
  if (previousValue === nextValue) return true;
  if (!Array.isArray(previousValue) || !Array.isArray(nextValue)) return false;
  if (previousValue.length !== nextValue.length) return false;

  return previousValue.every((value, index) => value === nextValue[index]);
}

function areExportRowsEqual(previousValue = [], nextValue = []) {
  if (previousValue === nextValue) return true;
  if (!Array.isArray(previousValue) || !Array.isArray(nextValue)) return false;
  if (previousValue.length !== nextValue.length) return false;

  return previousValue.every((row, rowIndex) => {
    const nextRow = nextValue[rowIndex];

    if (row === nextRow) return true;
    if (
      !row ||
      !nextRow ||
      typeof row !== "object" ||
      typeof nextRow !== "object"
    ) {
      return false;
    }

    const previousKeys = Object.keys(row);
    const nextKeys = Object.keys(nextRow);

    if (previousKeys.length !== nextKeys.length) return false;

    return previousKeys.every((key) => row[key] === nextRow[key]);
  });
}

export function ExportProvider({ children }) {
  const [exportData, setExportDataState] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState(null);
  const [availableYears, setAvailableYearsState] = useState([]);

  // Shared bookings so Summary can reflect the same data as Dashboard
  const [bookings, setBookings] = useState([]);

  // Use current location to include page name in exported filename
  const location = useLocation();
  const pathToName = useCallback((path) => {
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
  }, []);

  const setExportData = useCallback((nextValue) => {
    setExportDataState((previousValue) => {
      const resolvedValue = resolveUpdater(nextValue, previousValue);
      return areExportRowsEqual(previousValue, resolvedValue)
        ? previousValue
        : resolvedValue;
    });
  }, []);

  const setAvailableYears = useCallback((nextValue) => {
    setAvailableYearsState((previousValue) => {
      const resolvedValue = resolveUpdater(nextValue, previousValue);
      return arePrimitiveArraysEqual(previousValue, resolvedValue)
        ? previousValue
        : resolvedValue;
    });
  }, []);

  const handleExport = useCallback(async (fileName) => {
    // don't allow exports on certain pages
    const disabledPaths = [
      "/booking",
      "/summary",
      "/uploadimg",
      "/offersandcoupons",
    ];
    if (disabledPaths.includes(location.pathname)) {
      toast.error("Export unavailable on this page");
      return;
    }

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
    const exportToastId = toast.loading("Preparing export...");
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
              th.innerText.trim(),
            );
          } else {
            // Fallback to first row's cells
            const firstRow = table.querySelector("tr");
            if (firstRow) {
              headers = Array.from(firstRow.querySelectorAll("th,td")).map(
                (h, i) => h.innerText.trim() || `Column ${i + 1}`,
              );
            }
          }

          // If still no headers, generate generic ones based on first body row
          if (!headers || headers.length === 0) {
            const firstBodyRow = table.querySelector("tbody tr");
            if (firstBodyRow) {
              const count = firstBodyRow.querySelectorAll("td,th").length || 1;
              headers = Array.from({ length: count }).map(
                (_, i) => `Column ${i + 1}`,
              );
            }
          }

          const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
          const rows = [];

          bodyRows.forEach((tr) => {
            const cells = Array.from(tr.querySelectorAll("td,th")).map((td) =>
              td.innerText.trim(),
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
        toast.error("No data available to export", { id: exportToastId });
        return;
      }

      if (!dataToExport || dataToExport.length === 0) {
        toast.error("❌ No data available to export");
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      XLSX.writeFile(workbook, outFileName);

      toast.dismiss(exportToastId);

      toast.success("✅ Exported " + outFileName);
      console.log("[Export] success", {
        file: outFileName,
        rows: dataToExport.length,
      });
    } catch (err) {
      console.error("[Export] failed", err);
      toast.dismiss(exportToastId);
      toast.error("❌ Export failed: " + (err?.message || err));
    }
  }, [exportData, filterType, filterValue, location.pathname, pathToName]);

  const contextValue = useMemo(
    () => ({
      setExportData,
      filterType,
      setFilterType,
      filterValue,
      setFilterValue,
      availableYears,
      setAvailableYears,
      bookings,
      setBookings,
      handleExport,
    }),
    [
      availableYears,
      bookings,
      filterType,
      filterValue,
      handleExport,
      setAvailableYears,
      setExportData,
    ],
  );

  return <ExportContext.Provider value={contextValue}>{children}</ExportContext.Provider>;
}
