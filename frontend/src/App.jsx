// src/App.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Importing pages
import AdminLogin from "./pages/AdminLogin";
import AdminWelcome from "./pages/AdminWelcome";
import StudentDashboard from "./pages/StudentDashboard";
import About from "./pages/About";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import WardenLogin from "./pages/WardenLogin";
import AdminUsers from "./components/AdminUsers";

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminPage && <Navbar />}

      <main className="flex-grow">
        <Routes>
          {/* Public/student pages */}
          <Route path="/" element={<Hero />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/warden/login" element={<WardenLogin />} />
          <Route path="/reset-password/:shid" element={<ResetPassword />} />

          {/* Admin pages */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/welcome"
            element={
              <AdminProtectedRoute>
                <AdminWelcome />
              </AdminProtectedRoute>
            }
          />
          <Route path="/admin/users" element={<AdminUsers />} />

          {/* Catch-all route */}
        </Routes>
      </main>

      {!isAdminPage && <Footer />}
    </div>
  );
}

export default App;
