import React, { useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  Navigate
} from "react-router-dom";

import "./css/style.css";
import "./charts/ChartjsConfig";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Subscriptions from "./pages/Subscriptions";
import Auth from "./components/Auth";
import { animateScroll as scroll } from "react-scroll";

function App() {
  const location = useLocation();

  // Mock authentication status
  const isAuthenticated = !!localStorage.getItem("userToken");

  useEffect(() => {
    document.querySelector("html").style.scrollBehavior = "smooth";
    scroll.scrollToTop({
      duration: 800,
      smooth: "easeInOutQuad",
    });
    document.querySelector("html").style.scrollBehavior = "";
  }, [location.pathname]);

  return (
    <>
      <Routes>
        {/* Login/Signup Page */}
        <Route path="/auth" element={<Auth />} />

        {/* Dashboard Page */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Users Page */}
        <Route
          path="/users"
          element={
            isAuthenticated ? (
              <Users />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Subscriptions Page */}
        <Route
          path="/subscriptions"
          element={
            isAuthenticated ? (
              <Subscriptions />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Settings Page */}
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <Dashboard />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Root path - protected like other routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
