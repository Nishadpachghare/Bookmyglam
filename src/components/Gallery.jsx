import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// Replace with your actual Vercel backend URL or keep as env var
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://salon-admin-panel-backend.vercel.app";

// Props:
// - showAdminControls (boolean) — when true the component will fetch ALL items and show Publish / Unpublish / Delete controls
export default function Gallery({ showAdminControls = false }) {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [adminFilter, setAdminFilter] = useState("all"); // all | published | drafts

  const fetchGallery = async () => {
    try {
      setLoading(true);
      if (showAdminControls) {
        // admin wants all items so they can manage drafts/published items
        const resp = await axios.get(`${API_BASE}/api/uploads`);
        if (resp.data?.ok) {
          const items = resp.data.items || [];
          setGalleryItems(items);
          return;
        }
      } else {
        // public view: only published items
        const resp = await axios.get(`${API_BASE}/api/uploads?public=true`);
        if (resp.data?.ok) {
          setGalleryItems(resp.data.items || []);
          return;
        }
      }
      setGalleryItems([]);
    } catch (error) {
      console.error("Gallery fetch error:", error);
      toast.error("Failed to fetch gallery. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdminControls]);

  const publishItem = async (itemId, publish = true, item = {}) => {
    // Safety: prevent publishing non-uploaded media (images/videos) — link-only can be published
    if (!item) item = galleryItems.find((i) => i._id === itemId) || {};
    if (!item.uploaded && item.type !== "link" && publish) {
      toast.error(
        "This item has not been uploaded to Cloudinary yet. Upload first from admin panel before publishing."
      );
      return;
    }

    try {
      setActionLoading((s) => ({ ...s, [itemId]: true }));
      const resp = await axios.put(
        `${API_BASE}/api/uploads/${itemId}/publish`,
        { publish }
      );
      if (resp.data?.ok) {
        toast.success(publish ? "Published to web" : "Unpublished from web");
        await fetchGallery();
      } else {
        toast.error("Action failed: " + (resp.data?.error || "unknown"));
      }
    } catch (err) {
      console.error("publishItem error:", err);
      toast.error("Action failed. See console.");
    } finally {
      setActionLoading((s) => ({ ...s, [itemId]: false }));
    }
  };

  const deleteItem = async (itemId) => {
    const ok = window.confirm(
      "Delete this item? This will remove it from the database and Cloudinary (if present)."
    );
    if (!ok) return;

    try {
      setActionLoading((s) => ({ ...s, [itemId]: true }));
      const resp = await axios.delete(`${API_BASE}/api/uploads/${itemId}`);
      if (resp.data?.ok) {
        toast.success("Deleted");
        await fetchGallery();
      } else {
        toast.error("Delete failed: " + (resp.data?.error || "unknown"));
      }
    } catch (err) {
      console.error("deleteItem error:", err);
      toast.error("Delete failed. See console.");
    } finally {
      setActionLoading((s) => ({ ...s, [itemId]: false }));
    }
  };

  // If admin view and filter set, derive visible items
  const visibleItems = (showAdminControls ? galleryItems : galleryItems).filter(
    (it) => {
      if (!showAdminControls) return true;
      if (adminFilter === "all") return true;
      if (adminFilter === "published") return !!it.publishedToWeb;
      if (adminFilter === "drafts")
        return !!it.uploaded === false || !it.publishedToWeb;
      return true;
    }
  );

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Header */}
      <div className="pt-24 md:pt-40 flex flex-col text-center px-4 max-w-4xl mx-auto">
        <h1 className="font-bold text-3xl md:text-4xl mb-3">
          See Our Space, Feel the Vibe.
        </h1>
        <p className="text-gray-500 md:text-lg leading-relaxed">
          Step inside our world of style and transformation. Explore our curated
          interior, relaxing ambiance, and the stunning results we create for
          our clients every day.
        </p>

        {showAdminControls && (
          <div className="mt-4 flex justify-center gap-3 items-center">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="drafts">Drafts / Unpublished</option>
            </select>
            <button
              onClick={fetchGallery}
              className="p-2 bg-[#D3AF37] rounded text-black"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20 mt-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 animate-pulse">Loading Gallery...</p>
          </div>
        ) : visibleItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {visibleItems.map((item, index) => (
              <div
                key={item._id}
                className={`relative h-64 rounded-lg overflow-hidden group border bg-gray-50 ${
                  index % 5 === 4 ? "md:col-span-2" : "col-span-1"
                }`}
              >
                {item.type === "image" && (
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                )}
                {item.type === "video" && (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseOver={(e) => e.target.play()}
                    onMouseOut={(e) => e.target.pause()}
                  />
                )}

                {/* Caption */}
                <div className="absolute bottom-0 left-0 p-3 bg-gradient-to-t from-black/80 to-transparent w-full">
                  <p className="text-white font-semibold text-sm">
                    {item.caption || "Salon Work"}
                  </p>
                  {item.stylist && (
                    <p className="text-gray-300 text-xs">by {item.stylist}</p>
                  )}
                  {showAdminControls && (
                    <div className="mt-2 flex gap-2">
                      {item.publishedToWeb ? (
                        <button
                          disabled={!!actionLoading[item._id]}
                          onClick={() => publishItem(item._id, false, item)}
                          className="px-2 py-1 bg-orange-500 text-white text-xs rounded"
                        >
                          {actionLoading[item._id] ? "Working..." : "Unpublish"}
                        </button>
                      ) : (
                        <button
                          disabled={!!actionLoading[item._id]}
                          onClick={() => publishItem(item._id, true, item)}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                        >
                          {actionLoading[item._id] ? "Working..." : "Publish"}
                        </button>
                      )}
                      <button
                        disabled={!!actionLoading[item._id]}
                        onClick={() => deleteItem(item._id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">No photos published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
