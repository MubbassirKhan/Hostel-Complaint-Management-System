// src/pages/AdminWelcome.jsx
import React from "react";
import AdminSidebar from "../components/AdminSidebar";


const AdminWelcome = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome, Admin!</h1>
        <p className="text-lg">This is your admin dashboard.</p>
      </div>
    </div>
  );
};

export default AdminWelcome;
