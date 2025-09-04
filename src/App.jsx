import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate
} from "react-router-dom";

import "./css/style.css";
import "./charts/ChartjsConfig";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Subscriptions from "./pages/Subscriptions";
import Auth from "./components/Auth";
import AdminDashboard from "./components/AdminDashboard";
import { animateScroll as scroll } from "react-scroll";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("userToken"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "");

  useEffect(() => {
    document.querySelector("html").style.scrollBehavior = "smooth";
    scroll.scrollToTop({
      duration: 800,
      smooth: "easeInOutQuad",
    });
    document.querySelector("html").style.scrollBehavior = "";
  }, [location.pathname]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        const role = localStorage.getItem("userRole") || "user";
        setUserRole(role);
        
        // Redirect based on role
        if (location.pathname === "/auth" || location.pathname === "/") {
          navigate(role === "admin" ? "/dashboard" : "/users");
        }
      } else {
        setIsAuthenticated(false);
        setUserRole("");
        localStorage.removeItem("userToken");
        localStorage.removeItem("userRole");
        if (location.pathname !== "/auth") {
          navigate("/auth");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  // Protected Route component with enhanced role-based access control
  const ProtectedRoute = ({ children, requiredRole = null, adminOnly = false }) => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }

    // If user is admin, allow access to all routes
    if (userRole === 'admin') {
      return children;
    }

    // If route requires admin role but user is not admin
    if (requiredRole === 'admin' || adminOnly) {
      return <Navigate to="/unauthorized" replace />;
    }

    // For regular users, allow access to non-admin routes
    return children;
  };

  // Redirect root path based on role
  const RootRedirect = () => {
    return <Navigate to={userRole === 'admin' ? '/dashboard' : '/users'} replace />;
  };

  // Unauthorized page component
  const Unauthorized = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="mb-6">You don't have permission to access this page.</p>
        <button 
          onClick={() => navigate(userRole === 'admin' ? '/dashboard' : '/users')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to {userRole === 'admin' ? 'Dashboard' : 'Home'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={
          !isAuthenticated ? <Auth /> : <Navigate to={userRole === "admin" ? "/dashboard" : "/users"} replace />
        } />
        <Route path="/signin" element={<Navigate to="/auth" replace />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Root path - redirect based on role */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Dashboard - Accessible to all authenticated users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {userRole === 'admin' ? <Dashboard /> : <Navigate to="/users" replace />}
            </ProtectedRoute>
          }
        />

        {/* Users Page - Accessible to all authenticated users */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Subscriptions Page - Only accessible to admin */}
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute requiredRole="admin">
              <Subscriptions />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard - Only accessible to admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Settings Page - Temporarily redirecting to Dashboard */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to auth or appropriate dashboard based on role */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === "admin" ? "/dashboard" : "/users"} replace />
            ) : (
              <Navigate to="/auth" replace state={{ from: location.pathname }} />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
