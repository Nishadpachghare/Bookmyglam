import React from "react";

export default function Attendance() {
  return (
    <div className="min-h-screen w-full p-8 bg-black text-white pl-80 flex items-center justify-center">
      <div className="mx-auto">
        <style>{`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .gradient-anim {
            background: linear-gradient(90deg, #4C0099 0%, #D3AF37 50%, #FFB347 100%);
            background-size: 200% 200%;
            animation: gradientMove 6s ease infinite;
          }
          .shine {
            position: relative;
            overflow: hidden;
          }
          .shine::after {
            content: '';
            position: absolute;
            left: -75%;
            top: -50%;
            width: 200%;
            height: 200%;
            background: rgba(255,255,255,0.06);
            transform: rotate(25deg);
            animation: shineMove 2.8s linear infinite;
          }
          @keyframes shineMove {
            0% { left: -75%; }
            100% { left: 125%; }
          }
        `}</style>

        <div className="w-[520px] rounded-xl border border-zinc-700 bg-zinc-900 p-10 text-center shadow-lg">
          <div className="flex items-center justify-center mb-6">
            {/* Animated calendar icon */}
            <div className="p-4 rounded-md gradient-anim shadow-xl animate-bounce">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="16"
                  rx="2"
                  fill="#111827"
                />
                <path
                  d="M7 2v4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 2v4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 10h18"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="15" r="1.2" fill="#ffffff" />
                <circle cx="12" cy="15" r="1.2" fill="#ffffff" />
                <circle cx="16" cy="15" r="1.2" fill="#ffffff" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2 shine">
            <span
              style={{
                background: "linear-gradient(90deg, #FFFFFF 0%, #FFD580 100%)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Coming Soon
            </span>
          </h2>

          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            Attendance module is under development. We are working to bring a
            simple and effective attendance experience — check back soon!
          </p>

          <div className="flex items-center justify-center gap-3">
            <button className="px-5 py-2 rounded-md bg-[#4C0099] text-white font-semibold shadow-md hover:bg-[#3A006F] transition">
              Notify Me
            </button>
            <button className="px-5 py-2 rounded-md border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition">
              Explore Dashboard
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            We’ll notify you when it’s ready.
          </div>
        </div>
      </div>
    </div>
  );
}
