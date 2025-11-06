import React, { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function ManageStyle() {
  const navigate = useNavigate();
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ added search term state

  const fetchStylists = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/stylists");
      const data = await res.json();
      setStylists(data.filter((s) => s.status === "active"));
    } catch {
      toast.error("Failed to load stylists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStylists();
  }, []);

  const setInactive = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/stylists/${id}/inactive`,
        {
          method: "PUT",
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Moved to inactive stylists");
      fetchStylists();
    } catch {
      toast.error("Failed to update stylist");
    }
  };

  // ✅ Filter stylists based on search input
  const filteredStylists = stylists.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ If searching, show results first (sorted to top)
  const sortedStylists =
    searchTerm.trim() === ""
      ? stylists
      : [
          ...filteredStylists, // matching stylists first
          ...stylists.filter((s) => !filteredStylists.includes(s)), // rest below
        ];

  return (
    <div className="p-10 bg-gray-50 min-h-screen pl-80 shadow-xl">
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Manage Stylists
      </h1>

      {/* ✅ Search Bar (now functional) */}
      <div className="flex items-center bg-[#f0f0f0] px-4 py-3 w-full max-w-5xl border rounded-md">
        <FiSearch className="text-gray-500 text-xl" />
        <input
          type="text"
          placeholder="Search stylists by name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none ml-3 w-full text-gray-700"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-10 mt-6 pb-3 text-lg font-medium border-b border-gray-200">
        <button className="text-[#D3AF37] font-semibold border-b-2 border-[#D3AF37] pb-1">
          All Stylists
        </button>
        <button
          onClick={() => navigate("/managestyle1")}
          className="text-gray-500 hover:text-[#D3AF37]"
        >
          Add Stylist
        </button>
        <button
          onClick={() => navigate("/Inactivestylist")}
          className="text-gray-500 hover:text-[#D3AF37]"
        >
          Inactive Stylists
        </button>
      </div>

      {/* Table */}
      <div className="mt-8 bg-white rounded-lg border shadow-xl w-full max-w-5xl p-6">
        {loading ? (
          <p>Loading stylists...</p>
        ) : sortedStylists.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No stylists found.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4">Stylist Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStylists.map((stylist) => (
                <tr key={stylist._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{stylist.name}</td>
                  <td className="py-3 px-4">{stylist.phone}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setInactive(stylist._id)}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
                    >
                      Inactive
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

export default ManageStyle;
