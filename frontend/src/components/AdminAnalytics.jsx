import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUniversity,
  FaDoorClosed,
  FaUserTie,
  FaUserGraduate,
  FaExclamationCircle,
} from "react-icons/fa";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
    <div
      className={`text-3xl p-3 rounded-full bg-opacity-20`}
      style={{ color, backgroundColor: `${color}33` }}
    >
      <Icon />
    </div>
    <div>
      <h4 className="text-gray-500 text-sm uppercase tracking-wide">{label}</h4>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/admin/analytics`,
          {
            withCredentials: true,
          }
        );
        setData(res.data);
      } catch (err) {
        setError("Failed to load analytics.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading)
    return <p className="text-lg animate-pulse">Loading analytics…</p>;
  if (error)
    return <p className="text-lg text-red-500 font-semibold">{error}</p>;

  const { meta, hostels, rooms, wardens, students, complaints } = data;

  const cards = [
    {
      label: "Hostels",
      value: hostels.length,
      icon: FaUniversity,
      color: "#3b82f6",
    },
    {
      label: "Rooms",
      value: rooms.length,
      icon: FaDoorClosed,
      color: "#6366f1",
    },
    {
      label: "Wardens",
      value: wardens.length,
      icon: FaUserTie,
      color: "#10b981",
    },
    {
      label: "Students",
      value: meta.student_count,
      icon: FaUserGraduate,
      color: "#f59e0b",
    },
    {
      label: "Open Complaints",
      value: meta.complaints_open,
      icon: FaExclamationCircle,
      color: "#ef4444",
    },
  ];

  // Chart Data: Students per Hostel
  const studentCountByHostel = hostels.map(
    (h) => students.filter((s) => s.hid === h.hid).length
  );
  const doughnutData = {
    labels: hostels.map((h) => h.name),
    datasets: [
      {
        label: "Students",
        data: studentCountByHostel,
        backgroundColor: ["#60a5fa", "#fbbf24", "#34d399", "#a78bfa"],
        borderWidth: 0,
      },
    ],
  };

  // Chart Data: Complaints by Status
  const complaintStatusCount = complaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const barData = {
    labels: Object.keys(complaintStatusCount),
    datasets: [
      {
        label: "Complaints",
        data: Object.values(complaintStatusCount),
        backgroundColor: "#ef4444",
      },
    ],
  };

  return (
    <div className="space-y-10">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* GRAPHS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-md font-semibold mb-2 text-gray-700">
            Student Distribution
          </h3>
          <div className="h-64 md:h-72">
            <Doughnut
              data={doughnutData}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { font: { size: 12 } },
                  },
                },
                cutout: "65%",
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-md font-semibold mb-2 text-gray-700">
            Complaints Overview
          </h3>
          <div className="h-64 md:h-72">
            {complaints.length > 0 ? (
              <Bar
                data={barData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 12 } },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: "#f3f4f6" },
                      ticks: { stepSize: 1, font: { size: 12 } },
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <p className="text-sm text-gray-500">No complaints to display.</p>
            )}
          </div>
        </div>
      </div>

      {complaints.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Latest Complaints</h2>
          <div className="overflow-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-3 text-left">CID</th>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 5).map((c) => (
                  <tr
                    key={c.cid}
                    className="border-b last:border-b-0 even:bg-gray-50"
                  >
                    <td className="p-3">{c.cid}</td>
                    <td className="p-3">{c.student_name}</td>
                    <td className="p-3">{c.type}</td>
                    <td className="p-3">{c.status}</td>
                    <td className="p-3">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {/* HOSTEL TABLE */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Hostels</h2>
        <div className="overflow-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 text-left">HID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left"># Rooms</th>
              </tr>
            </thead>
            <tbody>
              {hostels.map((h) => (
                <tr
                  key={h.hid}
                  className="border-b last:border-b-0 even:bg-gray-50"
                >
                  <td className="p-3">{h.hid}</td>
                  <td className="p-3">{h.name}</td>
                  <td className="p-3">{h.location}</td>
                  <td className="p-3">{h.numberofrooms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* RECENT COMPLAINTS */}

      {/* FOOTER META */}
      <p className="text-sm text-gray-500">
        Last refreshed&nbsp;
        {new Date(meta.generated_at).toLocaleString()}
      </p>
    </div>
  );
};

export default AdminAnalytics;
