import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Loginpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 🔄 Redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail || !trimmedPassword) {
      toast.error("⚠️ Please enter your email and password.");
      return;
    }

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
        // ✅ Save token + user in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        toast.success("✅ Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(`❌ ${data.message || "Invalid credentials!"}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("🚨 Server error! Please try again later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffdfa] p-4">
      <div className="flex flex-col md:flex-row w-260 h-130 bg-white rounded-lg overflow-hidden shadow-md">
        {/* Left Section */}
        <div className="relative md:w-1/2 w-full h-64 md:h-auto">
          <img
            src="/Login-page.png"
            alt="Salon"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
            <p className="text-white text-xl md:text-2xl font-semibold leading-snug text-center">
              Give your salon the care it deserves — manage services, staff, and
              clients effortlessly.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="md:w-1/2 w-full bg-black text-white p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-2">Login</h2>
          <p className="text-gray-300 mb-6 text-sm">
            Welcome to Serene Beauty Salon, we hope your stay feels bright as
            the morning sun.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold py-3 rounded-md hover:opacity-90 transition"
            >
              Login
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-gray-400">
            Don’t have an account?{" "}
            <Link to="/r" className="text-yellow-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Loginpage;
