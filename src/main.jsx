import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { ExportProvider } from "./layout/ExportContext";

/* =========================
   RENDER APP
========================= */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ExportProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#111827",
              color: "#fff",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            },
          }}
        />
      </ExportProvider>
    </BrowserRouter>
  </StrictMode>
);
