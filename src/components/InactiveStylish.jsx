import React, { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function InactiveStylish() {
  const navigate = useNavigate();
  const [inactiveStylists, setInactiveStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔹 Fetch inactive stylists
  const fetchInactiveStylists = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/stylists");
      if (!res.ok) throw new Error("Failed to fetch stylists");
      const data = await res.json();
      setInactiveStylists(data.filter((s) => s.status === "inactive"));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stylists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactiveStylists();
  }, []);

  // 🔹 Activate stylist (move back to active list)
  const activateStylist = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/stylists/${id}/active`,
        {
          method: "PUT",
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Stylist activated successfully!");
      setInactiveStylists((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error("Failed to activate stylist");
    }
  };

  // 🔹 Permanently delete stylist
  const deleteStylist = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this stylist?"
      )
    )
      return;
    try {
      const res = await fetch(`http://localhost:5000/api/stylists/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Stylist deleted permanently!");
      setInactiveStylists((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error("Failed to delete stylist");
    }
  };

  // 🔹 Search functionality
  const filteredStylists = inactiveStylists.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔹 Show searched results on top
  const sortedStylists =
    searchTerm.trim() === ""
      ? inactiveStylists
      : [
          ...filteredStylists,
          ...inactiveStylists.filter((s) => !filteredStylists.includes(s)),
        ];

  return (
    <div className="p-10 bg-gray-50 min-h-screen pl-80 shadow-xl">
      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Manage Stylists
      </h1>

      {/* 🔍 Search Bar */}
      <div className="flex items-center bg-[#f0f0f0] px-4 py-3 w-full max-w-5xl border rounded-md">
        <FiSearch className="text-gray-500 text-xl" />
        <input
          type="text"
          placeholder="Search stylist by name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none ml-3 w-full text-gray-700 placeholder-gray-500"
        />
      </div>

      {/* 🔹 Tabs */}
      <div className="flex gap-10 mt-6 pb-3 text-lg font-medium border-b border-gray-200">
        <button
          onClick={() => navigate("/managestyle")}
          className="text-gray-500 hover:text-[#D3AF37]"
        >
          All Stylists
        </button>
        <button
          onClick={() => navigate("/managestyle1")}
          className="text-gray-500 hover:text-[#D3AF37]"
        >
          Add Stylist
        </button>
        <button className="text-[#D3AF37] font-semibold border-b-2 border-[#D3AF37] pb-1">
          Inactive Stylists
        </button>
      </div>

      {/* 🔹 Table Section */}
      <div className="mt-8 bg-white rounded-lg border shadow-xl w-full max-w-5xl p-6">
        {loading ? (
          <p className="text-gray-600 text-center">
            Loading inactive stylists...
          </p>
        ) : sortedStylists.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No inactive stylists found.
          </p>
        ) : (
          <table className="w-full text-left border">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-gray-700 font-semibold">
                  Stylist Name
                </th>
                <th className="py-3 px-4 text-gray-700 font-semibold">Phone</th>
                <th className="py-3 px-4 text-gray-700 font-semibold">
                  Status
                </th>
                <th className="py-3 px-4 text-gray-700 font-semibold text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStylists.map((stylist) => (
                <tr
                  key={stylist._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4">{stylist.name}</td>
                  <td className="py-3 px-4">{stylist.phone}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-sm">
                      Inactive
                    </span>
                  </td>
                  <td className="py-3 px-4 flex justify-center gap-3">
                    <button
                      onClick={() => activateStylist(stylist._id)}
                      className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => deleteStylist(stylist._id)}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default InactiveStylish;
