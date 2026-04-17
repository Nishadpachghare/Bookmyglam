import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Sidenav from "./layout/Sidenav";
import Uppernav from "./layout/Uppernav";

import Loginpage from "./components/Loginpage";
import ProtectedRoute from "./components/ProtectedRoute";

const Register = lazy(() => import("./components/Register.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const Attendance = lazy(() => import("./components/Attendance.jsx"));
const Booking = lazy(() => import("./components/Booking.jsx"));
const Inventory = lazy(() => import("./components/Inventory.jsx"));
const ManageStyle = lazy(() => import("./components/ManageStyle.jsx"));
const ManageStyle1 = lazy(() => import("./components/ManageStyle1.jsx"));
const InactiveStylish = lazy(() => import("./components/InactiveStylish.jsx"));
const Earning = lazy(() => import("./components/Earning.jsx"));
const Earningweek = lazy(() => import("./components/Earningweek.jsx"));
const ManageService = lazy(() => import("./components/ManageService.jsx"));
const Pending = lazy(() => import("./components/Pending.jsx"));
const AddExpense = lazy(() => import("./components/Addexpenses.jsx"));
const Summary = lazy(() => import("./components/Summary.jsx"));
const Uploadimg = lazy(() => import("./components/Uploadimg.jsx"));
const OfferAndCoupon = lazy(() => import("./components/Offer&Coupon.jsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.jsx"));

function RouteLoader({ shouldHideLayout }) {
  const wrapperClass = shouldHideLayout ? "" : "pl-72 pt-20";

  return (
    <div
      className={`min-h-screen bg-black text-white flex items-center justify-center ${wrapperClass}`}
    >
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-6 py-4 text-sm text-zinc-300 shadow-xl">
        Loading page...
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  // Hide sidebar & navbar on login and register pages
  const hideLayoutPaths = ["/", "/r"];
  const shouldHideLayout = hideLayoutPaths.includes(location.pathname);

  return (
    <>
      {/* Sidebar & Uppernav */}
      {!shouldHideLayout && (
        <>
          <Sidenav />
          <Uppernav />
        </>
      )}

      {/* Routes */}
      <Suspense fallback={<RouteLoader shouldHideLayout={shouldHideLayout} />}>
        <Routes>
          <Route path="/" element={<Loginpage />} />
          <Route path="/r" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/managestyle"
            element={
              <ProtectedRoute>
                <ManageStyle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/managestyle1"
            element={
              <ProtectedRoute>
                <ManageStyle1 />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inactivestylist"
            element={
              <ProtectedRoute>
                <InactiveStylish />
              </ProtectedRoute>
            }
          />

          <Route
            path="/earning"
            element={
              <ProtectedRoute>
                <Earning />
              </ProtectedRoute>
            }
          />

          <Route
            path="/earningweek"
            element={
              <ProtectedRoute>
                <Earningweek />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manageservice"
            element={
              <ProtectedRoute>
                <ManageService />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pending"
            element={
              <ProtectedRoute>
                <Pending />
              </ProtectedRoute>
            }
          />

          <Route
            path="/addexpense"
            element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            }
          />

          <Route
            path="/summary"
            element={
              <ProtectedRoute>
                <Summary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/uploadimg"
            element={
              <ProtectedRoute>
                <Uploadimg />
              </ProtectedRoute>
            }
          />

          <Route
            path="/offersandcoupons"
            element={
              <ProtectedRoute>
                <OfferAndCoupon />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route path="/booking-success" element={<PaymentSuccess />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
