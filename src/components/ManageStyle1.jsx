import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";

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

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => abortControllerRef.current?.abort();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024)
      return setErrors({ photo: "Image size should be < 5MB" });

    if (!file.type.startsWith("image/"))
      return setErrors({ photo: "Invalid image type" });

    setFormData((prev) => ({ ...prev, photo: file }));
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

    setIsSubmitting(true);

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

      toast.success("✅ Stylist added successfully!");

      setFormData({
        name: "",
        phone: "",
        email: "",
        role: "",
        photo: null,
      });

      setTimeout(() => navigate("/managestyle"), 1500);
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error(err.message || "❌ Try again! Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
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
              <input
                type={field === "email" ? "email" : "text"}
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                className={`w-full border ${
                  errors[field] ? "border-red-500" : "border-gray-200"
                } rounded-md p-3 focus:ring-1 focus:ring-[#D3AF37]`}
              />
              {errors[field] && (
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
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleFileChange}
              className="border border-gray-200 p-3 rounded-md w-full text-gray-500"
            />
            {formData.photo && (
              <div className="mt-3">
                <img
                  src={URL.createObjectURL(formData.photo)}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-md"
                />
              </div>
            )}
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
              className={`bg-[#D3AF37] text-white px-5 py-2 rounded-md hover:bg-[#c5a230] disabled:bg-gray-400 disabled:cursor-not-allowed`}
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
