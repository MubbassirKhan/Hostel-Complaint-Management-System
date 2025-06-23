import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const WardenAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE_URL}/auth/warden/login`, data, {
          withCredentials: true,
        });
        alert(res.data.message);
        navigate("/warden/dashboard");
      } else {
        const res = await axios.post(`${API_BASE_URL}/auth/warden/signup`, data);
        alert(res.data.message);
        reset();
        setIsLogin(true);
      }
    } catch (err) {
      alert(err?.response?.data?.detail || "Something went wrong!");
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: isLogin ? 100 : -100 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isLogin ? -100 : 100 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 p-4">
      <div className="bg-white shadow-2xl rounded-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Warden Login" : "Warden Signup"}
        </h2>

        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? "login" : "signup"}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={formVariants}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Name"
                  {...register("name", { required: true })}
                  className="w-full border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  {...register("phone", { required: true })}
                  className="w-full border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Hostel ID"
                  {...register("hid", { required: true })}
                  className="w-full border p-2 rounded"
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              {...register("mail", { required: true })}
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              placeholder="Password"
              {...register("password", { required: true })}
              className="w-full border p-2 rounded"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition duration-200"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </motion.form>
        </AnimatePresence>

        <p className="text-center mt-4 text-gray-600">
          {isLogin ? "Don't have an account?" : "Already registered?"}{" "}
          <button
            className="text-blue-500 underline"
            onClick={() => {
              reset();
              setIsLogin(!isLogin);
            }}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default WardenAuth;
