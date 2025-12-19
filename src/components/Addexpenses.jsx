import React, { useState, useMemo, useEffect, useContext } from "react";
import { ExportContext } from "../layout/ExportContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  filterByDate,
  getAvailableYears,
  formatDisplayDate,
} from "../layout/dateFilterUtils";

const AddExpense = () => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const [expenses, setExpenses] = useState([]); // list from backend
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // asc / desc for date

  const [editingId, setEditingId] = useState(null); // ✅ currently editing expense _id

  // ✅ Fetch expenses from backend on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/expenses");
        setExpenses(res.data);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }
    };

    fetchExpenses();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // ✅ Submit → add OR update (depending on editingId)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !date || !notes) {
      toast.error("Please fill required fields!");
      return;
    }

    const payload = {
      amount: Number(amount),
      date,
      expiryDate,
      notes,
      fileName: file ? file.name : null,
    };

    try {
      if (editingId) {
        // 🔁 UPDATE EXISTING EXPENSE (PUT)
        const res = await axios.put(
          `http://localhost:5000/api/expenses/${editingId}`,
          payload
        );

        const updated = res.data.expense || res.data;

        setExpenses((prev) =>
          prev.map((exp) => (exp._id === editingId ? updated : exp))
        );

        toast.success("Your expense has been updated ✅");
      } else {
        // ➕ CREATE NEW EXPENSE (POST)
        const res = await axios.post(
          "http://localhost:5000/api/expenses",
          payload
        );

        const newExpense = res.data.expense || res.data;

        // Add to list
        setExpenses((prev) => [newExpense, ...prev]);

        toast.success("Your expense has been added successfully ✅");
      }

      // Reset form & editing mode
      setAmount("");
      setDate("");
      setExpiryDate("");
      setNotes("");
      setFile(null);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Check console.");
    }
  };

  // ✅ Select / Unselect
  const handleCheckbox = (id) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((expId) => expId !== id) : [...prev, id]
    );
  };

  // ✅ Delete from backend + frontend
  const handleDelete = async () => {
    if (selectedExpenses.length === 0) return;

    try {
      for (const id of selectedExpenses) {
        await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      }

      const remaining = expenses.filter(
        (exp) => !selectedExpenses.includes(exp._id)
      );
      setExpenses(remaining);
      setSelectedExpenses([]);

      toast.success("Selected expenses deleted ✅");
    } catch (error) {
      console.error("Error deleting expenses:", error);
      toast.error("Failed to delete some expenses. Check console.");
    }
  };

  // ✅ Sort
  const handleSort = (order) => {
    setSortOrder(order);
    setShowSortOptions(false);
  };

  const sortedExpenses = useMemo(() => {
    const copy = [...expenses];
    copy.sort((a, b) => {
      const d1 = new Date(a.date);
      const d2 = new Date(b.date);
      if (sortOrder === "asc") return d1 - d2;
      return d2 - d1;
    });
    return copy;
  }, [expenses, sortOrder]);

  // Export & filtering: expenses
  const { setExportData, filterType, filterValue, setAvailableYears } =
    useContext(ExportContext);

  const displayedExpenses = filterByDate(
    sortedExpenses || [],
    "date",
    filterType,
    filterValue
  );

  // totals for the currently displayed (date-filtered) expenses
  const totalExpensesCount = displayedExpenses.length;
  const totalExpensesAmount = displayedExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  useEffect(() => {
    const years = getAvailableYears(sortedExpenses || [], "date");
    setAvailableYears(years);
  }, [sortedExpenses]);

  const exportRowsExpenses = useMemo(() => {
    return (displayedExpenses || []).map((e) => ({
      Amount: e.amount ?? "",
      Date: formatDisplayDate(e.date) || "",
      Expiry: formatDisplayDate(e.expiryDate) || "",
      Notes: e.notes || "",
      Receipt: e.fileName || "",
    }));
  }, [displayedExpenses]);

  const exportRowsExpensesKey = useMemo(() => {
    return exportRowsExpenses.map((r) => `${r.Amount}|${r.Date}`).join("||");
  }, [exportRowsExpenses]);

  useEffect(() => {
    setExportData(exportRowsExpenses);
  }, [exportRowsExpensesKey, setExportData]);

  // ✅ Edit: load data into form
  const handleEdit = (id) => {
    const exp = expenses.find((e) => e._id === id);
    if (!exp) return;

    setEditingId(id);
    setAmount(exp.amount?.toString() || "");
    setDate(exp.date || "");
    setExpiryDate(exp.expiryDate || "");
    setNotes(exp.notes || "");

    // Sirf naam store kar rahe hain, purana file object nahi milta,
    // isliye yaha virtual file object bana rahe hain just for UI.
    setFile(exp.fileName ? { name: exp.fileName } : null);

    // Optionally scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setDate("");
    setExpiryDate("");
    setNotes("");
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 pl-55">
      <ToastContainer />

      <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {editingId ? "Edit expense" : "Add expenses"}
        </h2>
        <p className="text-[#D3AF37] text-sm mb-6">
          {editingId
            ? "Update the selected expense"
            : "Add expenses for remind"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-md p-2 h-24"
            />
          </div>

          {/* Receipt Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <p className="font-medium text-gray-700 mb-1">
              Upload Receipt{" "}
              <span className="text-gray-500 text-sm">(Optional)</span>
            </p>

            {/* Upload Button */}
            <label className="inline-block mt-3 bg-[#d6b740] text-black font-semibold px-4 py-2 rounded-md cursor-pointer hover:bg-[#c1a235] transition">
              Browse File
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* File Name */}
            {file && (
              <p className="text-xs text-gray-600 mt-3 bg-white p-2 rounded-md inline-block border">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {/* Save / Update Buttons */}
          <div className="flex justify-end gap-3">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="border border-gray-400 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-[#d6b740] text-black font-semibold px-4 py-2 rounded-md"
            >
              {editingId ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </form>
      </div>

      {/* EXPENSE LIST */}
      <div className="w-full max-w-6xl bg-white mt-10 p-6 rounded-lg shadow border">
        <h3 className="text-center text-2xl font-semibold text-gray-800 mb-4">
          All Expenses
        </h3>

        {/* Controls */}
        <div className="flex gap-4 items-center m-3 pl-195">
          <button
            onClick={handleDelete}
            className="text-red-600 border border-red-600 px-3 py-1 rounded-md"
            disabled={selectedExpenses.length === 0}
          >
            🗑 Delete{" "}
            {selectedExpenses.length > 0 && `(${selectedExpenses.length})`}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md"
            >
              🔍 Sort by {sortOrder === "asc" ? "(Old–New)" : "(New–Old)"}
            </button>
            {showSortOptions && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow bg-white border z-10">
                <button
                  onClick={() => handleSort("asc")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  Oldest → Newest
                </button>
                <button
                  onClick={() => handleSort("desc")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  Newest → Oldest
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-center">Select</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Expiry</th>
              <th className="border p-2">Notes</th>
              <th className="border p-2">Receipt</th>
              <th className="border p-2 text-center">Edit</th>
            </tr>
          </thead>
          <tbody>
            {displayedExpenses.map((exp) => (
              <tr
                key={exp._id}
                className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <td className="border text-center p-2">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.includes(exp._id)}
                    onChange={() => handleCheckbox(exp._id)}
                    className="w-4 h-4 accent-[#d6b740] cursor-pointer"
                  />
                </td>
                <td className="border p-2">₹{exp.amount}</td>
                <td className="border p-2">
                  {formatDisplayDate(exp.date) || "-"}
                </td>
                <td className="border p-2">{exp.expiryDate || "-"}</td>
                <td className="border p-2 max-w-xs truncate">{exp.notes}</td>
                <td className="border p-2">{exp.fileName || "No file"}</td>
                <td className="border text-center p-2">
                  <button
                    onClick={() => handleEdit(exp._id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {displayedExpenses.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-gray-500 py-5 border"
                >
                  No expenses added yet.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="border p-2 text-center font-semibold">Totals</td>
              <td className="border p-2 font-semibold">
                ₹{totalExpensesAmount.toLocaleString()}
              </td>
              <td className="border p-2 font-semibold" />
              <td className="border p-2 font-semibold" />
              <td className="border p-2 font-semibold" />
              <td className="border p-2 font-semibold" />
              <td className="border p-2 text-center font-semibold">
                {totalExpensesCount} items
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AddExpense;
