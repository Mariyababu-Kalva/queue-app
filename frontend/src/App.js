import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import TrackToken from "./pages/TrackToken";
import OperatorPanel from "./pages/OperatorPanel";

export default function App() {
  return (
    <Router>
      <div style={styles.appContainer}>
        <Routes>
          <Route path="/track" element={<TrackToken />} />
          <Route path="/admin" element={<OperatorPanel />} />
          <Route path="/" element={<HomeMenu />} />
        </Routes>
      </div>
    </Router>
  );
}

function HomeMenu() {
  const [showPassEntry, setShowPassEntry] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleAdminAccess = (e) => {
    e.preventDefault();
    // Replace 'admin123' with your desired local password
    if (password === "admin123") {
      navigate("/admin");
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={styles.menuWrapper}>
      <header style={styles.header}>
        <h1 style={styles.title}>Queue<span style={{ color: '#6366f1' }}>Flow</span></h1>
        <p style={styles.subtitle}>Select your interface to get started</p>
      </header>

      <div style={styles.cardContainer}>
        {/* Public Customer View */}
        <Link to="/track" style={styles.linkCard} className="card-hover">
          <div style={{ ...styles.iconBg, background: '#eef2ff' }}>📱</div>
          <h3 style={styles.cardTitle}>Customer View</h3>
          <p style={styles.cardDesc}>Check live status and track your assigned token number.</p>
          <span style={styles.badge}>Public Access</span>
        </Link>

        {/* Protected Operator View */}
        <div 
          style={{ 
            ...styles.linkCard, 
            borderTop: '4px solid #1e293b',
            cursor: showPassEntry ? 'default' : 'pointer' 
          }} 
          onClick={() => !showPassEntry && setShowPassEntry(true)}
        >
          {!showPassEntry ? (
            <>
              <div style={{ ...styles.iconBg, background: '#f1f5f9' }}>⚙️</div>
              <h3 style={styles.cardTitle}>Operator Panel</h3>
              <p style={styles.cardDesc}>Manage desk activity, call next tokens, and reset queue.</p>
              <span style={{ ...styles.badge, background: '#f1f5f9', color: '#475569' }}>Staff Only</span>
            </>
          ) : (
            <form onSubmit={handleAdminAccess} style={styles.passForm}>
              <h3 style={{ ...styles.cardTitle, marginBottom: '15px' }}>Enter Password</h3>
              <input 
                autoFocus
                type="password" 
                placeholder="••••••••"
                style={{ ...styles.input, borderColor: error ? '#ef4444' : '#e2e8f0' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.loginBtn}>Unlock</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setShowPassEntry(false); }} style={styles.cancelBtn}>Cancel</button>
              </div>
              {error && <p style={styles.errorText}>Invalid Password</p>}
            </form>
          )}
        </div>
      </div>

      <style>
        {`
          .card-hover:hover { transform: translateY(-8px); }
          * { transition: all 0.3s ease; }
        `}
      </style>
    </div>
  );
}

const styles = {
  appContainer: { margin: 0, padding: 0, minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", justifyContent: "center" },
  menuWrapper: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "1000px", padding: "20px" },
  header: { textAlign: 'center', marginBottom: '60px' },
  title: { fontSize: "3rem", fontWeight: "900", color: "#1e293b", margin: 0, letterSpacing: '-1.5px' },
  subtitle: { color: "#64748b", fontSize: "1.1rem", marginTop: "10px" },
  
  cardContainer: { display: "flex", gap: "30px", flexWrap: "wrap", justifyContent: "center" },
  linkCard: { 
    width: "300px", minHeight: "320px", padding: "40px 30px", backgroundColor: "#fff", textDecoration: "none", color: "inherit", borderRadius: "32px", 
    textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)", borderTop: "4px solid #6366f1", display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  
  iconBg: { width: "80px", height: "80px", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "20px" },
  cardTitle: { fontSize: "1.4rem", fontWeight: "700", color: "#1e293b", margin: "0 0 12px 0" },
  cardDesc: { color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px", flex: 1 },
  badge: { padding: "6px 12px", background: "#eef2ff", color: "#6366f1", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "700", textTransform: 'uppercase' },

  // Password Form
  passForm: { width: '100%', display: 'flex', flexDirection: 'column', height: '100%' },
  input: { padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '15px', outline: 'none', textAlign: 'center', fontSize: '1rem' },
  buttonGroup: { display: 'flex', gap: '10px' },
  loginBtn: { flex: 2, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer' },
  errorText: { color: '#ef4444', fontSize: '0.8rem', marginTop: '10px', fontWeight: '600' }
};