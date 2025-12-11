import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const SAMPLE_PREVIEW = "/mnt/data/Screenshot 2025-11-24 173151.png";
const API_BASE = "http://localhost:5000"; // change if needed

export default function Uploadimg() {
  // confirmed items (appear in Review) — include `uploaded` flag and backend id
  const [imageForm, setImageForm] = useState({
    file: null,
    preview: null,
    caption: "",
    stylist: "",
    date: new Date().toISOString().slice(0, 10),
    id: null, // backend _id after upload
    uploaded: false,
  });
  const [videoForm, setVideoForm] = useState({
    file: null,
    preview: null,
    caption: "",
    stylist: "",
    date: new Date().toISOString().slice(0, 10),
    id: null,
    uploaded: false,
  });
  const [linkForm, setLinkForm] = useState({
    platform: "Instagram",
    url: "",
    file: null,
    preview: null,
    caption: "",
    stylist: "",
    date: new Date().toISOString().slice(0, 10),
    id: null,
    uploaded: false,
  });

  // staged items (selected by user but NOT yet in Review)
  const [stagedImage, setStagedImage] = useState(null); // { file, preview }
  const [stagedVideo, setStagedVideo] = useState(null);
  const [stagedLink, setStagedLink] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadingState, setUploadingState] = useState({
    image: false,
    video: false,
    link: false,
  });

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const linkFileInputRef = useRef(null);

  // Derived review items come only from confirmed forms (not staged)
  const reviewItems = [
    imageForm.file || imageForm.preview
      ? { type: "image", ...imageForm }
      : null,
    videoForm.file || videoForm.preview
      ? { type: "video", ...videoForm }
      : null,
    linkForm.url || linkForm.file || linkForm.preview
      ? { type: "link", ...linkForm }
      : null,
  ].filter(Boolean);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      [
        imageForm.preview,
        videoForm.preview,
        linkForm.preview,
        stagedImage?.preview,
        stagedVideo?.preview,
        stagedLink?.preview,
      ].forEach((p) => {
        if (p && p.startsWith && p.startsWith("blob:")) URL.revokeObjectURL(p);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignId = (obj) => ({
    ...obj,
    id: obj.id || Math.random().toString(36).slice(2),
  });

  const setImageField = (field, value) =>
    setImageForm((p) => assignId({ ...p, [field]: value }));
  const setVideoField = (field, value) =>
    setVideoForm((p) => assignId({ ...p, [field]: value }));
  const setLinkField = (field, value) =>
    setLinkForm((p) => assignId({ ...p, [field]: value }));

  // ---------------------- STAGING BEHAVIOR ----------------------
  const handleFileSelect = (file, type) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === "image") {
      if (stagedImage?.preview && stagedImage.preview.startsWith("blob:"))
        URL.revokeObjectURL(stagedImage.preview);
      setStagedImage({ file, preview });
    }
    if (type === "video") {
      if (stagedVideo?.preview && stagedVideo.preview.startsWith("blob:"))
        URL.revokeObjectURL(stagedVideo.preview);
      setStagedVideo({ file, preview });
    }
    if (type === "link") {
      if (stagedLink?.preview && stagedLink.preview.startsWith("blob:"))
        URL.revokeObjectURL(stagedLink.preview);
      setStagedLink({ file, preview });
    }
  };

  const handleImageSelect = (e) => {
    handleFileSelect(e.target.files?.[0], "image");
    e.target.value = null;
  };
  const handleVideoSelect = (e) => {
    handleFileSelect(e.target.files?.[0], "video");
    e.target.value = null;
  };
  const handleLinkFile = (e) => {
    handleFileSelect(e.target.files?.[0], "link");
    e.target.value = null;
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files?.[0], "image");
  };
  const handleVideoDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files?.[0], "video");
  };

  // ---------------------- STAGED CONTROLS ----------------------
  // Confirm (move staged -> confirmed review) and Delete (clear staged)
  const confirmStaged = (type) => {
    if (type === "image" && stagedImage) {
      if (imageForm.preview && imageForm.preview.startsWith("blob:"))
        URL.revokeObjectURL(imageForm.preview);
      setImageForm((p) =>
        assignId({
          ...p,
          file: stagedImage.file,
          preview: stagedImage.preview,
          uploaded: false,
        })
      );
      setStagedImage(null);
    }
    if (type === "video" && stagedVideo) {
      if (videoForm.preview && videoForm.preview.startsWith("blob:"))
        URL.revokeObjectURL(videoForm.preview);
      setVideoForm((p) =>
        assignId({
          ...p,
          file: stagedVideo.file,
          preview: stagedVideo.preview,
          uploaded: false,
        })
      );
      setStagedVideo(null);
    }
    if (type === "link" && stagedLink) {
      if (linkForm.preview && linkForm.preview.startsWith("blob:"))
        URL.revokeObjectURL(linkForm.preview);
      setLinkForm((p) =>
        assignId({
          ...p,
          file: stagedLink.file,
          preview: stagedLink.preview,
          uploaded: false,
        })
      );
      setStagedLink(null);
    }
  };

  const clearStaged = (type) => {
    if (type === "image") {
      if (stagedImage?.preview && stagedImage.preview.startsWith("blob:"))
        URL.revokeObjectURL(stagedImage.preview);
      setStagedImage(null);
      if (imageInputRef.current) imageInputRef.current.value = null;
    }
    if (type === "video") {
      if (stagedVideo?.preview && stagedVideo.preview.startsWith("blob:"))
        URL.revokeObjectURL(stagedVideo.preview);
      setStagedVideo(null);
      if (videoInputRef.current) videoInputRef.current.value = null;
    }
    if (type === "link") {
      if (stagedLink?.preview && stagedLink.preview.startsWith("blob:"))
        URL.revokeObjectURL(stagedLink.preview);
      setStagedLink(null);
      if (linkFileInputRef.current) linkFileInputRef.current.value = null;
    }
  };

  // ---------------------- UPLOAD / API LOGIC (frontend -> your backend) ----------------------
  // Upload an item to your backend. Returns backend response.data
  const uploadSingleToServer = async (item, onProgress) => {
    // link-only (no file) -> POST /api/uploads/link with JSON
    if (item.type === "link" && !item.file) {
      const resp = await axios.post(`${API_BASE}/api/uploads/link`, {
        platform: item.platform,
        url: item.url,
        caption: item.caption,
        stylist: item.stylist,
        date: item.date,
      });
      return resp.data;
    }

    // file upload -> multipart/form-data to /api/uploads/media (field name: file)
    const form = new FormData();
    if (item.file) form.append("file", item.file);
    form.append("caption", item.caption || "");
    form.append("stylist", item.stylist || "");
    form.append("date", item.date || "");
    form.append("type", item.type);
    if (item.url) form.append("sourceUrl", item.url);

    const resp = await axios.post(`${API_BASE}/api/uploads/media`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (p) => {
        if (typeof onProgress === "function" && p.total) {
          const percent = Math.round((p.loaded * 100) / p.total);
          onProgress(percent);
        }
      },
    });
    return resp.data;
  };

  // After successful backend upload mark uploaded + store cloud URL and backend id
  const applyBackendResult = (type, media) => {
    if (!media) return;
    const url = media.url || media.secure_url || "";
    const backendId = media._id || media.id || null;
    if (type === "image") {
      setImageForm((p) => ({
        ...p,
        preview: url || p.preview,
        file: null, // remove local blob
        uploaded: true,
        id: backendId || p.id,
      }));
    }
    if (type === "video") {
      setVideoForm((p) => ({
        ...p,
        preview: url || p.preview,
        file: null,
        uploaded: true,
        id: backendId || p.id,
      }));
    }
    if (type === "link") {
      setLinkForm((p) => ({
        ...p,
        preview: url || p.preview,
        file: null,
        uploaded: true,
        id: backendId || p.id,
      }));
    }
  };

  // REVIEW upload (only place to upload to server)
  const handleUploadToPortal = async (item) => {
    if (!item) return;
    const type = item.type;
    if (item.uploaded) return alert("This item is already uploaded.");

    setUploadingState((s) => ({ ...s, [type]: true }));
    try {
      const data = await uploadSingleToServer(item, (percent) => {
        // optional: show progress in console or state
        console.log(`${type} upload progress: ${percent}%`);
      });

      if (data && data.ok && data.media) {
        applyBackendResult(type, data.media);
      } else if (data && data.ok && !data.media) {
        // link route returns ok:true with media in our backend; handle generic ok
        // still mark uploaded
        if (type === "image") setImageForm((p) => ({ ...p, uploaded: true }));
        if (type === "video") setVideoForm((p) => ({ ...p, uploaded: true }));
        if (type === "link") setLinkForm((p) => ({ ...p, uploaded: true }));
      } else {
        console.warn("Unexpected response from upload endpoint:", data);
      }

      alert(`${type} uploaded to portal and locked.`);
    } catch (err) {
      console.error("handleUploadToPortal error:", err);
      const msg = err?.response?.data?.error || err.message || "Upload failed";
      alert(msg);
    } finally {
      setUploadingState((s) => ({ ...s, [type]: false }));
    }
  };

  // Upload all confirmed from Review
  const canUploadAll = reviewItems.filter((i) => !i.uploaded).length >= 1;
  const handleUploadAll = async () => {
    const toUpload = reviewItems.filter((i) => !i.uploaded);
    if (toUpload.length === 0) return;
    setUploading(true);
    try {
      for (const it of toUpload) {
        // reuse handleUploadToPortal flow but inline to preserve order
        setUploadingState((s) => ({ ...s, [it.type]: true }));
        try {
          const data = await uploadSingleToServer(it);
          if (data && data.ok && data.media)
            applyBackendResult(it.type, data.media);
          else markUploaded(it.type);
        } catch (err) {
          console.error("uploadAll item error:", err);
        } finally {
          setUploadingState((s) => ({ ...s, [it.type]: false }));
        }
      }
      alert("All selected items uploaded and locked.");
    } catch (err) {
      console.error("UploadAll error:", err);
      alert("Upload failed. Check console.");
    } finally {
      setUploading(false);
    }
  };

  const markUploaded = (type) => {
    if (type === "image") setImageForm((p) => ({ ...p, uploaded: true }));
    if (type === "video") setVideoForm((p) => ({ ...p, uploaded: true }));
    if (type === "link") setLinkForm((p) => ({ ...p, uploaded: true }));
  };

  // Remove item — allowed only from REVIEW per requirement
  // If item was uploaded (has backend id), call backend DELETE route first
  const removeItemFromReview = async (type) => {
    if (type === "image") {
      const backendId = imageForm.id;
      if (imageForm.uploaded && backendId) {
        try {
          await axios.delete(`${API_BASE}/api/uploads/${backendId}`);
        } catch (err) {
          console.error("Delete image on server failed:", err);
          alert(
            "Server delete failed — check console. Proceeding to remove locally."
          );
        }
      }
      if (
        imageForm.preview &&
        imageForm.preview.startsWith &&
        imageForm.preview.startsWith("blob:")
      )
        URL.revokeObjectURL(imageForm.preview);
      setImageForm({
        file: null,
        preview: null,
        caption: "",
        stylist: "",
        date: new Date().toISOString().slice(0, 10),
        id: null,
        uploaded: false,
      });
      return;
    }

    if (type === "video") {
      const backendId = videoForm.id;
      if (videoForm.uploaded && backendId) {
        try {
          await axios.delete(`${API_BASE}/api/uploads/${backendId}`);
        } catch (err) {
          console.error("Delete video on server failed:", err);
          alert(
            "Server delete failed — check console. Proceeding to remove locally."
          );
        }
      }
      if (
        videoForm.preview &&
        videoForm.preview.startsWith &&
        videoForm.preview.startsWith("blob:")
      )
        URL.revokeObjectURL(videoForm.preview);
      setVideoForm({
        file: null,
        preview: null,
        caption: "",
        stylist: "",
        date: new Date().toISOString().slice(0, 10),
        id: null,
        uploaded: false,
      });
      return;
    }

    if (type === "link") {
      const backendId = linkForm.id;
      if (linkForm.uploaded && backendId) {
        try {
          await axios.delete(`${API_BASE}/api/uploads/${backendId}`);
        } catch (err) {
          console.error("Delete link on server failed:", err);
          alert(
            "Server delete failed — check console. Proceeding to remove locally."
          );
        }
      }
      if (
        linkForm.preview &&
        linkForm.preview.startsWith &&
        linkForm.preview.startsWith("blob:")
      )
        URL.revokeObjectURL(linkForm.preview);
      setLinkForm({
        platform: "Instagram",
        url: "",
        file: null,
        preview: null,
        caption: "",
        stylist: "",
        date: new Date().toISOString().slice(0, 10),
        id: null,
        uploaded: false,
      });
      return;
    }
  };

  const onDragOver = (e) => e.preventDefault();
  const openImagePicker = () =>
    imageInputRef.current && imageInputRef.current.click();
  const openVideoPicker = () =>
    videoInputRef.current && videoInputRef.current.click();
  const openLinkFilePicker = () =>
    linkFileInputRef.current && linkFileInputRef.current.click();

  return (
    <div className="p-6 max-w-5xl mx-auto pl-15">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Upload Gallery
          </h1>
        </div>

        <div>
          <button
            onClick={handleUploadAll}
            disabled={!canUploadAll || uploading}
            className={`px-4 py-2 rounded font-semibold ${
              canUploadAll
                ? "bg-[#D3AF37] hover:bg-[#cda82f] text-black"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {uploading ? "Uploading..." : "Upload All"}
          </button>
        </div>
      </div>

      {/* Sections (staging + per-section controls) */}
      <div className="grid grid-cols-1 m-2 p-2 gap-6 pl-25">
        {/* IMAGE */}
        <div
          onDrop={handleImageDrop}
          onDragOver={onDragOver}
          className="border rounded-lg p-4 bg-white"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Upload Image</h2>
            <small className="text-xs text-gray-500">Single only</small>
          </div>

          <div className="mb-3">
            <div
              onClick={openImagePicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openImagePicker()}
              className="relative w-full h-44 bg-gray-50 border rounded flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {stagedImage ? (
                <img
                  src={stagedImage.preview}
                  alt="staged preview"
                  className="object-cover w-full h-full"
                />
              ) : imageForm.preview ? (
                <img
                  src={imageForm.preview}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
              ) : (
                <img
                  src={SAMPLE_PREVIEW}
                  alt="click to select"
                  className="object-contain max-h-full opacity-40"
                />
              )}

              {stagedImage ? (
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmStaged("image");
                    }}
                    className="px-3 py-1 rounded bg-[#D3AF37] text-black text-sm"
                  >
                    Upload
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearStaged("image");
                    }}
                    className="px-3 py-1 rounded border text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openImagePicker();
                  }}
                  className="absolute right-3 bottom-3 px-3 py-1 rounded bg-[#D3AF37] text-black text-sm"
                  aria-label="Browse image file"
                >
                  Browse file
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <input
              type="text"
              placeholder="Caption"
              value={imageForm.caption}
              onChange={(e) => setImageField("caption", e.target.value)}
              className="w-full border rounded p-2 text-sm"
              disabled={imageForm.uploaded}
            />
            <input
              type="date"
              value={imageForm.date}
              onChange={(e) => setImageField("date", e.target.value)}
              className="w-full border rounded p-2 text-sm"
              disabled={imageForm.uploaded}
            />
            <input
              type="text"
              placeholder="Stylist name"
              value={imageForm.stylist}
              onChange={(e) => setImageField("stylist", e.target.value)}
              className="w-full border rounded p-2 text-sm"
              disabled={imageForm.uploaded}
            />

            <div className="flex gap-2 justify-end">
              <div className="text-xs text-gray-500">
                Confirm via staged preview to add to Review.
              </div>
            </div>
          </div>
        </div>

        {/* VIDEO */}
        <div
          onDrop={handleVideoDrop}
          onDragOver={onDragOver}
          className="border rounded-lg p-4 bg-white"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Upload Video</h2>
            <small className="text-xs text-gray-500">Single only</small>
          </div>

          <div className="mb-3">
            <div
              onClick={openVideoPicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openVideoPicker()}
              className="relative w-full h-44 bg-gray-50 border rounded flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {stagedVideo ? (
                <video
                  src={stagedVideo.preview}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : videoForm.preview ? (
                <video
                  src={videoForm.preview}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400">
                  No video selected (click to browse)
                </div>
              )}

              {stagedVideo ? (
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmStaged("video");
                    }}
                    className="px-3 py-1 rounded bg-[#D3AF37] text-black text-sm"
                  >
                    Upload
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearStaged("video");
                    }}
                    className="px-3 py-1 rounded border text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openVideoPicker();
                  }}
                  className="absolute right-3 bottom-3 px-3 py-1 rounded bg-[#D3AF37] text-black text-sm"
                  aria-label="Browse video file"
                >
                  Browse file
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />

            <input
              type="text"
              placeholder="Caption"
              value={videoForm.caption}
              onChange={(e) => setVideoField("caption", e.target.value)}
              className="w-full border rounded p-2 text-sm"
              disabled={videoForm.uploaded}
            />
            <input
              type="date"
              value={videoForm.date}
              onChange={(e) => setVideoField("date", e.target.value)}
              className="w-full border rounded p-2 text-sm"
              disabled={videoForm.uploaded}
            />
            <input
              type="text"
              placeholder="Stylist name"
              value={videoForm.stylist}
              onChange={(e) => setVideoField("stylist", e.target.value)}
              className="w-full border rounded p-2 text-sm"
              disabled={videoForm.uploaded}
            />

            <div className="flex gap-2 justify-end">
              <div className="text-xs text-gray-500">
                Confirm via staged preview to add to Review.
              </div>
            </div>
          </div>
        </div>

        {/* LINK */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">
              Upload Social (Link)
            </h2>
            <small className="text-xs text-gray-500">
              Single only — link or attach file
            </small>
          </div>

          <select
            value={linkForm.platform}
            onChange={(e) => setLinkField("platform", e.target.value)}
            className="w-full border rounded p-2 text-sm mb-2"
            disabled={linkForm.uploaded}
          >
            <option>Instagram</option>
            <option>Facebook</option>
            <option>Youtube</option>
          </select>

          <div className="flex gap-2 items-center mb-2">
            <input
              ref={linkFileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleLinkFile}
              className="hidden"
            />

            <div className="w-28">
              {stagedLink ? (
                stagedLink.preview.endsWith(".mp4") ||
                stagedLink.preview.endsWith(".webm") ? (
                  <video
                    src={stagedLink.preview}
                    className="w-full h-16 object-cover"
                  />
                ) : (
                  <img
                    src={stagedLink.preview}
                    alt="staged"
                    className="w-full h-16 object-cover"
                  />
                )
              ) : linkForm.preview ? (
                linkForm.preview.endsWith(".mp4") ||
                linkForm.preview.endsWith(".webm") ? (
                  <video
                    src={linkForm.preview}
                    className="w-full h-16 object-cover"
                  />
                ) : (
                  <img
                    src={linkForm.preview}
                    alt="preview"
                    className="w-full h-16 object-cover"
                  />
                )
              ) : (
                <img
                  src={SAMPLE_PREVIEW}
                  alt="sample"
                  className="opacity-40 w-full h-16 object-contain"
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex gap-2">
                {stagedLink ? (
                  <>
                    <button
                      onClick={() => confirmStaged("link")}
                      className="px-3 py-2 rounded bg-[#D3AF37] text-black text-sm"
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => clearStaged("link")}
                      className="px-3 py-2 rounded border text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openLinkFilePicker}
                    className="px-3 py-2 border rounded bg-white text-sm text-left"
                    disabled={linkForm.uploaded}
                  >
                    Browse file from device
                  </button>
                )}
              </div>
            </div>
          </div>

          <input
            type="url"
            value={linkForm.url}
            onChange={(e) => setLinkField("url", e.target.value)}
            placeholder="https://..."
            className="w-full border rounded p-2 text-sm mb-2"
            disabled={linkForm.uploaded}
          />
          <input
            type="text"
            placeholder="Caption"
            value={linkForm.caption}
            onChange={(e) => setLinkField("caption", e.target.value)}
            className="w-full border rounded p-2 text-sm mb-2"
            disabled={linkForm.uploaded}
          />
          <input
            type="date"
            value={linkForm.date}
            onChange={(e) => setLinkField("date", e.target.value)}
            className="w-full border rounded p-2 text-sm mb-2"
            disabled={linkForm.uploaded}
          />
          <input
            type="text"
            placeholder="Stylist name"
            value={linkForm.stylist}
            onChange={(e) => setLinkField("stylist", e.target.value)}
            className="w-full border rounded p-2 text-sm"
            disabled={linkForm.uploaded}
          />

          <div className="flex gap-2 justify-end mt-3">
            <div className="text-xs text-gray-500">
              Confirm via staged preview to add to Review.
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Review</h3>
          <div className="text-sm text-gray-500">
            {reviewItems.length} item{reviewItems.length !== 1 ? "s" : ""} ready
          </div>
        </div>

        {reviewItems.length === 0 ? (
          <div className="text-sm text-gray-500">No items to review.</div>
        ) : (
          <div className="space-y-3">
            {reviewItems.map((it) => (
              <div
                key={it.id || it.type}
                className="flex items-start gap-4 border rounded p-3"
              >
                <div className="w-24 h-24 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                  {it.type === "image" && it.preview && (
                    <img
                      src={it.preview}
                      alt="img"
                      className="object-cover w-full h-full"
                    />
                  )}
                  {it.type === "video" && it.preview && (
                    <video
                      src={it.preview}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {it.type === "link" &&
                    it.preview &&
                    (it.preview.endsWith(".mp4") ||
                    it.preview.endsWith(".webm") ? (
                      <video
                        src={it.preview}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={it.preview}
                        alt="preview"
                        className="object-cover w-full h-full"
                      />
                    ))}
                  {it.type === "link" && !it.preview && (
                    <div className="text-xs text-gray-600 text-center px-2">
                      {it.platform}
                      <br />
                      <a
                        href={it.url}
                        className="text-blue-600 break-all"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {it.type}{" "}
                        {it.uploaded && (
                          <span className="text-xs text-green-600">
                            • uploaded
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {it.file?.name || it.url}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Delete allowed from review always (uploaded or not). */}
                      <button
                        onClick={() => removeItemFromReview(it.type)}
                        className="text-sm text-red-600"
                      >
                        Delete
                      </button>

                      {/* Upload to portal button available only if not already uploaded */}
                      {!it.uploaded && (
                        <button
                          onClick={() => handleUploadToPortal(it)}
                          className="px-3 py-1 bg-[#D3AF37] text-black rounded text-sm"
                          disabled={uploadingState[it.type]}
                        >
                          {uploadingState[it.type]
                            ? "Uploading..."
                            : "Upload to Web Portal"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-700 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>Caption: {it.caption || "-"}</div>
                    <div>Date: {it.date || "-"}</div>
                    <div>Stylist: {it.stylist || "-"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400">
        Note: Replace `http://localhost:5000/api/uploads/*` endpoints with your
        API. Deleting an item from Review removes it from UI and (if uploaded)
        calls backend delete to remove Cloudinary + DB entry.
      </div>
    </div>
  );
}
