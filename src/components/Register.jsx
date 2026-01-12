import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff, FiLoader } from "react-icons/fi"; // Matching your login icons
import toast from "react-hot-toast";

function Register() {
  const navigate = useNavigate();

  // form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (res.status === 201) {
        toast.success("Registration successful! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      {/* Main Container */}
      <div className="flex flex-col md:flex-row w-255 h-145 max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        {/* Left Section: Visual/Branding */}
        <div className="relative md:w-1/2 w-full hidden md:block">
          <img
            src="/Login-page-2.jpg"
            alt="Salon"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end p-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Join the Community
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Empower your salon journey — manage clients, services, and staff
                seamlessly with the elegance your business deserves.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-zinc-900">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Register</h2>
            <p className="text-zinc-400">
              Create your account to take your salon management to the next
              level.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-zinc-500"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-zinc-500"
              />
            </div>

            {/* Phone and City Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91..."
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="Nagpur"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <FiLoader className="animate-spin mr-2" size={20} />
              ) : (
                "Register Now"
              )}
            </button>
          </form>

          <p className="text-center text-sm  text-zinc-500">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-purple-400 font-medium hover:underline decoration-2 underline-offset-4"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
