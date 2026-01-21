import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Sidenav from "./layout/Sidenav";
import Uppernav from "./layout/uppernav";

import Loginpage from "./components/Loginpage";
import Register from "./components/Register";
import Dashboard from "./components/dashboard";
import Booking from "./components/Booking";
import Inventory from "./components/Inventory";
import ManageStyle from "./components/ManageStyle";
import ManageStyle1 from "./components/ManageStyle1";
import InactiveStylish from "./components/InactiveStylish";
import Earning from "./components/Earning";
import Earningweek from "./components/Earningweek";
import ManageService from "./components/ManageService";
import Pending from "./components/Pending";
import AddExpense from "./components/Addexpenses";
import Summary from "./components/Summary";
import Uploadimg from "./components/Uploadimg";
import ProtectedRoute from "./components/ProtectedRoute";

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
      </Routes>
    </>
  );
}

export default App;
