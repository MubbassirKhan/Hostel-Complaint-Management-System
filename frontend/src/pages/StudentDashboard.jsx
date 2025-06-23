import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaChartBar,
  FaUser,
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaTrashAlt,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Sidebar = ({ onSelect, active }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const studentName = localStorage.getItem("studentName") || "Student";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <aside className="w-full sm:w-64 bg-blue-800 text-white p-6 shadow-xl">
      <div className="mb-8">
        <div
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <h2 className="text-lg font-semibold truncate">{studentName}</h2>
          {dropdownOpen ? (
            <FaChevronUp size={16} />
          ) : (
            <FaChevronDown size={16} />
          )}
        </div>
        {dropdownOpen && (
          <div className="ml-1 space-y-2">
            <button
              onClick={() => alert("🔧 Update feature coming soon")}
              className="w-full text-left text-sm bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded-md"
            >
              Update
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <ul className="space-y-4">
        <li
          onClick={() => onSelect("dashboard")}
          className={`cursor-pointer flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
            active === "dashboard" ? "bg-blue-700" : ""
          }`}
        >
          <MdDashboard size={20} /> Dashboard
        </li>
        <li
          onClick={() => onSelect("student")}
          className={`cursor-pointer flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
            active === "student" ? "bg-blue-700" : ""
          }`}
        >
          <FaUser size={20} /> Student Info
        </li>
        <li
          onClick={() => onSelect("complaints")}
          className={`cursor-pointer flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
            active === "complaints" ? "bg-blue-700" : ""
          }`}
        >
          <FaHistory size={20} /> Complaints
        </li>
        <li
          onClick={() => onSelect("raise")}
          className={`cursor-pointer flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
            active === "raise" ? "bg-blue-700" : ""
          }`}
        >
          <FaChartBar size={20} /> Raise Complaint
        </li>
      </ul>
    </aside>
  );
};

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchData = () => {
    const shid = localStorage.getItem("shid");
    if (!shid) return;

    fetch(`${API_BASE_URL}/dashboard/${shid}`)
      .then((res) => res.json())
      .then((resData) => {
        setData((prev) => ({ ...prev, student: resData.student }));
        localStorage.setItem("studentName", resData.student.name);
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/fetch_complaint/${shid}`)
      .then((res) => res.json())
      .then((resData) => {
        setData((prev) => ({
          ...prev,
          complaints: {
            total: resData.complaints.length,
            pending: resData.complaints.filter((c) => c.status === "Pending")
              .length,
            resolved: resData.complaints.filter((c) => c.status === "Resolved")
              .length,
            recent: resData.complaints,
          },
        }));
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (cid) => {
    const confirm = window.confirm(
      "Are you sure you want to withdraw this complaint?"
    );
    if (!confirm) return;

    const shid = localStorage.getItem("shid");

    console.log("Attempting to withdraw complaint", { shid, cid }); // 🧪 Debug

    if (!shid || !cid) {
      alert("Missing SHID or complaint ID.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/complaint/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shid, cid }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message);
        fetchData();
      } else {
        const errorMsg =
          result?.detail || result?.message || "Unknown error occurred";
        alert("❌ Error: " + errorMsg);
      }
    } catch (err) {
      console.error("Withdraw error:", err);
      alert("Something went wrong while withdrawing the complaint.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  if (!data) return <div className="p-8 text-center">Loading...</div>;

  const { student, complaints } = data;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar active={activeTab} onSelect={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 bg-gray-100 overflow-y-auto">
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Welcome, {student?.name || "Student"}
              </h2>

              {complaints && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-gray-600">Total Complaints</p>
                    <p className="text-2xl font-bold">{complaints.total}</p>
                  </div>
                  <div className="bg-yellow-100 p-6 rounded-lg shadow-md">
                    <p className="text-yellow-800">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {complaints.pending}
                    </p>
                  </div>
                  <div className="bg-green-100 p-6 rounded-lg shadow-md">
                    <p className="text-green-800">Resolved</p>
                    <p className="text-2xl font-bold text-green-700">
                      {complaints.resolved}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "student" && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4">
                Student Information
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>
                  <strong>SHID:</strong> {student.shid}
                </li>
                <li>
                  <strong>Name:</strong> {student.name}
                </li>
                <li>
                  <strong>Email:</strong> {student.mail}
                </li>
                <li>
                  <strong>Phone:</strong> {student.phone}
                </li>
                <li>
                  <strong>Date of Birth:</strong> {student.dob}
                </li>
                <li>
                  <strong>Hostel:</strong> {student.hostel.name} (
                  {student.hostel.location})
                </li>
                <li>
                  <strong>Warden:</strong> {student.warden.name},{" "}
                  {student.warden.phone}
                </li>
              </ul>
            </div>
          )}
          {activeTab === "complaints" && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4">Recent Complaints</h3>
              <ul className="space-y-4">
                {complaints.recent.map((comp, i) => (
                  <li
                    key={i}
                    className="flex flex-col justify-between h-full border border-gray-200 p-4 rounded-lg"
                  >
                    <div>
                      <p>
                        <strong>Type:</strong> {comp.type}
                      </p>
                      <p>
                        <strong>Status:</strong> {comp.status}
                      </p>
                      <p>
                        <strong>Description:</strong> {comp.description}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(comp.created_at).toLocaleString()}
                      </p>

                      {comp.proof_image && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-1">
                            Proof Image:
                          </p>
                          <img
                            src={comp.proof_image}
                            alt="Proof"
                            className="max-w-xs rounded border"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4">
                      {/* ✅ Withdraw button condition */}
                      {comp.status === "Pending" &&
                        (!comp.is_withdrawn ||
                          comp.is_withdrawn === 0 ||
                          comp.is_withdrawn === false) &&
                        (comp.withdraw_count ?? 0) < 3 && (
                          <button
                            onClick={() => handleWithdraw(comp.cid)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-4"
                          >
                            Withdraw
                          </button>
                        )}

                      {/* ✅ Message if maxed out */}
                      {comp.withdraw_count >= 3 && (
                        <p className="text-red-500 text-sm mt-2">
                          ❌ Withdraw limit reached
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "raise" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
              <h3 className="text-2xl font-semibold mb-4">
                Raise a New Complaint
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const shid = localStorage.getItem("shid");
                  const type = e.target.type.value;
                  const description = e.target.description.value;
                  const imageFile = e.target.proof_image.files[0];

                  if (!type || !description || !imageFile) {
                    alert("All fields including image are required.");
                    return;
                  }

                  const toBase64 = (file) =>
                    new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = () =>
                        resolve(reader.result.split(",")[1]);
                      reader.onerror = (error) => reject(error);
                    });

                  try {
                    const proof_image = await toBase64(imageFile);

                    const res = await fetch(`${API_BASE_URL}/complaint/add`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        shid,
                        type,
                        description,
                        proof_image,
                      }),
                    });

                    const result = await res.json();
                    alert(result.message || "Complaint submitted.");
                    e.target.reset();
                    setActiveTab("complaints");
                    fetchData();
                  } catch (err) {
                    console.error(err);
                    alert("Error submitting complaint.");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Complaint Type
                  </label>
                  <input
                    name="type"
                    type="text"
                    className="mt-1 p-2 w-full border border-gray-300 rounded"
                    placeholder="e.g., Water Leakage"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="mt-1 p-2 w-full border border-gray-300 rounded"
                    placeholder="Describe the issue..."
                    rows={4}
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Proof Image
                  </label>
                  <input
                    name="proof_image"
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Submit Complaint
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default StudentDashboard;
