import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

const ResetPassword = () => {
  const { shid } = useParams();
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  // 🔹 Fetch user's name using existing endpoint
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password?preview=true`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shid }),
          }
        );
        const data = await res.json();

        if (res.ok) {
          setName(data.name);
        } else {
          setMessage("❌ SHID not found.");
        }
      } catch (err) {
        setMessage("❌ Failed to fetch user information.");
      }
    };

    fetchUserName();
  }, [shid]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shid, new_password: newPassword }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Password has been reset successfully.");
    } else {
      setMessage("❌ " + (data.detail || "Failed to reset password."));
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-2 text-center">Reset Password</h2>
        {name && (
          <p className="text-center text-gray-600 mb-4">
            Hello, <strong>{name}</strong> 👋
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password"
            className="w-full border px-4 py-2 rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full border px-4 py-2 rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Reset Password
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
