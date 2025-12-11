// src/pages/Uploadimg.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

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

  const updateFormField = (type, field, value) =>
    setForm((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
  const addToReview = async (type) => {
    const src = form[type];

    if (type === "image" && !src.file) {
      alert("Please select an image first.");
      return;
    }
    if (type === "video" && !src.file) {
      alert("Please select a video first.");
      return;
    }
    if (type === "link" && !src.file && !src.url) {
      alert("Please add a link or photo first.");
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
        preview: src.preview,
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

  const handleUploadAll = async () => {
    for (const combo of reviewItems) {
      // image
      if (combo.image && !combo.image.uploaded && combo.image.file) {
        setUploadingState((s) => ({ ...s, [combo.id]: true }));
        try {
          const d = await uploadSingleToServer(
            { ...combo.image, stylist: combo.stylist, date: combo.date },
            "image"
          );
          if (d?.ok && d.media) {
            setReviewItems((p) =>
              p.map((c) =>
                c.id === combo.id
                  ? {
                      ...c,
                      image: {
                        ...c.image,
                        preview: d.media.url || d.media.secure_url,
                        file: null,
                        uploaded: true,
                        backendId: d.media._id,
                      },
                      uploadedCount: c.uploadedCount + 1,
                    }
                  : c
              )
            );
          }
        } catch (e) {
          console.error("Error uploading image:", e);
        } finally {
          setUploadingState((s) => ({ ...s, [combo.id]: false }));
        }
      }

      // video
      if (combo.video && !combo.video.uploaded && combo.video.file) {
        setUploadingState((s) => ({ ...s, [combo.id]: true }));
        try {
          const d = await uploadSingleToServer(
            { ...combo.video, stylist: combo.stylist, date: combo.date },
            "video"
          );
          if (d?.ok && d.media) {
            setReviewItems((p) =>
              p.map((c) =>
                c.id === combo.id
                  ? {
                      ...c,
                      video: {
                        ...c.video,
                        preview: d.media.url || d.media.secure_url,
                        file: null,
                        uploaded: true,
                        backendId: d.media._id,
                      },
                      uploadedCount: c.uploadedCount + 1,
                    }
                  : c
              )
            );
          }
        } catch (e) {
          console.error("Error uploading video:", e);
        } finally {
          setUploadingState((s) => ({ ...s, [combo.id]: false }));
        }
      }

      // link (URL or URL+image)
      if (
        combo.link &&
        !combo.link.uploaded &&
        (combo.link.file || combo.link.url)
      ) {
        setUploadingState((s) => ({ ...s, [combo.id]: true }));
        try {
          const d = await uploadSingleToServer(
            { ...combo.link, stylist: combo.stylist, date: combo.date },
            "link"
          );
          if (d?.ok && d.media) {
            setReviewItems((p) =>
              p.map((c) =>
                c.id === combo.id
                  ? {
                      ...c,
                      link: {
                        ...c.link,
                        preview: d.media.url || d.media.secure_url,
                        file: null,
                        uploaded: true,
                        backendId: d.media._id,
                      },
                      uploadedCount: c.uploadedCount + 1,
                    }
                  : c
              )
            );
          }
        } catch (e) {
          console.error("Error uploading link:", e);
        } finally {
          setUploadingState((s) => ({ ...s, [combo.id]: false }));
        }
      }
    }
    alert("Upload complete");
  };

  const handlePublish = async (comboId, type) => {
    const combo = reviewItems.find((c) => c.id === comboId);
    if (!combo) return;
    const item = combo[type];
    if (!item?.backendId) {
      alert("Upload first");
      return;
    }
    try {
      const r = await axios.put(
        `${API_BASE}/api/uploads/${item.backendId}/publish`,
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
      }
    } catch (e) {
      console.error("Error publishing:", e);
    }
  };

  const handleUnpublish = async (comboId, type) => {
    const combo = reviewItems.find((c) => c.id === comboId);
    const item = combo?.[type];
    if (!item?.backendId) return;
    try {
      const r = await axios.put(
        `${API_BASE}/api/uploads/${item.backendId}/publish`,
        { publish: false }
      );
      if (r.data?.ok) {
        setReviewItems((p) =>
          p.map((c) =>
            c.id === comboId
              ? { ...c, [type]: { ...c[type], publishedToWeb: false } }
              : c
          )
        );
      }
    } catch (e) {
      console.error("Error unpublishing:", e);
    }
  };

  const handleDelete = async (comboId, type) => {
    const combo = reviewItems.find((c) => c.id === comboId);
    const item = combo?.[type];

    if (item?.backendId) {
      try {
        const resp = await axios.delete(
          `${API_BASE}/api/uploads/${item.backendId}`
        );
        console.log("[handleDelete] delete response:", resp.data);
        if (!resp.data?.ok) {
          alert(
            "Could not delete on server: " + (resp.data?.error || "unknown")
          );
          return;
        }
        await loadUploads();
        return;
      } catch (e) {
        console.error("Error deleting on server:", e);
        alert("Error deleting item on server. See console for details.");
        return;
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

  const canUploadAny = reviewItems.some(
    (c) =>
      (c.image && !c.image.uploaded && c.image.file) ||
      (c.video && !c.video.uploaded && c.video.file) ||
      (c.link && !c.link.uploaded && (c.link.file || c.link.url))
  );

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
            onClick={handleUploadAll}
            disabled={!canUploadAny}
            className={`px-4 py-2 rounded-md font-semibold transition ${
              canUploadAny
                ? "bg-[#D3AF37]  hover:bg-yellow-500 text-black"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Upload All
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
              className="h-40 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-center mb-4"
              onDragOver={onDragOver}
            >
              <div className="text-sm font-medium">
                Drag and drop photos here
              </div>
              <div className="text-xs text-gray-500">
                Or click to browse your files
              </div>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="mt-3 px-4 py-2 bg-[#D3AF37]  text-black rounded shadow-sm text-xs"
              >
                Select Photo
              </button>
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
              className="h-40 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-center mb-4"
              onDragOver={onDragOver}
            >
              <div className="text-sm font-medium">
                Drag and drop video here
              </div>
              <div className="text-xs text-gray-500">
                Or click to browse your files
              </div>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="mt-3 px-4 py-2 bg-[#D3AF37]  text-black rounded shadow-sm text-xs"
              >
                Select Video
              </button>
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
              className="h-32 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-center mb-4"
              onDragOver={onDragOver}
            >
              <div className="text-sm font-medium">
                Drag and drop photo here (optional)
              </div>
              <div className="text-xs text-gray-500">
                Or click to browse your files
              </div>
              <button
                onClick={() => linkFileInputRef.current?.click()}
                className="mt-3 px-4 py-2 bg-[#D3AF37]  text-black rounded shadow-sm text-xs"
              >
                Select Photo
              </button>
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
                        {combo.image.caption && (
                          <div
                            className="text-xs text-gray-600 mb-2 max-w-full truncate"
                            title={combo.image.caption}
                          >
                            {combo.image.caption}
                          </div>
                        )}
                        <div className="text-xs font-semibold mb-2">
                          IMAGE{" "}
                          {combo.image.uploaded && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center">
                          {!combo.image.uploaded && combo.image.file && (
                            <button
                              onClick={() => {
                                setUploadingState((s) => ({
                                  ...s,
                                  [combo.id]: true,
                                }));
                                uploadSingleToServer(
                                  {
                                    ...combo.image,
                                    stylist: combo.stylist,
                                    date: combo.date,
                                  },
                                  "image"
                                )
                                  .then((d) => {
                                    if (d?.ok && d.media)
                                      setReviewItems((p) =>
                                        p.map((c) =>
                                          c.id === combo.id
                                            ? {
                                                ...c,
                                                image: {
                                                  ...c.image,
                                                  preview:
                                                    d.media.url ||
                                                    d.media.secure_url,
                                                  file: null,
                                                  uploaded: true,
                                                  backendId: d.media._id,
                                                },
                                                uploadedCount:
                                                  c.uploadedCount + 1,
                                              }
                                            : c
                                        )
                                      );
                                  })
                                  .finally(() =>
                                    setUploadingState((s) => ({
                                      ...s,
                                      [combo.id]: false,
                                    }))
                                  );
                              }}
                              className="px-2 py-1 bg-yellow-400 text-black text-xs rounded-md"
                            >
                              Upload
                            </button>
                          )}
                          {combo.image.uploaded &&
                            (combo.image.publishedToWeb ? (
                              <button
                                onClick={() =>
                                  handleUnpublish(combo.id, "image")
                                }
                                className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md"
                              >
                                Unpub
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePublish(combo.id, "image")}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded-md"
                              >
                                Publish
                              </button>
                            ))}
                          <button
                            onClick={() => handleDelete(combo.id, "image")}
                            className="px-2 py-1 text-red-600 border border-red-200 text-xs rounded-md"
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
                            />
                          ) : (
                            "🎥"
                          )}
                        </div>
                        {combo.video.caption && (
                          <div
                            className="text-xs text-gray-600 mb-2 max-w-full truncate"
                            title={combo.video.caption}
                          >
                            {combo.video.caption}
                          </div>
                        )}
                        <div className="text-xs font-semibold mb-2">
                          VIDEO{" "}
                          {combo.video.uploaded && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center">
                          {!combo.video.uploaded && combo.video.file && (
                            <button
                              onClick={() => {
                                setUploadingState((s) => ({
                                  ...s,
                                  [combo.id]: true,
                                }));
                                uploadSingleToServer(
                                  {
                                    ...combo.video,
                                    stylist: combo.stylist,
                                    date: combo.date,
                                  },
                                  "video"
                                )
                                  .then((d) => {
                                    if (d?.ok && d.media)
                                      setReviewItems((p) =>
                                        p.map((c) =>
                                          c.id === combo.id
                                            ? {
                                                ...c,
                                                video: {
                                                  ...c.video,
                                                  preview:
                                                    d.media.url ||
                                                    d.media.secure_url,
                                                  file: null,
                                                  uploaded: true,
                                                  backendId: d.media._id,
                                                },
                                                uploadedCount:
                                                  c.uploadedCount + 1,
                                              }
                                            : c
                                        )
                                      );
                                  })
                                  .finally(() =>
                                    setUploadingState((s) => ({
                                      ...s,
                                      [combo.id]: false,
                                    }))
                                  );
                              }}
                              className="px-2 py-1 bg-yellow-400 text-black text-xs rounded-md"
                            >
                              Upload
                            </button>
                          )}
                          {combo.video.uploaded &&
                            (combo.video.publishedToWeb ? (
                              <button
                                onClick={() =>
                                  handleUnpublish(combo.id, "video")
                                }
                                className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md"
                              >
                                Unpub
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePublish(combo.id, "video")}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded-md"
                              >
                                Publish
                              </button>
                            ))}
                          <button
                            onClick={() => handleDelete(combo.id, "video")}
                            className="px-2 py-1 text-red-600 border border-red-200 text-xs rounded-md"
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
                        {combo.link.caption && (
                          <div
                            className="text-xs text-gray-600 mb-2 max-w-full truncate"
                            title={combo.link.caption}
                          >
                            {combo.link.caption}
                          </div>
                        )}
                        <div className="text-xs font-semibold mb-2">
                          LINK{" "}
                          {combo.link.uploaded && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center">
                          {!combo.link.uploaded &&
                            (combo.link.file || combo.link.url) && (
                              <button
                                onClick={() => {
                                  setUploadingState((s) => ({
                                    ...s,
                                    [combo.id]: true,
                                  }));
                                  uploadSingleToServer(
                                    {
                                      ...combo.link,
                                      stylist: combo.stylist,
                                      date: combo.date,
                                    },
                                    "link"
                                  )
                                    .then((d) => {
                                      if (d?.ok && d.media)
                                        setReviewItems((p) =>
                                          p.map((c) =>
                                            c.id === combo.id
                                              ? {
                                                  ...c,
                                                  link: {
                                                    ...c.link,
                                                    preview:
                                                      d.media.url ||
                                                      d.media.secure_url,
                                                    file: null,
                                                    uploaded: true,
                                                    backendId: d.media._id,
                                                  },
                                                  uploadedCount:
                                                    c.uploadedCount + 1,
                                                }
                                              : c
                                          )
                                        );
                                    })
                                    .finally(() =>
                                      setUploadingState((s) => ({
                                        ...s,
                                        [combo.id]: false,
                                      }))
                                    );
                                }}
                                className="px-2 py-1 bg-yellow-400 text-black text-xs rounded-md"
                              >
                                Upload
                              </button>
                            )}
                          {combo.link.uploaded &&
                            (combo.link.publishedToWeb ? (
                              <button
                                onClick={() =>
                                  handleUnpublish(combo.id, "link")
                                }
                                className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md"
                              >
                                Unpub
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePublish(combo.id, "link")}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded-md"
                              >
                                Publish
                              </button>
                            ))}
                          <button
                            onClick={() => handleDelete(combo.id, "link")}
                            className="px-2 py-1 text-red-600 border border-red-200 text-xs rounded-md"
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
