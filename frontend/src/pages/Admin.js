import React, { useEffect, useState } from "react";

export default function Admin() {
  const [students, setStudents] = useState([]);

  const load = () => {
    fetch("http://127.0.0.1:5000/students")
      .then((r) => r.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    load();
  }, []);

  const del = async (id) => {
    if (
      !window.confirm(
        "Are you sure? This will permanently remove the student and all their attendance records."
      )
    )
      return;
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/admin/delete_student/${id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2.5rem", margin: 0 }}>
          System <span style={{ color: "var(--secondary)" }}>Management</span>
        </h1>
        <p className="status">Database Administration & User Control</p>
      </header>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>Registered Students</h3>
          <span
            className="brand-tag"
            style={{
              background: "var(--accent)",
              color: "white",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            {students.length} Total Users
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            className="table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ textAlign: "left", background: "rgba(0,0,0,0.02)" }}>
                <th
                  style={{
                    padding: "16px 24px",
                    color: "var(--muted)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                  }}
                >
                  Student ID
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    color: "var(--muted)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                  }}
                >
                  Full Name
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    color: "var(--muted)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((s) => (
                  <tr
                    key={s.id}
                    className="table-row-hover"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
                  >
                    <td
                      style={{
                        padding: "16px 24px",
                        fontWeight: "600",
                        color: "var(--accent)",
                      }}
                    >
                      #{s.id}
                    </td>
                    <td style={{ padding: "16px 24px", fontWeight: "500" }}>
                      {s.name}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button
                        className="btn ghost"
                        onClick={() => del(s.id)}
                        style={{
                          padding: "8px 16px",
                          fontSize: "12px",
                          color: "#ef4444",
                          borderColor: "rgba(239, 68, 68, 0.2)",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--muted)",
                    }}
                  >
                    No students registered in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
