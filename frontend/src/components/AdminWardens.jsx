/*  src/pages/AdminWardens.jsx
    Professional Warden‑management screen
    ─ list, search, filter
    ─ edit / delete rows
    ─ “Add Warden” modal with labels & default‑password note
------------------------------------------------------------------*/
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaTrash,
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaUniversity,
} from "react-icons/fa";
import AdminSidebar from "../components/AdminSidebar";

const PAGE_SIZE = 10;
const TABLE_HEIGHT = "80vh";

const AdminWardens = () => {
  /* ───────── sidebar shift ───────── */
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentML = isSidebarOpen ? "md:ml-64" : "md:ml-20";

  /* ───────── data + UI state ───────── */
  const [wardens, setWardens] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    mail: "",
    phone: "",
    hid: "",
  });

  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [page, setPage] = useState(0);

  const api = import.meta.env.VITE_API_BASE_URL;

  /* ───────── initial fetch ───────── */
  useEffect(() => {
    (async () => {
      try {
        const [{ data: wData }, { data: aData }] = await Promise.all([
          axios.get(`${api}/admin/wardens`, { withCredentials: true }),
          axios.get(`${api}/admin/analytics`, { withCredentials: true }),
        ]);
        setWardens(wData.wardens);
        setHostels(aData.hostels);
      } catch {
        setError("Failed to load wardens.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────── search & filter logic ───────── */
  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return wardens
      .filter(
        (w) =>
          w.name.toLowerCase().includes(t) ||
          w.mail.toLowerCase().includes(t) ||
          w.phone.includes(t)
      )
      .filter((w) =>
        hostelFilter === "all" ? true : w.hostel_name === hostelFilter
      );
  }, [wardens, search, hostelFilter]);

  useEffect(() => {
    if (page > Math.floor(filtered.length / PAGE_SIZE)) setPage(0);
  }, [filtered, page]);

  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* ───────── helpers ───────── */
  const startEdit = (w) => {
    setEditId(w.wid);
    setForm({ name: w.name, mail: w.mail, phone: w.phone, hid: w.hid });
  };
  const cancelEdit = () => (setEditId(null), setForm({}));

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleAddChange = (e) =>
    setAddForm({ ...addForm, [e.target.name]: e.target.value });

  const hostelById = (hid) =>
    hostels.find((h) => String(h.hid) === String(hid))?.name || "";

  /* save edit row */
  const saveEdit = async (wid) => {
    try {
      await axios.put(`${api}/admin/warden/${wid}`, form, {
        withCredentials: true,
      });
      setWardens((p) =>
        p.map((w) =>
          w.wid === wid
            ? { ...w, ...form, hostel_name: hostelById(form.hid) }
            : w
        )
      );
      cancelEdit();
    } catch {
      alert("Update failed");
    }
  };

  /* add new warden */
  const addWarden = async () => {
    try {
      const { data } = await axios.post(`${api}/admin/warden`, addForm, {
        withCredentials: true,
      });
      setWardens([
        ...wardens,
        {
          wid: data.wid,
          name: addForm.name,
          mail: addForm.mail,
          phone: addForm.phone,
          hid: addForm.hid,
          hostel_name: hostelById(addForm.hid),
        },
      ]);
      alert(`Default password: ${data.default_password}`);
      setAddForm({ name: "", mail: "", phone: "", hid: "" });
      setAddOpen(false);
    } catch {
      alert("Add failed");
    }
  };

  /* delete row */
  const del = async (wid) => {
    if (!confirm("Delete this warden?")) return;
    try {
      await axios.delete(`${api}/admin/warden/${wid}`, {
        withCredentials: true,
      });
      setWardens((p) => p.filter((w) => w.wid !== wid));
    } catch {
      alert("Delete failed");
    }
  };

  const hostelNames = ["all", ...new Set(hostels.map((h) => h.name))];

  /* ───────── splash screens ───────── */
  if (loading) return <Splash text="Loading…" pulse />;
  if (error) return <Splash text={error} error />;

  /* ───────── main render ───────── */
  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800" style={{marginLeft: "-10pc"}}>
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main
        className={`w-full transition-all duration-300 p-4 sm:p-6 md:p-8 ${contentML}`}
      >
        <h1 className="text-3xl font-bold mb-6">Manage Wardens</h1>

        {/* top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-6">
          <SearchBox value={search} onChange={setSearch} />
          <HostelFilter
            value={hostelFilter}
            options={hostelNames}
            onChange={setHostelFilter}
          />
          <button
            onClick={() => setAddOpen(true)}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          >
            <FaPlus /> Add Warden
          </button>
        </div>

        {/* ───── Modal: Add Warden ───── */}
        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-[95%] sm:w-[34rem] rounded-xl shadow-2xl p-8 space-y-8 animate-fadeIn">
              {/* header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">New Warden</h2>
                  <p className="text-sm text-gray-500">
                    Default password&nbsp;
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">
                      {addForm.name?.split(" ")[0]?.toLowerCase() ||
                        "firstname"}
                      @123
                    </code>
                    &nbsp;— ask warden to change on first login.
                  </p>
                </div>
                <button
                  onClick={() => setAddOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>

              {/* form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <LabeledInput
                  label="Full Name"
                  name="name"
                  placeholder="e.g. Priya Nair"
                  value={addForm.name}
                  onChange={handleAddChange}
                />
                <LabeledInput
                  label="Email"
                  name="mail"
                  type="email"
                  placeholder="warden@example.com"
                  value={addForm.mail}
                  onChange={handleAddChange}
                />
                <LabeledInput
                  label="Phone"
                  name="phone"
                  placeholder="10‑digit mobile"
                  value={addForm.phone}
                  onChange={handleAddChange}
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Hostel
                  </label>
                  <select
                    name="hid"
                    value={addForm.hid}
                    onChange={handleAddChange}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select hostel</option>
                    {hostels.map((h) => (
                      <option key={h.hid} value={h.hid}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={addWarden}
                  className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== table ===== */}
        <div className="w-full md:w-[95%]">
          <div className="rounded-lg shadow bg-white overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: TABLE_HEIGHT }}>
              <table className="min-w-full text-sm sm:text-base">
                <thead className="bg-gray-800 text-white sticky top-0">
                  <tr>
                    <Th>WID</Th>
                    <Th>Name</Th>
                    <Th>Mail</Th>
                    <Th>Phone</Th>
                    <Th>Hostel</Th>
                    <Th align="center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((w) => (
                    <tr key={w.wid} className="even:bg-gray-50">
                      <Td>{w.wid}</Td>
                      <Td>
                        {editId === w.wid ? (
                          <Input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                          />
                        ) : (
                          w.name
                        )}
                      </Td>
                      <Td>
                        {editId === w.wid ? (
                          <Input
                            name="mail"
                            value={form.mail}
                            onChange={handleChange}
                          />
                        ) : (
                          w.mail
                        )}
                      </Td>
                      <Td>
                        {editId === w.wid ? (
                          <Input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                          />
                        ) : (
                          w.phone
                        )}
                      </Td>
                      <Td>
                        {editId === w.wid ? (
                          <select
                            name="hid"
                            value={form.hid}
                            onChange={handleChange}
                            className="w-full border rounded px-2 py-1"
                          >
                            {hostels.map((h) => (
                              <option key={h.hid} value={h.hid}>
                                {h.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          w.hostel_name
                        )}
                      </Td>
                      <Td align="center">
                        {editId === w.wid ? (
                          <ActionGroup>
                            <IconBtn
                              label="Save"
                              color="green"
                              onClick={() => saveEdit(w.wid)}
                            >
                              <FaSave />
                            </IconBtn>
                            <IconBtn
                              label="Cancel"
                              color="gray"
                              onClick={cancelEdit}
                            >
                              <FaTimes />
                            </IconBtn>
                          </ActionGroup>
                        ) : (
                          <ActionGroup>
                            <IconBtn
                              label="Edit"
                              color="blue"
                              onClick={() => startEdit(w)}
                            >
                              <FaEdit />
                            </IconBtn>
                            <IconBtn
                              label="Delete"
                              color="red"
                              onClick={() => del(w.wid)}
                            >
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
                <NavBtn
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <FaChevronLeft /> Prev
                </NavBtn>
                <span className="text-sm">
                  Page {page + 1} of {Math.ceil(filtered.length / PAGE_SIZE)}
                </span>
                <NavBtn
                  disabled={page + 1 >= filtered.length / PAGE_SIZE}
                  onClick={() =>
                    setPage((p) =>
                      p + 1 < filtered.length / PAGE_SIZE ? p + 1 : p
                    )
                  }
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

/* ───────── reusable bits ───────── */
const Splash = ({ text, pulse = false, error = false }) => (
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
const Td = ({ children, align = "left" }) => (
  <td className={`py-2 px-4 text-${align}`}>{children}</td>
);

const Input = ({ label, ...rest }) =>
  label ? (
    <LabeledInput label={label} {...rest} />
  ) : (
    <input {...rest} className="border rounded px-2 py-1 w-full text-sm" />
  );

const LabeledInput = ({ label, ...rest }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {label}
    </label>
    <input
      {...rest}
      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const NavBtn = ({ disabled, onClick, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1 flex items-center gap-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
  >
    {children}
  </button>
);
const ActionGroup = ({ children }) => (
  <div className="flex justify-center gap-6">{children}</div>
);
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
      placeholder="Search name / mail / phone"
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

export default AdminWardens;
