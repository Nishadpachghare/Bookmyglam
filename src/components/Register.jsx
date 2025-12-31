import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // send data to backend
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (res.status === 201) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center bg-[#fffdfa] ">
      <div className="flex flex-col md:flex-row  w-260 h-135 bg-white rounded-lg overflow-hidden shadow-md">
        {/* Left Section */}
        <div className="relative md:w-1/2 w-full h-64 md:h-auto">
          <img
            src="/Login-page.png"
            alt="Salon"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
            <p className="text-white text-xl md:text-2xl font-semibold leading-snug text-center">
              Empower your salon journey — manage clients, services, and staff
              seamlessly.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="md:w-1/2 bg-black text-white p-8  flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-2">Register</h2>
          <p className="text-gray-300 mb-6 text-sm">
            Create your account and take your salon management to the next
            level.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold py-3 rounded-md hover:opacity-90 transition"
            >
              {loading ? "Registering..." : "Register Now"}
            </button>
          </form>

          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
          {success && <p className="text-green-400 mt-4 text-sm">{success}</p>}

          <p className="text-center text-sm mt-6 text-gray-400">
            Already have an account?{" "}
            <Link to="/" className="text-yellow-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
