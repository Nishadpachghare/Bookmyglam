import React, { useEffect, useState, useContext, useMemo } from "react";
import { ExportContext } from "../layout/ExportContext";
import { filterByDate, getAvailableYears } from "../layout/dateFilterUtils";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

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

  // Export & filtering: stylists list
  const { setExportData, filterType, filterValue, setAvailableYears } =
    useContext(ExportContext);

  const displayedStylists = filterByDate(
    stylists || [],
    "createdAt",
    filterType,
    filterValue,
  );

  useEffect(() => {
    const years = getAvailableYears(stylists || [], "createdAt");
    setAvailableYears(years);
  }, [stylists, setAvailableYears]);

  const exportRowsStylists = useMemo(() => {
    return (displayedStylists || []).map((s) => ({
      Name: s.name || "",
      Phone: s.phone || "",
      Photo: s.photoUrl || "",
      Status: s.status || "",
    }));
  }, [displayedStylists]);

  useEffect(() => {
    setExportData(exportRowsStylists);
  }, [exportRowsStylists, setExportData]);

  const setInactive = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/stylists/${id}/inactive`,
        {
          method: "PUT",
        },
      );
      if (!res.ok) throw new Error();
      toast.success("Moved to inactive stylists");
      fetchStylists();
    } catch {
      toast.error("Failed to update stylist");
    }
  };

  // Apply search on the already date-filtered stylists so both filters combine
  const searchedStylists = (displayedStylists || []).filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return false;
    return (
      (s.name || "").toString().toLowerCase().includes(q) ||
      (s.phone || "").toString().toLowerCase().includes(q)
    );
  });

  const visibleStylists =
    searchTerm.trim() === ""
      ? displayedStylists
      : [
          // matches first
          ...searchedStylists,
          // then the rest that didn't match (to keep full list visible)
          ...displayedStylists.filter((s) => !searchedStylists.includes(s)),
        ];

  return (
    <div className="p-10 min-h-screen pl-80 bg-black shadow-xl">
      <h1 className="text-3xl font-semibold text-white mb-6">
        Manage Stylists
      </h1>

      {/* ✅ Search Bar (consistent dark style) */}
      <div className="flex items-center bg-zinc-900 px-4 py-3 w-full max-w-5xl border border-zinc-700 rounded-md">
        <FiSearch className="text-gray-300 text-xl" />
        <input
          type="text"
          placeholder="Search stylists by name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none ml-3 w-full text-white placeholder-gray-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-10 mt-6 pb-3 text-lg font-medium  border-gray-200">
        <button className="text-[#4C0099] font-semibold border-b-2 border-[#4C0099] pb-1">
          All Stylists
        </button>
        <button
          onClick={() => navigate("/managestyle1")}
          className="text-purple-900 hover:text-[#FFFFFF]"
        >
          Add Stylist
        </button>
        <button
          onClick={() => navigate("/Inactivestylist")}
          className="text-purple-900 hover:text-[#ffffff]"
        >
          Inactive Stylists
        </button>
      </div>

      {/* Table */}
      <div className="mt-8 bg-white rounded-lg border shadow-xl w-full max-w-5xl p-6">
        {loading ? (
          <p>Loading stylists...</p>
        ) : displayedStylists.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No stylists found.</p>
        ) : (
          <table className="w-full text-left border">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4">Stylist Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleStylists.map((stylist) => (
                <tr key={stylist._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{stylist.name}</td>
                  <td className="py-3 px-4">{stylist.phone}</td>
                  <td className="py-3 px-4">
                    {stylist.photoUrl ? (
                      <div className="flex flex-col">
                        <a
                          href={stylist.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          View photo
                        </a>
                        <span className="text-xs text-gray-500 break-all mt-1">
                          {stylist.photoUrl.split("/").pop()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">No Photo</div>
                    )}
                  </td>
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
