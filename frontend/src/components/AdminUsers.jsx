/*  src/pages/AdminUsers.jsx
    Left‑aligned, extra‑wide “Manage Users” table
------------------------------------------------------------------*/
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaTrash,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaUniversity,
} from "react-icons/fa";
import AdminSidebar from "../components/AdminSidebar";

const PAGE_SIZE = 10;
const TABLE_HEIGHT = "80vh";          // 80 % viewport height

const AdminUsers = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentML = isSidebarOpen ? "md:ml-64" : "md:ml-20";

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [page, setPage] = useState(0);

  const api = import.meta.env.VITE_API_BASE_URL;

  /* fetch */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${api}/admin/students`, {
          withCredentials: true,
        });
        setStudents(data.students);
      } catch {
        setError("Failed to load students.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* search + filter */
  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(t) ||
          s.mail.toLowerCase().includes(t) ||
          s.phone.includes(t)
      )
      .filter((s) => (hostelFilter === "all" ? true : s.hostel_name === hostelFilter));
  }, [students, search, hostelFilter]);

  useEffect(() => {
    if (page > Math.floor(filtered.length / PAGE_SIZE)) setPage(0);
  }, [filtered, page]);

  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* helpers */
  const startEdit = (s) => {
    setEditId(s.sid);
    setForm({
      name: s.name,
      phone: s.phone,
      mail: s.mail,
      dob: s.dob?.slice(0, 10) || "",
      hid: s.hid,
    });
  };
  const cancelEdit = () => (setEditId(null), setForm({}));
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const saveEdit = async (sid) => {
    try {
      await axios.put(`${api}/admin/student/${sid}`, form, { withCredentials: true });
      setStudents((p) => p.map((s) => (s.sid === sid ? { ...s, ...form } : s)));
      cancelEdit();
    } catch {
      alert("Update failed");
    }
  };
  const del = async (sid) => {
    if (!confirm("Delete this student?")) return;
    try {
      await axios.delete(`${api}/admin/student/${sid}`, { withCredentials: true });
      setStudents((p) => p.filter((s) => s.sid !== sid));
    } catch {
      alert("Delete failed");
    }
  };

  const hostelNames = ["all", ...new Set(students.map((s) => s.hostel_name))];

  if (loading)
    return <ScreenMsg text="Loading users…" pulse />;
  if (error)
    return <ScreenMsg text={error} error />;

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800" style={{ marginLeft: "-10pc"}}>
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className={`w-full transition-all duration-300 p-4 sm:p-6 md:p-8 ${contentML}`}>
        <h1 className="text-3xl font-bold mb-6">Manage Users</h1>

        {/* search + filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-6">
          <SearchBox value={search} onChange={setSearch} />
          <HostelFilter
            value={hostelFilter}
            options={hostelNames}
            onChange={setHostelFilter}
          />
        </div>

        {/* left‑aligned wide table: 95 % on md+, 100 % on small */}
        <div className="w-full md:w-[98%]">
          <div className="rounded-lg shadow bg-white overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: TABLE_HEIGHT }}>
              <table className="min-w-full text-sm sm:text-base">
                <thead className="bg-gray-800 text-white sticky top-0">
                  <tr>
                    <Th>SID</Th>
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Mail</Th>
                    <Th>DOB</Th>
                    <Th>Hostel</Th>
                    <Th align="center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((s) => (
                    <tr key={s.sid} className="even:bg-gray-50">
                      <Td>{s.sid}</Td>
                      <Td>{editId === s.sid ? <Input name="name" value={form.name} onChange={handleChange} /> : s.name}</Td>
                      <Td>{editId === s.sid ? <Input name="phone" value={form.phone} onChange={handleChange} /> : s.phone}</Td>
                      <Td className="truncate">
                        {editId === s.sid ? <Input name="mail" value={form.mail} onChange={handleChange} /> : s.mail}
                      </Td>
                      <Td>
                        {editId === s.sid ? (
                          <Input type="date" name="dob" value={form.dob} onChange={handleChange} />
                        ) : (
                          s.dob?.slice(0, 10)
                        )}
                      </Td>
                      <Td>{s.hostel_name}</Td>
                      <Td align="center">
                        {editId === s.sid ? (
                          <ActionGroup>
                            <IconBtn label="Save" color="green" onClick={() => saveEdit(s.sid)}>
                              <FaSave />
                            </IconBtn>
                            <IconBtn label="Cancel" color="gray" onClick={cancelEdit}>
                              <FaTimes />
                            </IconBtn>
                          </ActionGroup>
                        ) : (
                          <ActionGroup>
                            <IconBtn label="Edit" color="blue" onClick={() => startEdit(s)}>
                              <FaEdit />
                            </IconBtn>
                            <IconBtn label="Delete" color="red" onClick={() => del(s.sid)}>
                              <FaTrash />
                            </IconBtn>
                          </ActionGroup>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3">
                <NavBtn disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <FaChevronLeft /> Prev
                </NavBtn>
                <span className="text-sm">
                  Page {page + 1} of {Math.ceil(filtered.length / PAGE_SIZE)}
                </span>
                <NavBtn
                  disabled={page + 1 >= filtered.length / PAGE_SIZE}
                  onClick={() => setPage((p) => (p + 1 < filtered.length / PAGE_SIZE ? p + 1 : p))}
                >
                  Next <FaChevronRight />
                </NavBtn>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

/* ───────── tiny helpers ───────── */
const ScreenMsg = ({ text, pulse = false, error = false }) => (
  <div
    className={`min-h-screen flex items-center justify-center text-lg ${
      pulse ? "animate-pulse" : ""
    } ${error ? "text-red-500 font-semibold" : ""}`}
  >
    {text}
  </div>
);
const Th = ({ children, align = "left" }) => (
  <th className={`py-3 px-4 text-${align}`}>{children}</th>
);
const Td = ({ children, align = "left", className = "" }) => (
  <td className={`py-2 px-4 text-${align} ${className}`}>{children}</td>
);
const Input = (props) => <input {...props} className="border rounded px-2 py-1 w-full text-sm" />;
const NavBtn = ({ disabled, onClick, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1 flex items-center gap-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
  >
    {children}
  </button>
);
const ActionGroup = ({ children }) => <div className="flex justify-center gap-6">{children}</div>;

const IconBtn = ({ color, label, onClick, children }) => (
  <button
    onClick={onClick}
    className={`group relative text-${color}-600 hover:text-${color}-800 text-2xl`}
  >
    {children}
    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition bg-gray-800 text-white text-xs px-2 py-1 rounded shadow">
      {label}
    </span>
  </button>
);

const SearchBox = ({ value, onChange }) => (
  <div className="relative w-full sm:w-96">
    <FaSearch className="absolute top-3 left-3 text-gray-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search name / email / phone"
      className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none"
    />
  </div>
);
const HostelFilter = ({ value, options, onChange }) => (
  <div className="relative mt-4 sm:mt-0 w-full sm:w-64">
    <FaUniversity className="absolute top-3 left-3 text-gray-400" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none"
    >
      {options.map((h) => (
        <option key={h} value={h}>
          {h === "all" ? "All Hostels" : h}
        </option>
      ))}
    </select>
  </div>
);

export default AdminUsers;
