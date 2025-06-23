import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const UserAuth = () => {
  const [mode, setMode] = useState("login"); // 'login', 'register', 'forgot'
  const [shid, setShid] = useState("");
  const [pswd, setPswd] = useState("");
  const [confirmPswd, setConfirmPswd] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetFields = () => {
    setShid("");
    setPswd("");
    setConfirmPswd("");
    setMessage("");
    setLoading(false);
  };

  const handleModeChange = (newMode) => {
    resetFields();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !shid ||
      (mode !== "forgot" && !pswd) ||
      (mode === "register" && !confirmPswd)
    ) {
      setMessage("❌ All required fields must be filled.");
      return;
    }

    if (mode === "register" && pswd !== confirmPswd) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    setLoading(true); // ⏳ Start loading

    if (mode === "forgot") {
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shid }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage("📨 Reset link sent to your email.");
        } else {
          setMessage(data.detail || "❌ Failed to send reset link.");
        }
      } catch (error) {
        setMessage("❌ Server error while sending reset link.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const url =
        mode === "login"
          ? `${import.meta.env.VITE_API_BASE_URL}/login`
          : `${import.meta.env.VITE_API_BASE_URL}/userauth`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shid, pswd }),
      });

      const data = await response.json();

      if (mode === "login") {
        if (data.status === "success") {
          localStorage.setItem("shid", shid);
          setMessage("✅ Login successful!");
          setTimeout(() => navigate("/dashboard"), 1500);
        } else if (data.status === "invalid") {
          setMessage("❌ Invalid SHID or password.");
        } else {
          setMessage(data.message || "❌ Login failed.");
        }
      } else {
        if (data.status === "not_found") {
          setMessage("❌ SHID not found.");
        } else if (data.status === "exists") {
          setMessage("⚠️ SHID already registered.");
        } else if (data.status === "success") {
          setMessage("✅ Registered successfully!");
          setTimeout(() => navigate("/"), 1500);
        } else {
          setMessage("❌ Registration failed.");
        }
      }
    } catch (error) {
      setMessage("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[600px] bg-white shadow-xl rounded-xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Content Panel */}
        <div className="bg-blue-700 text-white p-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
            >
              {mode === "login" && (
                <>
                  <h2 className="text-4xl font-bold mb-4">Welcome to Hostel Portal</h2>
                  <p className="text-lg mb-4">Login to access your dashboard and services.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>View hostel updates</li>
                    <li>Raise complaints</li>
                    <li>Connect with wardens</li>
                  </ul>
                </>
              )}
              {mode === "register" && (
                <>
                  <h2 className="text-4xl font-bold mb-4">Create Your Account</h2>
                  <p className="text-lg mb-4">Register to get started with your hostel account.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Secure complaint system</li>
                    <li>Track your issues</li>
                    <li>Student-friendly dashboard</li>
                  </ul>
                </>
              )}
              {mode === "forgot" && (
                <>
                  <h2 className="text-4xl font-bold mb-4">Forgot Password?</h2>
                  <p className="text-lg">Recover your login access by verifying your SHID.</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Form Panel */}
        <div className="p-8 sm:p-12 bg-white flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center capitalize">
                {mode === "login"
                  ? "Student Login"
                  : mode === "register"
                  ? "Student Registration"
                  : "Recover Password"}
              </h3>

              {message && (
                <div
                  className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                    message.includes("✅")
                      ? "bg-green-100 text-green-700"
                      : message.includes("⚠️")
                      ? "bg-yellow-100 text-yellow-700"
                      : message.includes("📨")
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">SHID</label>
                  <input
                    type="text"
                    value={shid}
                    onChange={(e) => setShid(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-500"
                    placeholder="e.g. STU1ID001"
                  />
                </div>

                {mode !== "forgot" && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Password</label>
                    <input
                      type="password"
                      value={pswd}
                      onChange={(e) => setPswd(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                )}

                {mode === "register" && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPswd}
                      onChange={(e) => setConfirmPswd(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-500"
                      placeholder="Confirm password"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 ${
                    mode === "forgot"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-blue-700 hover:bg-blue-600"
                  } text-white font-semibold py-2 rounded-lg transition duration-200 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : mode === "login" ? (
                    "Login"
                  ) : mode === "register" ? (
                    "Register"
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              {/* Footer Options */}
              <div className="mt-6 text-sm text-center text-gray-600 space-y-2">
                {mode === "login" && (
                  <>
                    <p>
                      Don’t have an account?{" "}
                      <button
                        onClick={() => handleModeChange("register")}
                        className="text-blue-600 hover:underline"
                      >
                        Register
                      </button>
                    </p>
                    <button
                      onClick={() => handleModeChange("forgot")}
                      className="text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                                    <div className="pt-4 flex justify-between text-sm text-gray-600">
                  <a href="/admin/login" className="text-blue-600 hover:underline">
                    Admin Login
                  </a>
                  <a href="/warden/login" className="text-blue-600 hover:underline">
                    Warden Login
                  </a>
                </div>

                  </>
                  
                )}
                {mode === "register" && (
                  <p>
                    Already registered?{" "}
                    <button
                      onClick={() => handleModeChange("login")}
                      className="text-blue-600 hover:underline"
                    >
                      Login
                    </button>
                  </p>
                )}
                {mode === "forgot" && (
                  <p>
                    Back to{" "}
                    <button
                      onClick={() => handleModeChange("login")}
                      className="text-blue-600 hover:underline"
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
