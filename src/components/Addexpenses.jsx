import React, { useState } from "react";

const AddExpense = () => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !date) {
      alert("Please fill required fields!");
      return;
    }

    console.log({
      amount,
      date,
      notes,
      file: file ? file.name : "No file uploaded",
    });

    // Reset form
    setAmount("");
    setDate("");
    setNotes("");
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 pl-55">
      <div className="w-230 bg-white p-6 rounded-lg shadow border">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Add expenses</h2>
        <p className="text-[#D3AF37] text-sm mb-6">
          Add expenses for remind
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
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
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-md p-2 focus:ring-1 focus:ring-yellow-400 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              placeholder="Enter notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-md p-2 h-24 focus:ring-1 focus:ring-yellow-400 outline-none"
            />
          </div>

          {/* Upload Receipt */}
          <div className="border-2 border-dashed border-gray-400 rounded-md p-10 text-center">
            <p className="font-medium text-gray-700">
              Upload Receipt (Optional)
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop or browse to upload a receipt
            </p>
            <label className="bg-[#D3AF37] text-black px-4 py-1 rounded-md cursor-pointer hover:bg-yellow-400">
              Browse Files
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <p className="text-xs text-gray-600 mt-2">{file.name}</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#D3AF37] text-black font-medium px-4 py-2 rounded-md hover:bg-yellow-400"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;