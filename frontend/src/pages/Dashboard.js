import React, { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

// Register ChartJS modules
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  const [data, setData] = useState(null);

  const loadDashboardData = async () => {
    try {
      // Fetching the new expanded data route
      const res = await fetch("https://keshia-hyperemic-jamison.ngrok-free.dev/dashboard-data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (!data) return <div className="loading">Analyzing Data...</div>;

  // Pie Chart Configuration (Location)
  const locationChart = {
    labels: Object.keys(data.locations),
    datasets: [{
      data: Object.values(data.locations),
      backgroundColor: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"],
      hoverOffset: 15,
      borderWidth: 0,
    }],
  };

  // Bar Chart Configuration (Hourly Trends)
  const trendChart = {
    labels: Object.keys(data.hours),
    datasets: [{
      label: "Check-ins",
      data: Object.values(data.hours),
      backgroundColor: "rgba(79, 70, 229, 0.7)",
      borderRadius: 6,
    }],
  };

  return (
    <div className="dashboard-wrapper animate-in">
      <header className="dashboard-header">
        <h2>Visual Analytics</h2>
        <p className="subtitle">GIST Terminal Real-time Insights</p>
      </header>

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-box glass-card">
          <h3>Total Registered</h3>
          <p className="stat-number">{data.total_students}</p>
        </div>
        <div className="stat-box glass-card">
          <h3>Active Locations</h3>
          <p className="stat-number">{Object.keys(data.locations).length}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        <div className="chart-card glass-card">
          <h3>Attendance by Building</h3>
          <div className="chart-inner">
            <Pie data={locationChart} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="chart-card glass-card">
          <h3>Peak Traffic (By Hour)</h3>
          <div className="chart-inner">
            <Bar 
              data={trendChart} 
              options={{ 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}