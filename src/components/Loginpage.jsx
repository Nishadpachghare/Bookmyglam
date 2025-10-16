import React from "react";

function Loginpage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffdfa] p-4">
      <div className="flex flex-col md:flex-row w-250 h-130 bg-white rounded-lg overflow-hidden shadow-md">

        
        <div className="relative md:w-1/2 w-full h-64 md:h-auto">
          <img
            src="/Login-page.png"
            alt="Salon"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
            <p className="text-white text-xl md:text-2xl font-semibold leading-snug text-center">
              Give your salon the care it deserves manage services, staff, and clients effortlessly.
            </p>
          </div>
        </div>

        {/* Right Section - Login/Register */}
        <div className="md:w-1/2 w-full bg-black text-white p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-2">Login</h2>
          <p className="text-gray-300 mb-6 text-sm">
            Welcome to Serene Beauty Salon, we hope your stay with us feels as bright as the morning sun.
          </p>

          <form className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-md bg-transparent border border-gray-600 text-sm focus:outline-none focus:border-yellow-500"
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold py-3 rounded-md hover:opacity-90 transition"
            >
              Register
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-gray-400">
            Already have an account?{" "}
            <a href="#" className="text-yellow-400 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Loginpage;