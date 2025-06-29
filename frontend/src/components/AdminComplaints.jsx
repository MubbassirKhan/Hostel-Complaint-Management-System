/*  src/pages/AdminComplaints.jsx
    Complaint dashboard – table ▸ overdue ▸ summary cards (slider)
    • horizontal timeline modal
    • icon tool‑tips + confirm prompt
------------------------------------------------------------------*/
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
  FaExclamationTriangle,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import AdminSidebar from "../components/AdminSidebar";

/* ───── constants ───── */
const PAGE_SIZE = 12;
const OVERDUE_DAYS = 3;
const TABLE_HEIGHT = "75vh";
const STATUS_COLORS = {
  Pending: "text-yellow-600",
  "In‑Progress": "text-blue-600",
  Resolved: "text-green-600",
  Rejected: "text-red-600",
};

/* ───── main component ───── */
const AdminComplaints = () => {
  /* state */
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentML = isSidebarOpen ? "md:ml-64" : "md:ml-20";

  const [summary, setSummary] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);

  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* refs (MUST be before early returns) */
  const sliderRef = useRef(null);

  const api = import.meta.env.VITE_API_BASE_URL;

  /* fetch data */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [{ data: s }, { data: o }, { data: c }] = await Promise.all([
        axios.get(`${api}/admin/complaints/summary`, { withCredentials: true }),
        axios.get(`${api}/admin/complaints/overdue`, { withCredentials: true }),
        axios.get(`${api}/admin/complaints`, { withCredentials: true }),
      ]);
      setSummary(s.summary);
      setOverdue(o.overdue);
      setComplaints(c.complaints);
    } catch {
      setError("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);

  /* derived table rows */
  const filtered = useMemo(
    () =>
      statusFilter === "All"
        ? complaints
        : complaints.filter((c) => c.status === statusFilter),
    [complaints, statusFilter]
  );
  useEffect(() => {
    if (page > Math.floor(filtered.length / PAGE_SIZE)) setPage(0);
  }, [filtered, page]);
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* handlers */
  const updateStatus = async (cid, newStatus) => {
    if (!window.confirm(`Mark complaint #${cid} as ${newStatus}?`)) return;
    try {
      await axios.put(
        `${api}/admin/complaint/${cid}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      setComplaints((p) =>
        p.map((c) => (c.cid === cid ? { ...c, status: newStatus } : c))
      );
      if (selected?.cid === cid) setSelected({ ...selected, status: newStatus });
    } catch {
      alert("Update failed");
    }
  };
  const scrollBy = (dir) => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.clientWidth;
    sliderRef.current.scrollBy({ left: dir * width * 0.9, behavior: "smooth" });
  };

  /* early splash / error */
  if (loading) return <Splash text="Loading…" pulse />;
  if (error) return <Splash text={error} error />;

  /* ───── render ───── */
  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800" style={{ marginLeft: "-10pc" }}>
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main
        className={`w-full transition-all duration-300 p-4 sm:p-6 md:p-8 ${contentML}`}
      >
        {/* HEADER */}
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-4">
          Complaints
          <button
            onClick={fetchAll}
            className="text-blue-600 hover:text-blue-800 text-xl"
            title="Refresh"
          >
            <FaSyncAlt />
          </button>
        </h1>

        {/* 1️⃣ FULL TABLE */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">All Complaints</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              {["All", "Pending", "In‑Progress", "Resolved", "Rejected"].map(
                (s) => (
                  <option key={s}>{s}</option>
                )
              )}
            </select>
          </div>

          <div className="rounded-lg shadow bg-white overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: TABLE_HEIGHT }}>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-white sticky top-0">
                  <tr>
                    <Th align="center">CID</Th>
                    <Th>Hostel</Th>
                    <Th>Student</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th align="center">Created</Th>
                    <Th align="center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((c) => (
                    <tr
                      key={c.cid}
                      className="even:bg-gray-50 hover:bg-blue-50 cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <Td align="center">{c.cid}</Td>
                      <Td>{c.hostel_name}</Td>
                      <Td>{c.student_name}</Td>
                      <Td>{c.type}</Td>
                      <Td className={`${STATUS_COLORS[c.status]} font-medium`}>
                        {c.status}
                      </Td>
                      <Td align="center">
                        {new Date(c.created_at).toLocaleDateString()}
                      </Td>
                      <Td align="center">
                        <ActionIcons cid={c.cid} update={updateStatus} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > PAGE_SIZE && (
              <Paginator
                page={page}
                total={filtered.length}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() =>
                  setPage((p) =>
                    p + 1 < filtered.length / PAGE_SIZE ? p + 1 : p
                  )
                }
              />
            )}
          </div>
        </section>

        {/* 2️⃣ OVERDUE */}
        <OverdueSection overdue={overdue} />

        {/* 3️⃣ SUMMARY SLIDER */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Hostel Summary</h2>
            <div className="flex gap-2">
              <NavBtn onClick={() => scrollBy(-1)}>
                <FaChevronLeft />
              </NavBtn>
              <NavBtn onClick={() => scrollBy(1)}>
                <FaChevronRight />
              </NavBtn>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory"
          >
            {summary.map((h) => (
              <div key={h.hid} className="snap-start shrink-0 w-[18rem]">
                <SummaryCard {...h} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL */}
      {selected && (
        <DetailsModal complaint={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

/* ───── Details Modal ───── */
const DetailsModal = ({ complaint, onClose }) => {
  const steps = ["Created", "In‑Progress", "Resolved", "Rejected"];
  const reached = {
    Created: true,
    "In‑Progress": ["In‑Progress", "Resolved", "Rejected"].includes(
      complaint.status
    ),
    Resolved: complaint.status === "Resolved",
    Rejected: complaint.status === "Rejected",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full sm:w-[40rem] max-h-[90vh] overflow-auto p-8 space-y-8 animate-fadeIn">
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <FaInfoCircle className="text-blue-600" /> Complaint #{complaint.cid}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        <table className="w-full text-sm border rounded mb-6">
          <tbody>
            <TableRow label="Hostel" value={complaint.hostel_name} />
            <TableRow
              label="Student"
              value={`${complaint.student_name} (SHID: ${complaint.shid})`}
            />
            <TableRow label="Type" value={complaint.type} />
            <TableRow
              label="Created"
              value={new Date(complaint.created_at).toLocaleString()}
            />
          </tbody>
        </table>

        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    reached[s]
                      ? s === "Rejected"
                        ? "bg-red-500 border-red-500 text-white"
                        : "bg-green-500 border-green-500 text-white"
                      : "bg-white border-gray-400 text-gray-400"
                  }`}
                >
                  {reached[s] ? (
                    s === "Rejected" ? (
                      <FaTimes />
                    ) : (
                      <FaCheck />
                    )
                  ) : (
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </span>
                <span className="mt-2 text-xs font-medium">{s}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-300 mx-1" />
              )}
            </React.Fragment>
          ))}
        </div>

        <DetailRow
          label="Description"
          value={complaint.description || "—"}
          isLong
        />
        {complaint.proofimage && (
          <div>
            <h4 className="font-medium mb-2">Proof</h4>
            <img
              src={`data:image/*;base64,${complaint.proofimage}`}
              alt="proof"
              className="w-full rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

/* ───── reusable UI pieces ───── */
const SummaryCard = ({ hostel_name, hid, total, pending, resolved, overdue }) => (
  <div className="bg-white rounded-xl shadow p-5 h-full">
    <h3 className="text-lg font-semibold mb-1">{hostel_name}</h3>
    <p className="text-sm text-gray-500 mb-3">HID #{hid}</p>
    <div className="flex flex-wrap gap-3 text-sm">
      <Badge color="gray">Total {total}</Badge>
      <Badge color="yellow">Pending {pending}</Badge>
      <Badge color="green">Resolved {resolved}</Badge>
      <Badge color="red">Overdue {overdue}</Badge>
    </div>
  </div>
);

const OverdueSection = ({ overdue }) => (
  <section>
    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-red-600">
      <FaExclamationTriangle /> Overdue&nbsp;({overdue.length})
      <span className="text-sm text-gray-500 font-normal">
        &nbsp;(&gt; {OVERDUE_DAYS} days)
      </span>
    </h2>
    {overdue.length === 0 ? (
      <p className="text-gray-500">Great! No overdue complaints.</p>
    ) : (
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-white sticky top-0">
            <tr>
              <Th align="center">CID</Th>
              <Th>Hostel</Th>
              <Th>Type</Th>
              <Th align="center">Age (days)</Th>
              <Th>Warden</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {overdue.map((o) => (
              <tr key={o.cid} className="even:bg-gray-50">
                <Td align="center">{o.cid}</Td>
                <Td>{o.hostel_name}</Td>
                <Td>{o.type}</Td>
                <Td align="center" className="font-semibold text-red-600">
                  {o.age_days.toFixed(1)}
                </Td>
                <Td>{o.warden_name}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const ActionIcons = ({ cid, update }) => (
  <div className="flex gap-4 justify-center text-xl">
    <HoverIcon label="Resolve" color="green" onClick={() => update(cid, "Resolved")} icon={<FaCheck />} />
    <HoverIcon label="Progress" color="blue" onClick={() => update(cid, "In‑Progress")} icon={<FaSpinner />} />
    <HoverIcon label="Reject" color="red" onClick={() => update(cid, "Rejected")} icon={<FaTimes />} />
  </div>
);

const HoverIcon = ({ label, color, onClick, icon }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`group relative text-${color}-600 hover:opacity-80`}
  >
    {icon}
    <span
      className="
        pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2
        whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-0.5
        opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100
        transition
      "
    >
      {label}
    </span>
  </button>
);

/* ───── tiny helpers ───── */
const Splash = ({ text, pulse = false, error = false }) => (
  <div
    className={`min-h-screen flex items-center justify-center text-lg ${
      pulse ? "animate-pulse" : ""
    } ${error ? "text-red-500 font-semibold" : ""}`}
  >
    {text}
  </div>
);

const Badge = ({ color, children }) => {
  const palette = {
    gray: "bg-gray-200 text-gray-800",
    yellow: "bg-yellow-200 text-yellow-800",
    green: "bg-green-200 text-green-800",
    red: "bg-red-200 text-red-800",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${palette[color]}`}>{children}</span>;
};

const Th = ({ children, align = "left" }) => (
  <th className={`py-3 px-4 text-${align}`}>{children}</th>
);
const Td = ({ children, align = "left" }) => (
  <td className={`py-2 px-4 text-${align}`}>{children}</td>
);

const Paginator = ({ page, total, onPrev, onNext }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <NavBtn disabled={page === 0} onClick={onPrev}>
      <FaChevronLeft /> Prev
    </NavBtn>
    <span className="text-sm">
      Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
    </span>
    <NavBtn disabled={page + 1 >= total / PAGE_SIZE} onClick={onNext}>
      Next <FaChevronRight />
    </NavBtn>
  </div>
);

const NavBtn = ({ disabled, onClick, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1 flex items-center gap-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
  >
    {children}
  </button>
);

const TableRow = ({ label, value }) => (
  <tr className="border-b last:border-b-0">
    <td className="p-2 font-medium w-32">{label}</td>
    <td className="p-2">{value}</td>
  </tr>
);

const DetailRow = ({ label, value, isLong = false }) => (
  <div className="flex flex-col mb-4">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className={`text-base ${isLong ? "whitespace-pre-wrap" : ""}`}>
      {value}
    </span>
  </div>
);

export default AdminComplaints;
