// src/pages/Uploadimg.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:5000";

export default function Uploadimg() {
  const [form, setForm] = useState({
    image: {
      file: null,
      preview: null,
      caption: "",
      stylist: "",
      date: new Date().toISOString().slice(0, 10),
    },
    video: {
      file: null,
      preview: null,
      caption: "",
      stylist: "",
      date: new Date().toISOString().slice(0, 10),
    },
    link: {
      url: "",
      file: null,
      preview: null,
      caption: "",
      stylist: "",
      date: new Date().toISOString().slice(0, 10),
      platform: "Instagram",
    },
  });

  const [reviewItems, setReviewItems] = useState([]);
  const [uploadingState, setUploadingState] = useState({});

  // Persist draft metadata edits to backend
  const updateDraft = async (id, updates) => {
    if (!id) return null;
    try {
      const r = await axios.put(`${API_BASE}/api/uploads/${id}`, updates);
      if (r.data?.media) {
        setReviewItems((prev) =>
          prev.map((c) =>
            c.image?.backendId === id || c.video?.backendId === id || c.link?.backendId === id
              ? {
                  ...c,
                  image: c.image?.backendId === id ? { ...c.image, ...r.data.media } : c.image,
                  video: c.video?.backendId === id ? { ...c.video, ...r.data.media } : c.video,
                  link: c.link?.backendId === id ? { ...c.link, ...r.data.media } : c.link,
                }
              : c
          )
        );
        return r.data.media;
      }
      return null;
    } catch (err) {
      console.error("updateDraft error:", err);
      return null;
    }
  };

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const linkFileInputRef = useRef(null);
  const imageSectionRef = useRef(null);
  const videoSectionRef = useRef(null);
  const linkSectionRef = useRef(null);
  const [selectedSection, setSelectedSection] = useState("all");
  const [highlightSection, setHighlightSection] = useState("");

  const loadUploads = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/api/uploads`);
      if (resp.data?.ok && Array.isArray(resp.data.items)) {
        const map = {};
        resp.data.items.forEach((d) => {
          const key = `${d.stylist || "unknown"}_${d.date || ""}`;
          if (!map[key])
            map[key] = {
              id: `combo_${Math.random().toString(36).slice(2)}`,
              stylist: d.stylist || "",
              date: d.date || "",
              image: null,
              video: null,
              link: null,
              uploadedCount: 0,
            };

          const obj = {
            backendId: d._id,
            preview: d.url || null,
            caption: d.caption || "",
            url: d.url || "",
            uploaded: !!d.uploaded,
            publishedToWeb: !!d.publishedToWeb,
            file: null,
            platform: d.platform || "Instagram",
          };

          if (d.type === "image") {
            map[key].image = obj;
            if (obj.uploaded) map[key].uploadedCount += 1;
          }
          if (d.type === "video") {
            map[key].video = obj;
            if (obj.uploaded) map[key].uploadedCount += 1;
          }
          if (d.type === "link") {
            map[key].link = obj;
            if (obj.uploaded) map[key].uploadedCount += 1;
          }
        });
        setReviewItems(Object.values(map));
      }
    } catch (e) {
      console.error("Error fetching uploads:", e);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  const onDragOver = (e) => e.preventDefault();

  const handleFileSelect = (e, type) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    setForm((prev) => ({
      ...prev,
      [type]: { ...prev[type], file: f, preview },
    }));
    e.target.value = null;
  };

  // Handle files dropped into the drop areas
  const handleFileDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();

    // Try files first, then items (some browsers expose items instead)
    let f = e.dataTransfer?.files?.[0];
    if (!f && e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0];
      if (item && item.kind === "file") {
        f = item.getAsFile();
      }
    }

    if (!f) return;

    // Loose validation and helpful feedback
    if (type === "image" && !f.type.startsWith("image")) {
      toast.error("Please drop an image file");
      return;
    }
    if (type === "video" && !f.type.startsWith("video")) {
      toast.error("Please drop a video file");
      return;
    }

    const preview = URL.createObjectURL(f);
    setForm((prev) => ({
      ...prev,
      [type]: { ...prev[type], file: f, preview },
    }));
  };

  const handleDragEnter = (type, e) => {
    e.preventDefault();
    setHighlightSection(type);
  };
  const handleDragLeave = () => setHighlightSection("");

  // Clear the selected file/preview for a given type (image/video/link)
  const clearSelected = (type) => {
    setForm((prev) => {
      const prevPreview = prev[type]?.preview;
      if (
        prevPreview &&
        prevPreview.startsWith &&
        prevPreview.startsWith("blob:")
      ) {
        try {
          URL.revokeObjectURL(prevPreview);
        } catch (err) {
          console.error(err);
        }
      }

      if (type === "link") {
        if (linkFileInputRef.current) linkFileInputRef.current.value = null;
        return {
          ...prev,
          link: { ...prev.link, file: null, preview: null, url: "" },
        };
      }

      if (type === "image") {
        if (imageInputRef.current) imageInputRef.current.value = null;
      }
      if (type === "video") {
        if (videoInputRef.current) videoInputRef.current.value = null;
      }

      return { ...prev, [type]: { ...prev[type], file: null, preview: null } };
    });
  };

  const updateFormField = (type, field, value) =>
    setForm((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
  const addToReview = async (type) => {
    const src = form[type];

    if (type === "image" && !src.file) {
      toast.error("Please select an image first.");
      return;
    }
    if (type === "video" && !src.file) {
      toast.error("Please select a video first.");
      return;
    }
    if (type === "link" && !src.file && !src.url) {
      toast.error("Please add a link or photo first.");
      return;
    }

    const stylist = src.stylist;
    const date = src.date || new Date().toISOString().slice(0, 10);

    const combo = {
      id: `combo_${Math.random().toString(36).slice(2)}`,
      stylist,
      date,
      image: null,
      video: null,
      link: null,
      uploadedCount: 0,
    };

    if (type === "image") {
      combo.image = {
        file: src.file,
        preview: src.preview,
        caption: src.caption,
        backendId: null,
        uploaded: false,
        publishedToWeb: false,
      };
    }
    if (type === "video") {
      combo.video = {
        file: src.file,
        preview: src.preview,
        caption: src.caption,
        backendId: null,
        uploaded: false,
        publishedToWeb: false,
      };
    }
    if (type === "link") {
      combo.link = {
        file: src.file,
        // if user provided a URL but no file, use the URL as preview so the review shows something
        preview: src.preview || (src.url ? src.url : null),
        url: src.url,
        caption: src.caption,
        platform: src.platform,
        backendId: null,
        uploaded: false,
        publishedToWeb: false,
      };
    }

    setReviewItems((prev) => [...prev, combo]);

    // Create a draft row for that media only
    try {
      const body = {
        type,
        caption: src.caption,
        stylist,
        date,
      };
      if (type === "link") {
        body.platform = src.platform;
        body.url = src.url;
      }

      const r = await axios.post(`${API_BASE}/api/uploads/draft`, body);
      if (r.data?.media) {
        setReviewItems((p) =>
          p.map((c) =>
            c.id === combo.id
              ? {
                  ...c,
                  [type]: {
                    ...c[type],
                    backendId: r.data.media._id,
                  },
                }
              : c
          )
        );
      }
    } catch (e) {
      console.error("Error creating draft:", e);
    }

    // Reset ONLY that form type; keep others as-is
    setForm((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        file: null,
        preview: null,
        caption: "",
        // stylist stays so user doesn’t retype for every upload
        date: new Date().toISOString().slice(0, 10),
        ...(type === "link" ? { url: "" } : {}),
      },
    }));
    if (type === "image" && imageInputRef.current)
      imageInputRef.current.value = null;
    if (type === "video" && videoInputRef.current)
      videoInputRef.current.value = null;
    if (type === "link" && linkFileInputRef.current)
      linkFileInputRef.current.value = null;
  };

  const uploadSingleToServer = async (item, type) => {
    // pure link (only URL)
    if (type === "link" && !item.file) {
      const body = {
        platform: item.platform,
        url: item.url,
        caption: item.caption,
        stylist: item.stylist || "",
        date: item.date || "",
      };
      if (item.backendId) body.draftId = item.backendId;
      const r = await axios.post(`${API_BASE}/api/uploads/link`, body);
      return r.data;
    }

    if (!item.file) {
      throw new Error("No file or URL to upload");
    }

    const fd = new FormData();
    fd.append("file", item.file);
    fd.append("caption", item.caption || "");
    fd.append("stylist", item.stylist || "");
    fd.append("date", item.date || "");
    fd.append("type", type);
    if (item.backendId) fd.append("draftId", item.backendId);

    const r = await axios.post(`${API_BASE}/api/uploads/media`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  };

  // NOTE: Bulk "Upload All" behavior removed. The staging/review area now only holds local previews and metadata.
  // Actual upload to Cloudinary is performed when a user clicks "Publish" on an individual item.

  const handlePublish = async (comboId, type) => {
    const combo = reviewItems.find((c) => c.id === comboId);
    if (!combo) return;
    let item = combo[type];
    if (!item) return;

    setUploadingState((s) => ({ ...s, [comboId]: true }));
    try {
      // If not uploaded yet, upload now (this will call backend/media endpoint)
      let uploadResp = null;
      if (!item.uploaded) {
        uploadResp = await uploadSingleToServer(
          { ...item, stylist: combo.stylist, date: combo.date },
          type
        );
        if (uploadResp?.ok && uploadResp.media) {
          const media = uploadResp.media;
          setReviewItems((p) =>
            p.map((c) =>
              c.id === comboId
                ? {
                    ...c,
                    [type]: {
                      ...c[type],
                      preview: media.url || media.secure_url,
                      file: null,
                      uploaded: true,
                      backendId: media._id,
                    },
                    uploadedCount: c.uploadedCount + 1,
                  }
                : c
            )
          );
          // reflect new item for next step
          item = { ...item, uploaded: true, backendId: media._id };
        } else {
          toast.error("Upload failed");
          return;
        }
      }

      // Ensure we have backendId before publishing
      const backendId = item.backendId;
      if (!backendId) {
        toast.error("Missing backend id; cannot publish");
        return;
      }

      // Call publish endpoint which should publish to web
      const r = await axios.put(
        `${API_BASE}/api/uploads/${backendId}/publish`,
        { publish: true }
      );
      if (r.data?.ok) {
        setReviewItems((p) =>
          p.map((c) =>
            c.id === comboId
              ? { ...c, [type]: { ...c[type], publishedToWeb: true } }
              : c
          )
        );
        toast.success("Published to web");
      }
    } catch (e) {
      console.error("Error publishing:", e);
      toast.error("Error publishing item");
    } finally {
      setUploadingState((s) => ({ ...s, [comboId]: false }));
    }
  };

  const handleUnpublish = async (comboId, type) => {
    const combo = reviewItems.find((c) => c.id === comboId);
    const item = combo?.[type];
    if (!item?.backendId) return;
    try {
      // Ask backend to remove the asset from Cloudinary (if supported)
      const r = await axios.put(
        `${API_BASE}/api/uploads/${item.backendId}/publish`,
        { publish: false, removeCloud: true }
      );
      if (r.data?.ok) {
        // Keep the draft entry but mark it as not published
        setReviewItems((p) =>
          p.map((c) =>
            c.id === comboId
              ? { ...c, [type]: { ...c[type], publishedToWeb: false } }
              : c
          )
        );
        toast.success("Unpublished (removed from web)");
      }
    } catch (e) {
      console.error("Error unpublishing:", e);
      toast.error("Error unpublishing item");
    }
  };

  const handleDelete = async (comboId, type) => {
    const combo = reviewItems.find((c) => c.id === comboId);
    const item = combo?.[type];

    if (item?.backendId) {
      const confirmDelete = window.confirm(
        "This will delete the item from the server (and Cloudinary if published). Are you sure?"
      );
      if (!confirmDelete) return;

      try {
        setUploadingState((s) => ({ ...s, [comboId]: true }));
        const resp = await axios.delete(
          `${API_BASE}/api/uploads/${item.backendId}`
        );
        console.log("[handleDelete] delete response:", resp.data);
        if (!resp.data?.ok) {
          toast.error(
            "Could not delete on server: " + (resp.data?.error || "unknown")
          );
          return;
        }
        await loadUploads();
        return;
      } catch (e) {
        console.error("Error deleting on server:", e);
        toast.error("Error deleting item on server. See console for details.");
        return;
      } finally {
        setUploadingState((s) => ({ ...s, [comboId]: false }));
      }
    }
    if (item?.preview && item.preview.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
    }

    setReviewItems((prev) => {
      const updated = prev.map((c) =>
        c.id === comboId ? { ...c, [type]: null } : c
      );
      const filtered = updated.filter((c) => c.image || c.video || c.link);
      return filtered;
    });
  };

  const canStageImage = !!form.image.file;
  const canStageVideo = !!form.video.file;
  const canStageLink = !!(form.link.url || form.link.file);

  // There are staged items in the form that can be added to review
  const canReviewAny = canStageImage || canStageVideo || canStageLink;

  const handleReviewAll = async () => {
    try {
      if (canStageImage) await addToReview("image");
      if (canStageVideo) await addToReview("video");
      if (canStageLink) await addToReview("link");
      toast.success("Added to review");
    } catch (e) {
      console.error("Error adding to review:", e);
      toast.error("Could not add items to review");
    }
  };

  return (
    <div className="p-6 bg-white text-gray-800 min-h-screen w-355 pl-76">
      {/* Header */}
      <div className="flex items-center justify-between max-w-7xl mx-auto mb-6">
        <div>
          <h1 className="text-2xl font-bold">Upload Gallery</h1>
          <p className="text-sm text-gray-500">
            Upload real-time photos, videos & links of your work to showcase on
            your salon portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSection}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSection(val);
              if (val !== "all") {
                const refMap = {
                  image: imageSectionRef,
                  video: videoSectionRef,
                  link: linkSectionRef,
                };
                const r = refMap[val];
                if (r && r.current) {
                  r.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  setHighlightSection(val);
                  setTimeout(() => setHighlightSection(""), 2200);
                }
              }
            }}
            className="p-2 rounded border border-gray-300 text-sm"
            aria-label="Filter upload sections"
          >
            <option value="all">Show: All</option>
            <option value="image">Upload Photo</option>
            <option value="video">Upload Video</option>
            <option value="link">Upload Link & Photo</option>
          </select>

          <button
            onClick={handleReviewAll}
            disabled={!canReviewAny}
            className={`px-4 py-2 rounded-md font-semibold transition ${
              canReviewAny
                ? "bg-[#D3AF37]  hover:bg-yellow-500 text-black"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Review All
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Upload Photo */}
        {(selectedSection === "all" || selectedSection === "image") && (
          <div
            ref={imageSectionRef}
            className={`bg-white rounded-lg p-6 border ${
              highlightSection === "image"
                ? "ring-2 ring-yellow-300 bg-yellow-50"
                : ""
            }`}
          >
            <h2 className="text-base font-semibold mb-3">Upload Photo</h2>
            <div
              className={`h-56 relative border-2 border-dashed rounded-lg flex items-center justify-center mb-4 cursor-pointer overflow-hidden ${
                highlightSection === "image"
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-black"
              }`}
              onDragOver={onDragOver}
              onDrop={(e) => handleFileDrop(e, "image")}
              onDragEnter={(e) => handleDragEnter("image", e)}
              onDragLeave={handleDragLeave}
              onClick={() => imageInputRef.current?.click()}
              role="button"
              aria-label="Upload photo drop area"
            >
              {form.image.preview ? (
                <>
                  <img
                    src={form.image.preview}
                    alt="preview"
                    className="w-full h-full object-contain"
                  />

                  {/* Cancel button overlay */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelected("image");
                    }}
                    className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1 shadow text-red-600 hover:bg-opacity-100"
                    aria-label="Remove selected photo"
                  >
                    ✕
                  </button>

                  {/* filename overlay */}
                  <div className="absolute left-3 bottom-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {form.image.file?.name || "Selected"}
                  </div>
                </>
              ) : (
                <div className="text-center px-4">
                  <div className="text-sm font-medium">
                    Drag and drop photos here
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Or click to browse your files
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Accepted: jpg, png, webp
                  </div>
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "image")}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <input
                type="text"
                placeholder="Enter captions"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.image.caption}
                onChange={(e) =>
                  updateFormField("image", "caption", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Stylist"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.image.stylist}
                onChange={(e) =>
                  updateFormField("image", "stylist", e.target.value)
                }
              />
              <input
                type="date"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.image.date}
                onChange={(e) =>
                  updateFormField("image", "date", e.target.value)
                }
              />
              <button
                onClick={() => addToReview("image")}
                disabled={!canStageImage}
                className={`w-full md:w-auto px-4 py-2 rounded text-xs font-semibold ${
                  canStageImage
                    ? "bg-[#D3AF37]  hover:bg-yellow-600 text-black"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Add to Review
              </button>
            </div>
          </div>
        )}

        {/* Upload Video */}
        {(selectedSection === "all" || selectedSection === "video") && (
          <div
            ref={videoSectionRef}
            className={`bg-white rounded-lg p-6 border ${
              highlightSection === "video"
                ? "ring-2 ring-yellow-300 bg-yellow-50"
                : ""
            }`}
          >
            <h2 className="text-base font-semibold mb-3">Upload Video</h2>
            <div
              className={`h-56 relative border-2 border-dashed rounded-lg flex items-center justify-center mb-4 cursor-pointer overflow-hidden ${
                highlightSection === "video"
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-black"
              }`}
              onDragOver={onDragOver}
              onDrop={(e) => handleFileDrop(e, "video")}
              onDragEnter={(e) => handleDragEnter("video", e)}
              onDragLeave={handleDragLeave}
              onClick={() => videoInputRef.current?.click()}
              role="button"
              aria-label="Upload video drop area"
            >
              {form.video.preview ? (
                <>
                  <video
                    src={form.video.preview}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelected("video");
                    }}
                    className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1 shadow text-red-600 hover:bg-opacity-100"
                    aria-label="Remove selected video"
                  >
                    ✕
                  </button>

                  <div className="absolute left-3 bottom-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {form.video.file?.name || "Selected"}
                  </div>
                </>
              ) : (
                <div className="text-center px-4">
                  <div className="text-sm font-medium">
                    Drag and drop video here
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Or click to browse your files
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Accepted: mp4, mov, webm
                  </div>
                </div>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e, "video")}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <input
                type="text"
                placeholder="Enter captions"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.video.caption}
                onChange={(e) =>
                  updateFormField("video", "caption", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Stylist"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.video.stylist}
                onChange={(e) =>
                  updateFormField("video", "stylist", e.target.value)
                }
              />
              <input
                type="date"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.video.date}
                onChange={(e) =>
                  updateFormField("video", "date", e.target.value)
                }
              />
              <button
                onClick={() => addToReview("video")}
                disabled={!canStageVideo}
                className={`w-full md:w-auto px-4 py-2 rounded text-xs font-semibold ${
                  canStageVideo
                    ? "bg-[#D3AF37]  hover:bg-yellow-600 text-black"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Add to Review
              </button>
            </div>
          </div>
        )}

        {/* Upload Link & Photo */}
        {(selectedSection === "all" || selectedSection === "link") && (
          <div
            ref={linkSectionRef}
            className={`bg-white rounded-lg p-6 border ${
              highlightSection === "link"
                ? "ring-2 ring-yellow-300 bg-yellow-50"
                : ""
            }`}
          >
            <h2 className="text-base font-semibold mb-3">
              Upload Link and Photo
            </h2>

            {/* Link area */}
            <div className="mb-4">
              <div className="h-28 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-center px-4">
                <div className="text-sm font-medium">
                  Paste your social link
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Instagram, Facebook, etc.
                </div>
                <input
                  type="text"
                  placeholder="Paste link here"
                  className="w-full md:w-2/3 p-2 rounded border border-gray-300 text-xs"
                  value={form.link.url}
                  onChange={(e) =>
                    updateFormField("link", "url", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Optional photo for link */}
            <div
              className={`h-40 relative border-2 border-dashed rounded-lg flex items-center justify-center mb-4 cursor-pointer overflow-hidden ${
                highlightSection === "link"
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-black"
              }`}
              onDragOver={onDragOver}
              onDrop={(e) => handleFileDrop(e, "link")}
              onDragEnter={(e) => handleDragEnter("link", e)}
              onDragLeave={handleDragLeave}
              onClick={() => linkFileInputRef.current?.click()}
              role="button"
              aria-label="Upload link/photo drop area"
            >
              {form.link.preview ? (
                <>
                  <img
                    src={form.link.preview}
                    alt="preview"
                    className="w-full h-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelected("link");
                    }}
                    className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1 shadow text-red-600 hover:bg-opacity-100"
                    aria-label="Remove selected link photo"
                  >
                    ✕
                  </button>

                  <div className="absolute left-3 bottom-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {form.link.file?.name ||
                      (form.link.url ? "Link" : "Selected")}
                  </div>
                </>
              ) : (
                <div className="text-center px-4">
                  <div className="text-sm font-medium">
                    Drag and drop photo here (optional)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Or click to browse your files
                  </div>
                </div>
              )}

              <input
                ref={linkFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "link")}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <input
                type="text"
                placeholder="Enter captions"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.link.caption}
                onChange={(e) =>
                  updateFormField("link", "caption", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Stylist"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.link.stylist}
                onChange={(e) =>
                  updateFormField("link", "stylist", e.target.value)
                }
              />
              <input
                type="date"
                className="p-2 rounded border border-gray-300 text-xs"
                value={form.link.date}
                onChange={(e) =>
                  updateFormField("link", "date", e.target.value)
                }
              />
              <button
                onClick={() => addToReview("link")}
                disabled={!canStageLink}
                className={`w-full md:w-auto px-4 py-2 rounded text-xs font-semibold ${
                  canStageLink
                    ? "bg-[#D3AF37]  hover:bg-yellow-600 text-black"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Add to Review
              </button>
            </div>
          </div>
        )}

        {/* Review section */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Review ({reviewItems.length})
          </h3>
          {reviewItems.length === 0 ? (
            <div className="text-sm text-gray-500 py-10 text-center">
              No items
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {reviewItems.map((combo) => (
                <div
                  key={combo.id}
                  className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {combo.stylist || "—"}{" "}
                        <span className="text-gray-400">•</span>{" "}
                        <span className="text-gray-600 text-xs">
                          {combo.date}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {combo.uploadedCount}/
                        {(combo.image ? 1 : 0) +
                          (combo.video ? 1 : 0) +
                          (combo.link ? 1 : 0)}{" "}
                        uploaded
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* IMAGE CARD */}
                    {combo.image && (
                      <div className="text-center border rounded p-2 bg-gray-50">
                        <div className="h-20 mb-2 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          {combo.image.preview ? (
                            <img
                              src={combo.image.preview}
                              className="w-full h-full object-cover"
                              alt="img"
                            />
                          ) : (
                            "📷"
                          )}
                        </div>
                        {/* Caption (editable) */}
                        <input
                          type="text"
                          value={combo.image.caption || ""}
                          onChange={(e) =>
                            setReviewItems((prev) =>
                              prev.map((c) =>
                                c.id === combo.id
                                  ? {
                                      ...c,
                                      image: { ...c.image, caption: e.target.value },
                                    }
                                  : c
                              )
                            )
                          }
                          onBlur={async (e) => {
                            const id = combo.image.backendId;
                            if (id) await updateDraft(id, { caption: e.target.value });
                          }}
                          className="text-xs text-gray-600 mb-2 max-w-full truncate border rounded p-1"
                          placeholder="Add caption"
                        />
                        <div className="text-xs font-semibold mb-2">
                          IMAGE{" "}
                          {combo.image.uploaded && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>

                        <div className="flex gap-2 justify-center">
                          {/* Always expose Publish when not published; Publish will upload first if needed */}
                          {combo.image.publishedToWeb ? (
                            <button
                              onClick={() => handleUnpublish(combo.id, "image")}
                              disabled={!!uploadingState[combo.id]}
                              className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md disabled:opacity-60"
                            >
                              Unpub
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(combo.id, "image")}
                              disabled={!!uploadingState[combo.id]}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded-md disabled:opacity-60"
                            >
                              {uploadingState[combo.id] ? "Uploading..." : "Publish"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(combo.id, "image")}
                            disabled={!!uploadingState[combo.id]}
                            className="px-2 py-1 text-red-600 border border-red-200 text-xs rounded-md disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* VIDEO CARD */}
                    {combo.video && (
                      <div className="text-center border rounded p-2 bg-gray-50">
                        <div className="h-20 mb-2 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          {combo.video.preview ? (
                            <video
                              src={combo.video.preview}
                              className="w-full h-full object-cover"
                              controls
                              playsInline
                            />
                          ) : (
                            "🎥"
                          )}
                        </div>

                        <input
                          type="text"
                          value={combo.video.caption || ""}
                          onChange={(e) =>
                            setReviewItems((prev) =>
                              prev.map((c) =>
                                c.id === combo.id
                                  ? { ...c, video: { ...c.video, caption: e.target.value } }
                                  : c
                              )
                            )
                          }
                          onBlur={async (e) => {
                            const id = combo.video.backendId;
                            if (id) await updateDraft(id, { caption: e.target.value });
                          }}
                          className="text-xs text-gray-600 mb-2 max-w-full truncate border rounded p-1"
                          placeholder="Add caption"
                        />

                        <div className="text-xs font-semibold mb-2">
                          VIDEO{" "}
                          {combo.video.uploaded && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center">
                          {combo.video.publishedToWeb ? (
                            <button
                              onClick={() => handleUnpublish(combo.id, "video")}
                              disabled={!!uploadingState[combo.id]}
                              className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md disabled:opacity-60"
                            >
                              Unpub
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(combo.id, "video")}
                              disabled={!!uploadingState[combo.id]}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded-md disabled:opacity-60"
                            >
                              {uploadingState[combo.id] ? "Uploading..." : "Publish"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(combo.id, "video")}
                            disabled={!!uploadingState[combo.id]}
                            className="px-2 py-1 text-red-600 border border-red-200 text-xs rounded-md disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* LINK CARD */}
                    {combo.link && (
                      <div className="text-center border rounded p-2 bg-gray-50">
                        <div className="h-20 mb-2 bg-gray-100 rounded overflow-hidden p-1 flex items-center justify-center">
                          {combo.link.preview ? (
                            <img
                              src={combo.link.preview}
                              className="w-full h-full object-cover"
                              alt="link"
                            />
                          ) : combo.link.url ? (
                            <a
                              href={combo.link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 text-sm truncate block"
                            >
                              {combo.link.url}
                            </a>
                          ) : (
                            "🔗"
                          )}
                        </div>

                        <input
                          type="text"
                          value={combo.link.caption || ""}
                          onChange={(e) =>
                            setReviewItems((prev) =>
                              prev.map((c) =>
                                c.id === combo.id
                                  ? { ...c, link: { ...c.link, caption: e.target.value } }
                                  : c
                              )
                            )
                          }
                          onBlur={async (e) => {
                            const id = combo.link.backendId;
                            if (id) await updateDraft(id, { caption: e.target.value });
                          }}
                          className="text-xs text-gray-600 mb-2 max-w-full truncate border rounded p-1"
                          placeholder="Add caption"
                        />

                        <div className="text-xs font-semibold mb-2">
                          LINK{" "}
                          {combo.link.uploaded && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center">
                          {combo.link.publishedToWeb ? (
                            <button
                              onClick={() => handleUnpublish(combo.id, "link")}
                              disabled={!!uploadingState[combo.id]}
                              className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md disabled:opacity-60"
                            >
                              Unpub
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(combo.id, "link")}
                              disabled={!!uploadingState[combo.id]}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded-md disabled:opacity-60"
                            >
                              {uploadingState[combo.id] ? "Uploading..." : "Publish"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(combo.id, "link")}
                            disabled={!!uploadingState[combo.id]}
                            className="px-2 py-1 text-red-600 border border-red-200 text-xs rounded-md disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
