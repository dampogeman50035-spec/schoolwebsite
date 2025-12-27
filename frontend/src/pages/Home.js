import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  // Re-adding your actions array so the buttons actually appear
  const actions = [
    { 
      title: "Face Enrollment", 
      desc: "Register new students into the biometric database.", 
      path: "/register", 
      icon: "👤+", 
      color: "var(--secondary)" 
    },
    { 
      title: "Attendance Scan", 
      desc: "Launch the scanner for real-time face recognition.", 
      path: "/login", 
      icon: "📸", 
      color: "var(--primary)" 
    },
    { 
      title: "View Records", 
      desc: "Check today's attendance logs and student data.", 
      path: "/logs", 
      icon: "📊", 
      color: "var(--accent)" 
    }
  ];

  return (
    <div className="animate-in" style={{ paddingBottom: '50px' }}>
      
      {/* Hero Header Section */}
      <div style={{ 
        background: 'var(--card)', /* Uses theme-aware variable */
        borderRadius: '0 0 50px 50px', 
        padding: '20px', 
        borderBottom: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow)',
        marginBottom: '40px',
        transition: 'all 0.3s ease' 
      }}>
        <header style={{ 
          textAlign: 'center', 
          padding: '80px 0', 
          maxWidth: '850px', 
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span className="brand-tag">
            GIST Biometric Terminal v2.0
          </span>

          <h1 style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', 
              color: 'var(--text-main)', 
              lineHeight: '1.1',
              fontWeight: '800',
              margin: '20px 0'
          }}>
            The Future of <br/>
            <span style={{ color: 'var(--primary)' }}>Attendance</span> is Visual.
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px' }}>
            Secure, seamless, and automated facial recognition system designed for GIST.
          </p>
        </header>
      </div>

      {/* Grid of Action Cards */}
      <div className="page-wrapper" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {actions.map((action, i) => (
          <div 
            key={i} 
            className="card" 
            onClick={() => navigate(action.path)}
            style={{ 
              cursor: 'pointer', 
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              padding: '40px'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ 
              fontSize: '32px', 
              background: 'var(--bg)', 
              width: '60px', 
              height: '60px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '16px'
            }}>
              {action.icon}
            </div>
            <h3 style={{ margin: 0, color: action.color, fontSize: '22px' }}>{action.title}</h3>
            <p style={{ margin: 0, fontSize: '15px' }}>{action.desc}</p>
            <div style={{ 
              fontWeight: '800', 
              fontSize: '12px', 
              color: 'var(--primary)', 
              letterSpacing: '1px',
              marginTop: '10px' 
            }}>
              LAUNCH MODULE →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}