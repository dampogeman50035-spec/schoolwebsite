// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./components/Register";
import FaceLogin from "./components/FaceLogin";
import Dashboard from "./pages/Dashboard";
import AttendanceLogs from "./pages/AttendanceLogs";
import Admin from "./pages/Admin";

import ToastProvider from "./components/Toast";
import "./App.css";

function Navbar({ theme, toggleTheme }) {
  const location = useLocation();

  return (
    <header className="navbar glass-nav">
      <div className="nav-container">
        <div className="nav-left">
          <img src="/gist-logo-new-197x197.png" alt="Logo" className="nav-logo" />
          <div className="brand-group">
            <h1 className="brand-text">Face Attendance</h1>
            <span className="brand-subtext">GIST Terminal</span>
          </div>
        </div>

        <nav className="nav-links">
          {[
            { path: "/", label: "Home" },
            { path: "/register", label: "Enroll" },
            { path: "/login", label: "Scan" },
            { path: "/dashboard", label: "Stats" },
            { path: "/logs", label: "Logs" },
            { path: "/admin", label: "Admin" },
          ].map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={location.pathname === link.path ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-right">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Appearance">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ToastProvider>
      <Router>
        <div className="app-root">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<FaceLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/logs" element={<AttendanceLogs />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}