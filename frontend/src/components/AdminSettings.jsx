/*  src/pages/AdminSettings.jsx
    • “My Profile” – update own admin details (with confirm‑password)
    • “Add New Admin” – assign another admin (with confirm‑password)
    -------------------------------------------------------------- */
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import {
  FaUserCog,
  FaUserPlus,
  FaSave,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const AdminSettings = () => {
  /* sidebar open / margin sync */
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentML = isSidebarOpen ? "md:ml-64" : "md:ml-20";

  /* own profile */
  const [myForm, setMyForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  /* add‑admin form */
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  /* ui msgs */
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const api = import.meta.env.VITE_API_BASE_URL;

  /* fetch current profile on mount */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${api}/admin/profile`, {
          withCredentials: true,
        });
        setMyForm({
          name: data.admin.name ?? "",
          email: data.admin.email,
          password: "",
          confirm: "",
        });
      } catch {
        setErr("Failed to load profile.");
      }
    })();
  }, []);

  /* handlers */
  const handleMyChange = (e) =>
    setMyForm({ ...myForm, [e.target.name]: e.target.value });
  const handleNewChange = (e) =>
    setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });

  /* save own profile */
  const saveMyProfile = async () => {
    setMsg("");
    setErr("");

    if (myForm.password && myForm.password !== myForm.confirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      await axios.put(
        `${api}/admin/admins/me`,
        {
          name: myForm.name,
          email: myForm.email,
          password: myForm.password || undefined,
        },
        { withCredentials: true }
      );
      setMsg("Profile updated ✔");
      setMyForm({ ...myForm, password: "", confirm: "" });
    } catch (e) {
      setErr(e.response?.data?.detail || "Update failed");
    }
  };

  /* create new admin */
  const addAdmin = async () => {
    setMsg("");
    setErr("");

    if (
      !newAdmin.name ||
      !newAdmin.email ||
      !newAdmin.password ||
      !newAdmin.confirm
    ) {
      setErr("All fields are required.");
      return;
    }
    if (newAdmin.password !== newAdmin.confirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      await axios.post(
        `${api}/admin/admins`,
        {
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
        },
        { withCredentials: true }
      );
      setMsg("New admin added ✔");
      setNewAdmin({ name: "", email: "", password: "", confirm: "" });
    } catch (e) {
      setErr(e.response?.data?.detail || "Add failed");
    }
  };

  /* small alert */
  const Alert = ({ text, ok }) =>
    text && (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
          ok
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {ok ? <FaCheckCircle /> : <FaTimesCircle />} {text}
      </div>
    );

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800" style={{ marginLeft: "-10pc" }}>
      <AdminSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main
        className={`w-full transition-all duration-300 p-4 sm:p-6 md:p-8 ${contentML}`}
      >
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <FaUserCog /> Admin Settings
        </h1>

        {/* message area */}
        {msg && <Alert text={msg} ok />}
        {err && <Alert text={err} />}

        {/* MY PROFILE  */}
        <section className="bg-white rounded-xl shadow p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaUserCog /> My Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Name"
              name="name"
              value={myForm.name}
              onChange={handleMyChange}
            />
            <Field
              label="E‑mail"
              type="email"
              name="email"
              value={myForm.email}
              onChange={handleMyChange}
            />
            <Field
              label="New Password"
              type="password"
              name="password"
              value={myForm.password}
              onChange={handleMyChange}
            />
            <Field
              label="Confirm Password"
              type="password"
              name="confirm"
              value={myForm.confirm}
              onChange={handleMyChange}
            />
          </div>

          <button
            onClick={saveMyProfile}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
          >
            <FaSave /> Save Changes
          </button>
        </section>

        {/* ADD ADMIN */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaUserPlus /> Add New Admin
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Name"
              name="name"
              value={newAdmin.name}
              onChange={handleNewChange}
            />
            <Field
              label="E‑mail"
              type="email"
              name="email"
              value={newAdmin.email}
              onChange={handleNewChange}
            />
            <Field
              label="Password"
              type="password"
              name="password"
              value={newAdmin.password}
              onChange={handleNewChange}
            />
            <Field
              label="Confirm Password"
              type="password"
              name="confirm"
              value={newAdmin.confirm}
              onChange={handleNewChange}
            />
          </div>

          <button
            onClick={addAdmin}
            className="mt-6 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
          >
            <FaSave /> Create Admin
          </button>
        </section>
      </main>
    </div>
  );
};

/* small input field component */
const Field = ({ label, ...rest }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">
      {label}
    </label>
    <input
      {...rest}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
    />
  </div>
);

export default AdminSettings;
