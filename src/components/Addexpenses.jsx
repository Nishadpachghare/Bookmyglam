import React, { useState, useMemo } from "react";

const AddExpense = () => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const [expenses, setExpenses] = useState([]); // ✅ list of added expenses
  const [selectedExpenses, setSelectedExpenses] = useState([]); // ✅ for checkbox selection
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // asc / desc for date

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !date || !notes) {
      alert("Please fill required fields!");
      return;
    }

    const newExpense = {
      id: Date.now().toString(), // simple unique id
      amount: Number(amount),
      date,
      expiryDate,
      notes,
      fileName: file ? file.name : null,
    };

    // ✅ Add to list
    setExpenses((prev) => [newExpense, ...prev]);

    // Log just for checking
    console.log("New Expense Added:", newExpense);

    // Reset form
    setAmount("");
    setDate("");
    setExpiryDate("");
    setNotes("");
    setFile(null);
  };

  // ✅ Handle select / unselect expense
  const handleCheckbox = (id) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((expId) => expId !== id) : [...prev, id]
    );
  };

  // ✅ Delete selected expenses (frontend only)
  const handleDelete = () => {
    if (selectedExpenses.length === 0) return;
    const remaining = expenses.filter(
      (exp) => !selectedExpenses.includes(exp.id)
    );
    setExpenses(remaining);
    setSelectedExpenses([]);
  };

  // ✅ Sort by date
  const handleSort = (order) => {
    setSortOrder(order);
    setShowSortOptions(false);
  };

  // ✅ Derived sorted expenses
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

  // ✅ Dummy edit
  const handleEdit = (id) => {
    alert(`Edit clicked for expense ID: ${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 pl-55">
      <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Add expenses</h2>
        <p className="text-[#D3AF37] text-sm mb-6">Add expenses for remind</p>

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
              className="w-full border rounded-md p-2 focus:ring-1 focus:ring-[#D3AF37] outline-none"
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
              className="w-full border rounded-md p-2 focus:ring-1 focus:ring-yellow-400 outline-none"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-1 focus:ring-yellow-400 outline-none"
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
              className="w-full border rounded-md p-2 h-24 focus:ring-1 focus:ring-yellow-400 outline-none"
            />
          </div>

          {/* Upload Receipt */}
          <div className="border-2 border-dashed border-gray-400 rounded-md p-6 text-center">
            <p className="font-medium text-gray-700">
              Upload Receipt (Optional)
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop or browse to upload a receipt
            </p>
            <label className="bg-[#d6b740] text-black font-semibold p-2 rounded-md hover:bg-[#c1a235] cursor-pointer">
              Browse Files
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && <p className="text-xs text-gray-600 mt-2">{file.name}</p>}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#d6b740] text-black font-semibold p-2 rounded-md hover:bg-[#c1a235] cursor-pointer"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>

      {/* 👉 Expense List Section */}
      <div className="w-full max-w-6xl bg-white mt-10 p-6 rounded-lg shadow border">
        <h3 className="text-center text-2xl font-semibold text-gray-800 mb-4">
          All Expenses
        </h3>

        <div className="flex gap-4 items-center m-3 pl-195">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-red-600 border border-red-600 px-3 py-1 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedExpenses.length === 0}
          >
            🗑 Delete{" "}
            {selectedExpenses.length > 0 && `(${selectedExpenses.length})`}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center gap-1 text-gray-700 border px-3 py-1 rounded-md hover:bg-gray-50"
            >
              🔍 Sort by {sortOrder === "asc" ? "(Old–New)" : "(New–Old)"}
            </button>
            {showSortOptions && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleSort("asc")}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Oldest → Newest
                  </button>
                  <button
                    onClick={() => handleSort("desc")}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Newest → Oldest
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 w-16 text-center">Select</th>
              <th className="border p-2 text-left w-1/6">Amount</th>
              <th className="border p-2 text-left w-1/5">Date</th>
              <th className="border p-2 text-left w-1/5">Expiry</th>
              <th className="border p-2 text-left">Notes</th>
              <th className="border p-2 text-left w-1/6">Receipt</th>
              <th className="border p-2 w-16 text-center">Edit</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((exp) => (
              <tr
                key={exp.id}
                className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <td className="border py-3 px-2 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#d6b740] cursor-pointer"
                    checked={selectedExpenses.includes(exp.id)}
                    onChange={() => handleCheckbox(exp.id)}
                  />
                </td>
                <td className="border py-3 px-2">₹{exp.amount}</td>
                <td className="border py-3 px-2">{exp.date || "-"}</td>
                <td className="border py-3 px-2">{exp.expiryDate || "-"}</td>
                <td className="border py-3 px-2 max-w-xs truncate">
                  {exp.notes || "-"}
                </td>
                <td className="border py-3 px-2">
                  {exp.fileName || "No file"}
                </td>
                <td className="border py-3 px-2 text-center">
                  <button
                    onClick={() => handleEdit(exp.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {sortedExpenses.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="border py-6 px-2 text-center text-gray-500"
                >
                  No expenses added yet. Add one from the form above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddExpense;
