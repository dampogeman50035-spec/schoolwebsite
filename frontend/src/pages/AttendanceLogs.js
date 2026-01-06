import React, { useEffect, useState } from "react";

export default function AttendanceLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("https://keshia-hyperemic-jamison.ngrok-free.dev/attendance")
      .then((r) => r.json())
      .then((data) => setLogs(data))
      .catch((err) => console.error(err));
  }, []);

  // Helper to make timestamps look premium
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Attendance <span style={{ color: 'var(--secondary)' }}>History</span></h1>
          <p className="status">Real-time record of biometric verifications</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <span className="brand-tag" style={{ background: 'var(--accent)', color: 'white', padding: '6px 14px', borderRadius: '12px' }}>
            {logs.length} Entries Today
          </span>
        </div>
      </header>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', textAlign: 'left' }}>
                <th style={{ padding: '20px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '20px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>ID Reference</th>
                <th style={{ padding: '20px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '20px 24px', color: 'var(--muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((l) => {
                  const { date, time } = formatDateTime(l.timestamp);
                  return (
                    <tr key={l.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text)' }}>{l.name || "Unknown User"}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <code style={{ background: 'var(--bg)', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                          ID-{l.student_id || 'N/A'}
                        </code>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: '700',
                          background: 'rgba(22, 163, 74, 0.1)', 
                          color: '#16a34a' 
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                          Verified
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{time}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{date}</div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '18px' }}>No logs found for today</div>
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