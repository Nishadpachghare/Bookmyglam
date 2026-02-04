import React, { useState, useMemo, useEffect, useContext } from "react";
import { ExportContext } from "../layout/ExportContext";
import axios from "axios";
import { toast } from "react-hot-toast";
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
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentFileUrl, setCurrentFileUrl] = useState(null); // holds existing uploaded URL for edit-mode
  const [uploading, setUploading] = useState(false);

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
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setCurrentFileUrl(null); // user replaced existing URL with a new file
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer?.files && e.dataTransfer.files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setCurrentFileUrl(null);
  };

  // Upload file buffer to backend -> Cloudinary via /api/uploads/media
  const uploadFileToServer = async (fileToUpload) => {
    if (!fileToUpload) return null;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", fileToUpload);
      const res = await axios.post(
        "http://localhost:5000/api/uploads/media",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUploading(false);
      return res.data?.media?.url || null;
    } catch (err) {
      setUploading(false);
      console.error("Upload failed:", err);
      throw err;
    }
  };

  // Revoke object URL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ✅ Submit → add OR update (depending on editingId)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !date || !notes) {
      toast.error("Please fill required fields!");
      return;
    }

    // If a new file was selected upload it first, else keep existing URL (if editing)
    let fileUrl = null;
    try {
      if (file && file instanceof File) {
        fileUrl = await uploadFileToServer(file);
      } else if (currentFileUrl) {
        fileUrl = currentFileUrl;
      }
    } catch (err) {
      console.error(err);
      toast.error("File upload failed. Please try again.");
      return; // stop submission
    }

    const payload = {
      amount: Number(amount),
      date,
      expiryDate,
      notes,
      fileName: fileUrl,
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
      setPreviewUrl(null);
      setCurrentFileUrl(null);
      setUploading(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving expense:", error);
      // Ensure uploading flag reset on error
      setUploading(false);
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
  const {
    setExportData,
    filterType,
    filterValue,
    setAvailableYears,
    setFilterType,
    setFilterValue,
  } = useContext(ExportContext);

  const displayedExpenses = filterByDate(
    sortedExpenses || [],
    "date",
    filterType,
    filterValue
  );

  useEffect(() => {
    // helpful debug to trace when global filter changes and how many items remain
    console.log(
      "[AddExpense] filter",
      filterType,
      filterValue,
      "displayed count:",
      displayedExpenses.length
    );
  }, [filterType, filterValue, displayedExpenses.length]);

  // totals for the currently displayed (date-filtered) expenses
  const totalExpensesCount = displayedExpenses.length;
  const totalExpensesAmount = displayedExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  useEffect(() => {
    const years = getAvailableYears(sortedExpenses || [], "date");
    setAvailableYears(years);
  }, [sortedExpenses, setAvailableYears]);

  const exportRowsExpenses = useMemo(() => {
    return (displayedExpenses || []).map((e) => ({
      Amount: e.amount ?? "",
      Date: formatDisplayDate(e.date) || "",
      Expiry: formatDisplayDate(e.expiryDate) || "",
      Notes: e.notes || "",
      Receipt: e.fileName || "",
    }));
  }, [displayedExpenses]);

  useEffect(() => {
    setExportData(exportRowsExpenses);
  }, [exportRowsExpenses, setExportData]);

  // ✅ Edit: load data into form
  const handleEdit = (id) => {
    const exp = expenses.find((e) => e._id === id);
    if (!exp) return;

    setEditingId(id);
    setAmount(exp.amount?.toString() || "");
    setDate(exp.date || "");
    setExpiryDate(exp.expiryDate || "");
    setNotes(exp.notes || "");

    // If there is an existing uploaded URL, keep it as currentFileUrl and preview it
    if (
      exp.fileName &&
      (exp.fileName.startsWith("http") || exp.fileName.startsWith("/"))
    ) {
      setCurrentFileUrl(exp.fileName);
      setPreviewUrl(exp.fileName);
      setFile(null);
    } else {
      setCurrentFileUrl(null);
      setPreviewUrl(null);
      setFile(null);
    }

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
    setCurrentFileUrl(null);
    setPreviewUrl(null);
  };

  return (
   <div className="min-h-screen bg-black flex flex-col items-center py-10 px-4 pl-55">

   <div className="w-full max-w-xl bg-purple-900 p-6 rounded-lg shadow border border-purple-600">


        <h2 className="text-2xl font-bold text-white mb-1">
          {editingId ? "Edit expense" : "Add expenses"}
        </h2>
        <p className="text-purple-400 text-sm mb-6">
          {editingId
            ? "Update the selected expense"
            : "Add expenses for remind"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
           <label className="block text-sm font-medium text-white mb-1">

              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-700 rounded-md p-2 bg-black text-white placeholder-gray-400"

            />
          </div>

          {/* Date */}
          <div>
          <label className="block text-sm font-medium text-white mb-1">

              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-700 rounded-md p-2 bg-black text-white placeholder-gray-400"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">

              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-gray-700 rounded-md p-2 bg-black text-white placeholder-gray-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">

              Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-700 rounded-md p-2 bg-black text-white placeholder-gray-400"
            />
          </div>

          {/* Receipt Upload (drag & drop) */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center bg-black border-gray text-white
${dragActive ? "border-green-400 bg-purple-600" : ""}`}

            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="font-medium text-gray-700 mb-1">
              Upload Receipt{" "}
              <span className="text-gray-500 text-sm">(Optional)</span>
            </p>

            <div className="mt-3 flex flex-col items-center gap-2">
             <label className="block text-sm font-medium text-white mb-1">

                Browse File
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="text-sm text-gray-600">
                Or drag & drop your file here
              </div>

              {uploading && (
                <div className="text-sm text-gray-600 mt-2">Uploading...</div>
              )}

              {/* Preview or existing link */}
              {previewUrl ? (
                <div className="mt-3">
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-h-40 mx-auto rounded"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: <span className="font-medium">{file?.name}</span>
                  </p>
                </div>
              ) : currentFileUrl ? (
                <div className="mt-3">
                  <a
                    href={currentFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View uploaded receipt
                  </a>
                </div>
              ) : file ? (
                <p className="text-xs text-gray-600 mt-3 bg-white p-2 rounded-md inline-block border">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              ) : null}
            </div>
          </div>

          {/* Save / Update Buttons */}
          <div className="flex justify-end gap-3">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-black text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-900"

              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-black text-white font-semibold px-4 py-2 rounded-md"
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

          {/* Current Global Filter Indicator */}
          {filterType && filterType !== "all" && (
            <div className="ml-4 flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Filter:</span>
              <span className="truncate">
                {filterType} {filterValue ? `- ${filterValue}` : ""}
              </span>
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterValue(null);
                }}
                className="ml-2 text-xs text-red-600 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <table className="w-full border text-sm text-gray-200">

          <thead className="bg-gray-800 text-white">

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
                className="even:bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <td className="border text-center p-2">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.includes(exp._id)}
                    onChange={() => handleCheckbox(exp._id)}
                    className="w-4 h-4 accent-[#d6b740] cursor-pointer"
                  />
                </td>
                <td className="border p-2">
                  ₹{Number(exp.amount).toLocaleString("en-IN")}
                </td>
                <td className="border p-2">
                  {formatDisplayDate(exp.date) || "-"}
                </td>
                <td className="border p-2">
                  {formatDisplayDate(exp.expiryDate) || "-"}
                </td>
                <td className="border p-2 max-w-lg break-words whitespace-pre-wrap">
                  {exp.notes}
                </td>
                <td className="border p-2">
                  {exp.fileName ? (
                    exp.fileName.startsWith("http") ||
                    exp.fileName.startsWith("/") ? (
                      <a
                        href={exp.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="italic">{exp.fileName}</span>
                    )
                  ) : (
                    <span className="text-gray-500">No file</span>
                  )}
                </td>
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
