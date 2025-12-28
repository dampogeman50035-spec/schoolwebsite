import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_students: 0,
    total_logs: 0,
  });

  // Fetch dashboard stats
  const loadStats = async () => {
    try {
      const res = await fetch("https://keshia-hyperemic-jamison.ngrok-free.dev/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="card">
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-box">
          <h3>Total Registered Students</h3>
          <p className="stat-number">{stats.total_students}</p>
        </div>

        <div className="stat-box">
          <h3>Total Attendance Logs</h3>
          <p className="stat-number">{stats.total_logs}</p>
        </div>
      </div>
    </div>
  );
}
