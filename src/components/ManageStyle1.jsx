import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";
import axios from "axios";

function ManageStyle1() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortControllerRef = useRef(null);

  // Drag & drop / preview state
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // OTP states (email verification)
  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpTimerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      abortControllerRef.current?.abort();
      clearInterval(otpTimerRef.current);
    };
  }, []);

  // cooldown timer for OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    otpTimerRef.current = setInterval(() => {
      setOtpCooldown((c) => {
        if (c <= 1) {
          clearInterval(otpTimerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(otpTimerRef.current);
  }, [otpCooldown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "email") {
      // reset OTP state when email changes
      if (emailVerified) setEmailVerified(false);
      setOtpCooldown(0);
      setOtpCode("");
      clearInterval(otpTimerRef.current);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return setErrors({ photo: "Image size should be < 5MB" });
    if (!file.type.startsWith("image/"))
      return setErrors({ photo: "Invalid image type" });

    setFormData((prev) => ({ ...prev, photo: file }));
    // preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
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
    const file = e.dataTransfer?.files && e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return setErrors({ photo: "Image size should be < 5MB" });
    if (!file.type.startsWith("image/"))
      return setErrors({ photo: "Invalid image type" });

    setFormData((prev) => ({ ...prev, photo: file }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // cleanup preview on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ------------------ OTP functions (email) ------------------
  const sendOtpEmail = async () => {
    if (otpCooldown > 0) {
      toast.error(`Please wait ${otpCooldown}s before resending`);
      return;
    }
    const email = formData.email?.trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors((p) => ({ ...p, email: "Enter a valid email first" }));
      return;
    }

    try {
      setOtpLoading(true);
      const resp = await axios.post("http://localhost:5000/api/auth/send-otp", {
        to: email,
        channel: "email",
      });
      if (resp.data?.ok) {
        setOtpCooldown(60);
        toast.success(`OTP sent to ${email}`);
      } else {
        throw new Error(resp.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("sendOtpEmail error:", err);
      toast.error(err.response?.data?.message || "Unable to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpEmail = async () => {
    if (!otpCode || !otpCode.trim()) {
      toast.error("Enter the OTP first");
      return;
    }
    const email = formData.email?.trim();
    try {
      setOtpLoading(true);
      const resp = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          to: email,
          code: otpCode.trim(),
          channel: "email",
        }
      );
      if (resp.data?.ok) {
        toast.success("Email verified");
        setEmailVerified(true);
        setOtpCode("");
        setOtpCooldown(0);
        clearInterval(otpTimerRef.current);
      } else {
        throw new Error(resp.data?.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("verifyOtpEmail error:", err);
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const cancelOtp = () => {
    clearInterval(otpTimerRef.current);
    setOtpCooldown(0);
    setOtpCode("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.role) newErrors.role = "Role is required";

    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    // require email verification via OTP
    if (!emailVerified) {
      setErrors((p) => ({ ...p, email: "Email must be verified" }));
      toast.error("Please verify the stylist's email with OTP before saving");
      return;
    }

    setIsSubmitting(true);
    setUploadingPhoto(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });

      const response = await fetch("http://localhost:5000/api/stylists", {
        method: "POST",
        body: formDataToSend,
        signal: abortControllerRef.current.signal,
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Server returned invalid JSON (HTML or error page).");
      }

      if (!response.ok)
        throw new Error(result.message || "Failed to add stylist");

      // Inform the user about welcome email delivery status
      if (result.welcomeEmailStatus === "sent") {
        toast.success("✅ Stylist added and welcome email sent");
      } else if (result.welcomeEmailStatus === "fallback") {
        toast(
          "Stylist added. Note: outgoing email not configured on server (logged to console)"
        );
      } else {
        toast(
          "Stylist added. Welcome email delivery status: " +
            (result.welcomeEmailStatus || "unknown")
        );
      }

      setFormData({
        name: "",
        phone: "",
        email: "",
        role: "",
        photo: null,
      });
      // reset OTP state
      setEmailVerified(false);
      setOtpCode("");
      setOtpCooldown(0);

      setTimeout(() => navigate("/managestyle"), 1500);
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error(err.message || "❌ Try again! Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen pl-80 shadow-xl">
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Manage Stylists
      </h1>

      <div className="flex items-center bg-[#f0f0f0] px-4 py-3 w-full max-w-5xl border rounded-md">
        <FiSearch className="text-gray-500 text-xl" />
        <input
          type="text"
          placeholder="Search stylists"
          className="bg-transparent outline-none ml-3 w-full text-gray-700 placeholder-gray-500"
        />
      </div>

      <div className="flex gap-8 mt-6 pb-2 text-lg font-medium">
        <button
          onClick={() => navigate("/managestyle")}
          className="text-gray-500 hover:text-[#D3AF37] pb-1"
        >
          All Stylists
        </button>
        <button className="text-[#D3AF37] border-b border-[#D3AF37] pb-1">
          Add Stylist
        </button>
        <button
          onClick={() => navigate("/Inactivestylist")}
          className="text-gray-500 hover:text-[#D3AF37] pb-1"
        >
          Inactive Stylists
        </button>
      </div>

      <div className="p-10 max-w-3xl mx-auto text-gray-800 border rounded-md bg-white shadow-md mt-6">
        <h1 className="text-3xl font-bold mb-8">Add New Stylist</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {["name", "phone", "email"].map((field) => (
            <div key={field}>
              <label className="block font-medium mb-1 capitalize">
                {field} <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-3">
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  className={`w-full border ${
                    errors[field] ? "border-red-500" : "border-gray-200"
                  } rounded-md p-3 focus:ring-1 focus:ring-[#D3AF37]`}
                />

                {field === "email" && (
                  <div className="flex items-center gap-2">
                    {emailVerified ? (
                      <span className="text-green-600 font-semibold">
                        Verified
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={sendOtpEmail}
                          disabled={otpCooldown > 0 || otpLoading}
                          className={`px-3 py-2 text-sm rounded-md font-medium ${
                            otpCooldown > 0
                              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                              : "bg-[#D3AF37] text-black hover:bg-[#c5a230]"
                          }`}
                        >
                          {otpCooldown > 0
                            ? `Resend (${otpCooldown}s)`
                            : "Send OTP"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {field === "email" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="border border-gray-200 rounded-md p-2 text-sm w-40"
                  />
                  <button
                    type="button"
                    onClick={verifyOtpEmail}
                    disabled={otpLoading || emailVerified}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md disabled:opacity-60"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={cancelOtp}
                    className="px-3 py-2 bg-red-100 text-red-600 text-sm rounded-md"
                  >
                    Cancel
                  </button>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              {field !== "email" && errors[field] && (
                <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
              )}
            </div>
          ))}
          <div>
            <label className="block font-medium mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full border ${
                errors.role ? "border-red-500" : "border-gray-200"
              } rounded-md p-3 focus:ring-1 focus:ring-[#D3AF37]`}
            >
              <option value="">Select role</option>
              <option value="senior">Senior Stylist</option>
              <option value="junior">Junior Stylist</option>
              <option value="colorist">Colorist</option>
              <option value="assistant">Assistant Stylist</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role}</p>
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Upload Photo</label>

            <div
              className={`border-2 border-dashed rounded-md p-4 text-center ${
                dragActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                <label className="inline-block bg-[#D3AF37] text-black px-4 py-2 rounded-md cursor-pointer hover:bg-[#c5a230]">
                  Browse File
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div className="text-sm text-gray-500">
                  Or drag & drop an image here
                </div>

                {previewUrl ? (
                  <div className="mt-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-28 w-28 object-cover rounded-md mx-auto"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Selected:{" "}
                      <span className="font-medium">
                        {formData.photo?.name}
                      </span>
                    </p>
                  </div>
                ) : null}

                {uploadingPhoto && (
                  <div className="mt-2 text-sm text-gray-600">
                    Uploading photo…
                  </div>
                )}

                {errors.photo && (
                  <p className="text-red-500 text-sm mt-2">{errors.photo}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate("/managestyle")}
              className="border border-gray-300 bg-gray-50 px-5 py-2 rounded-md hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-[#D3AF37] text-black px-5 py-2 rounded-md hover:bg-[#c5a230] disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Saving..." : "Save Stylist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManageStyle1;
