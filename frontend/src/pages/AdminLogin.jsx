// src/pages/AdminLogin.jsx
import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminLogin = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/admin/login`, data, {
        withCredentials: true,
      });

      if (res.data.status === "success") {
        navigate("/admin/welcome");
      }
    } catch (err) {
      alert("❌ Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#1f2833] to-[#66fcf1]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Admin Login</h2>

        <div>
          <label className="text-gray-700 font-medium">Email</label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="w-full px-4 py-2 border rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="admin@hostel.com"
          />
        </div>

        <div>
          <label className="text-gray-700 font-medium">Password</label>
          <input
            type="password"
            {...register("password", { required: true })}
            className="w-full px-4 py-2 border rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#1f2833] text-white py-2 rounded-lg hover:bg-[#0b0c10] transition duration-300"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
