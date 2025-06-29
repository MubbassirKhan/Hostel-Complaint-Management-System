import React from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminAnalytics from "../components/AdminAnalytics";   // 🆕 import

const AdminWelcome = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <AdminSidebar />
      {/* NOTE: padding area already compensates for sidebar in AdminSidebar */}
      <div className="ml-0 md:ml-64 p-8 space-y-8">
        <h1 className="text-3xl font-bold">Welcome, Admin!</h1>
        <p className="text-lg mb-6">
          Here’s a snapshot of your hostel system.
        </p>

        {/* 🆕 analytics component */}
        <AdminAnalytics />
      </div>
    </div>
  );
};

export default AdminWelcome;
