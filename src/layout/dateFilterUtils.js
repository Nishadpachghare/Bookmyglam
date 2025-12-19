export function parseDateValue(rec, fields = ["date", "createdAt", "dateAdded"]) {
  for (const f of fields) {
    if (!rec) continue;
    const v = rec[f];
    if (!v) continue;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
    // sometimes date-like string may be without timezone; try Date.parse
    const p = Date.parse(v);
    if (!isNaN(p)) return new Date(p);
  }
  return null;
}

export function filterByDate(records = [], dateField = "date", filterType = "all", filterValue = null) {
  if (!records || records.length === 0) return records;
  if (!filterType || filterType === "all") return records;

  // quick check: do any records have a parsable date
  const hasDates = records.some((r) => parseDateValue(r, [dateField, "createdAt", "dateAdded"]));
  if (!hasDates) return records; // nothing to filter

  if (filterType === "year") {
    const y = Number(filterValue);
    if (Number.isNaN(y)) return records;
    return records.filter((r) => {
      const d = parseDateValue(r, [dateField, "createdAt", "dateAdded"]);
      return d && d.getFullYear() === y;
    });
  }

  if (filterType === "month") {
    // filterValue expected 'YYYY-MM'
    if (!filterValue || typeof filterValue !== "string") return records;
    const [yStr, mStr] = filterValue.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    if (Number.isNaN(y) || Number.isNaN(m)) return records;
    return records.filter((r) => {
      const d = parseDateValue(r, [dateField, "createdAt", "dateAdded"]);
      return d && d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }

  if (filterType === "day" || filterType === "date") {
    // filterValue expected 'YYYY-MM-DD'
    if (!filterValue || typeof filterValue !== "string") return records;
    return records.filter((r) => {
      const d = parseDateValue(r, [dateField, "createdAt", "dateAdded"]);
      if (!d) return false;
      const iso = d.toISOString().slice(0, 10);
      return iso === filterValue;
    });
  }

  return records;
}

export function getAvailableYears(records = [], dateField = "date") {
  if (!records || records.length === 0) return [];
  const set = new Set();
  records.forEach((r) => {
    const d = parseDateValue(r, [dateField, "createdAt", "dateAdded"]);
    if (d) set.add(d.getFullYear());
  });
  return Array.from(set).sort((a, b) => b - a);
}

/**
 * Format a date-like value into DD/MM/YYYY (optionally with HH:MM)
 * If the value is invalid, returns the original value.
 */
export function formatDisplayDate(value, includeTime = false) {
  if (!value && value !== 0) return "";
  let d = new Date(value);
  if (isNaN(d.getTime())) {
    const p = Date.parse(value);
    if (!isNaN(p)) d = new Date(p);
    else return String(value);
  }

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  if (includeTime) {
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }
  return `${dd}/${mm}/${yyyy}`;
}
