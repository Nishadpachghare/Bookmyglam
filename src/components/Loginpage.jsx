import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiLoader } from "react-icons/fi"; // icons from react-icons

function Loginpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail || !trimmedPassword) {
      toast.error("Please enter your credentials.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Invalid email or password.");
      }
    } catch (error) {
      toast.error("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      {/* Main Container */}
      <div className="flex flex-col md:flex-row w-255 h-135 max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
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
                Elevate Your Business
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Manage your services, staff, and clients with the elegance your
                salon deserves.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="md:w-1/2 w-full p-8 md:p-16 flex flex-col justify-center bg-zinc-900">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Login</h2>
            <p className="text-zinc-400">
              Enter your details to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-zinc-500"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-zinc-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link
                to="/forgot-password"
                size="18"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <FiLoader className="animate-spin mr-2" size={20} />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-10 text-zinc-500">
            Don’t have an account?{" "}
            <Link
              to="/r"
              className="text-purple-400 font-medium hover:underline decoration-2 underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Loginpage;
