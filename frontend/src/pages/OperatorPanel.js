import React, { useState, useEffect } from "react";

export default function OperatorPanel() {
  const [current, setCurrent] = useState(null);
  const [allTokens, setAllTokens] = useState([]);
  const [totalIssued, setTotalIssued] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [modal, setModal] = useState({ show: false, title: "", message: "", onConfirm: null });

  const isSystemFresh = allTokens.length === 0 && totalIssued === 0;

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const openConfirm = (title, message, action) => {
    setModal({ show: true, title, message, onConfirm: action });
  };

  const closeConfirm = () => {
    setModal({ show: false, title: "", message: "", onConfirm: null });
  };

  const manualSync = async () => {
    const data = await refreshStatus();
    if (!data) {
      showToast("Server Connection Failed", "error");
      return;
    }
    // Check if there is actually any data in the system
    const isEmpty = (data.all_tokens?.length === 0 && !data.current);
    if (isEmpty) {
      showToast("System is currently empty", "info");
    } else {
      showToast("Status Updated", "success");
    }
  };

  const refreshStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/status");
      const data = await res.json();
      setAllTokens(data.all_tokens || []);
      setCurrent(data.current);
      setTotalIssued(data.total);
      setWaitingCount(data.waiting_count);
      return data;
    } catch (err) {
      console.error("Sync error:", err);
      return null;
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const nextToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/next", { method: "POST" });
      const data = await res.json();
      if (data.message === "Queue Empty") {
        showToast("The queue is currently empty!", "error");
      } else {
        showToast(`Now calling ${data.current} token`, "success");
      }
      await refreshStatus();
    } catch (e) {
      showToast("Connection failed", "error");
    }
    setLoading(false);
  };

  const generateToken = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/token", { method: "POST" });
      const data = await res.json();
      showToast(`Token ${data.token} Issued`, "success");
      await refreshStatus();
    } catch (e) {
      showToast("Failed to issue token", "error");
    }
  };

  const handleUndo = () => {
    const lastToken = allTokens[allTokens.length - 1];
    if (!lastToken || lastToken.status !== "waiting") {
      showToast("No pending token to undo", "error");
      return;
    }
    openConfirm(
      "Confirm Undo", 
      `Are you sure you want to delete ${lastToken.id}?`, 
      async () => {
        await fetch("http://127.0.0.1:8000/api/token/last", { method: "DELETE" });
        showToast(`Deleted ${lastToken.id}`, "info");
        await refreshStatus();
      }
    );
  };

  const resetSystem = () => {
    if (isSystemFresh) return;
    openConfirm(
      "System Reset", 
      "Wipe all token history and reset counter? This cannot be undone.", 
      async () => {
        await fetch("http://127.0.0.1:8000/api/reset", { method: "POST" });
        showToast("System Reset Successfully", "info");
        await refreshStatus();
      }
    );
  };

  const completeService = async () => {
    await fetch("http://127.0.0.1:8000/api/complete", { method: "POST" });
    showToast("Service marked as completed", "success");
    await refreshStatus();
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'serving': return { color: '#4F46E5', bg: '#EEF2FF', label: 'SERVING' };
      case 'completed': return { color: '#94a3b8', bg: '#f1f5f9', label: 'DONE' };
      default: return { color: '#f59e0b', bg: '#fffbeb', label: 'WAITING' };
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <style>
        {`
          @import url('https://rsms.me/inter/inter.css');
          
          @keyframes slideInRight { 
            from { transform: translateX(120%); opacity: 0; } 
            to { transform: translateX(0); opacity: 1; } 
          }
          
          .toast-animation { animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

          @keyframes pulse { 
            0% { transform: scale(1); opacity: 1; } 
            50% { transform: scale(1.5); opacity: 0.5; } 
            100% { transform: scale(1); opacity: 1; } 
          }

          .btn-hover { transition: all 0.2s ease; cursor: pointer; border-radius: 12px; }
          .btn-hover:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
          .btn-hover:active:not(:disabled) { transform: translateY(0); }
          
          .custom-scroll::-webkit-scrollbar { width: 6px; }
          .custom-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        `}
      </style>

      {toast.show && (
        <div className="toast-animation" style={{
            ...styles.toast, 
            backgroundColor: toast.type === 'error' ? '#EF4444' : (toast.type === 'success' ? '#10B981' : '#1E293B')
        }}>
          <span style={{ marginRight: '12px' }}>{toast.type === 'success' ? '✓' : (toast.type === 'error' ? '✕' : 'ℹ')}</span>
          {toast.message}
        </div>
      )}

      {modal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', color: '#0F172A' }}>{modal.title}</h3>
            <p style={{ color: '#64748B', lineHeight: '1.6' }}>{modal.message}</p>
            <div style={styles.modalActions}>
              <button onClick={closeConfirm} style={styles.modalCancel}>Cancel</button>
              <button onClick={() => { modal.onConfirm(); closeConfirm(); }} style={styles.modalConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.dashboard}>
        {/* Main Console Area */}
        <div style={styles.mainPanel}>
          <header style={styles.header}>
            <div>
              <h1 style={styles.mainTitle}>Operator Desk</h1>
              <div style={styles.statusBadge}>
                <div style={styles.pulseDot}></div>
                <span>Live Connection Active</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={manualSync} className="btn-hover" style={styles.refreshBtn}>↻ Sync</button>
                <button onClick={resetSystem} disabled={isSystemFresh} className="btn-hover" style={styles.dangerTextBtn}>Reset System</button>
            </div>
          </header>

          <div style={styles.contentGrid}>
            {/* Left: Huge Display */}
            <div style={styles.servingSection}>
              <div style={styles.servingCard}>
                <span style={styles.cardLabel}>CURRENTLY SERVING</span>
                <div style={styles.bigToken}>{current || "— —"}</div>
                {current && (
                  <button onClick={completeService} className="btn-hover" style={styles.completeBtn}>
                    Mark Service as Complete
                  </button>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div style={styles.actionSection}>
                <button className="btn-hover" style={styles.btnNext} onClick={nextToken} disabled={loading}>
                  {loading ? "Syncing..." : "Call Next Token"}
                </button>
                
                <div style={styles.subActionGrid}>
                    <button className="btn-hover" style={styles.btnIssue} onClick={generateToken}>
                        <span>➕</span> Issue New
                    </button>
                    <button className="btn-hover" style={styles.btnUndo} onClick={handleUndo}>
                        <span>↩️</span> Undo Last
                    </button>
                </div>

                <div style={styles.statsContainer}>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>Daily Total</span>
                        <span style={styles.statVal}>{totalIssued}</span>
                    </div>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>In Queue</span>
                        <span style={{ ...styles.statVal, color: '#4F46E5' }}>{waitingCount}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Sidebar Logs */}
        <div style={styles.sidePanel}>
          <h2 style={styles.sideTitle}>Activity Log</h2>
          <div className="custom-scroll" style={styles.listContainer}>
            {[...allTokens].reverse().map((t, i) => {
              const style = getStatusStyle(t.status);
              return (
                <div key={i} style={{ ...styles.listItem, borderLeft: `5px solid ${style.color}` }}>
                  <div>
                    <div style={styles.listToken}>{t.id}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>TOKEN</div>
                  </div>
                  <span style={{...styles.statusTag, color: style.color, backgroundColor: style.bg}}>{style.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: "#F1F5F9", height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" },
  
  toast: { position: "fixed", top: "30px", right: "30px", padding: "18px 30px", borderRadius: "12px", color: "white", fontWeight: "600", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", zIndex: 9999, display: 'flex', alignItems: 'center' },
  
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(8px)" },
  modalContent: { backgroundColor: "white", padding: "50px", borderRadius: "24px", width: "90%", maxWidth: "450px", textAlign: 'center' },
  modalActions: { display: "flex", gap: "15px", marginTop: "30px" },
  modalCancel: { flex: 1, padding: "14px", border: "1px solid #E2E8F0", background: "none", cursor: "pointer", fontWeight: "600", borderRadius: '12px' },
  modalConfirm: { flex: 1, padding: "14px", border: "none", backgroundColor: "#EF4444", color: "white", cursor: "pointer", fontWeight: "600", borderRadius: '12px' },

  dashboard: { display: "flex", backgroundColor: "#FFFFFF", width: "95%", maxWidth: "1400px", height: "85vh", borderRadius: "32px", overflow: "hidden", boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.1)", border: '1px solid #E2E8F0' },
  
  mainPanel: { flex: 1, padding: "50px", display: "flex", flexDirection: "column", gap: "40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: 'center' },
  mainTitle: { fontSize: "2rem", fontWeight: "900", color: "#0F172A", margin: 0, letterSpacing: '-1px' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.85rem', fontWeight: 600, marginTop: '5px' },
  pulseDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 2s infinite' },
  
  refreshBtn: { padding: '8px 18px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontWeight: 600, color: '#475569' },
  dangerTextBtn: { background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline' },

  contentGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', flex: 1 },
  
  servingSection: { display: 'flex', flexDirection: 'column' },
  servingCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: '32px', border: '1px solid #F1F5F9', padding: '40px' },
  cardLabel: { fontSize: '0.9rem', color: '#94A3B8', fontWeight: '800', letterSpacing: '2px' },
  bigToken: { fontSize: '10rem', fontWeight: '900', color: '#0F172A', lineHeight: 1, margin: '20px 0' },
  completeBtn: { backgroundColor: '#4F46E5', color: 'white', padding: '16px 32px', fontSize: '1rem', fontWeight: '700', border: 'none' },

  actionSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  btnNext: { width: '100%', padding: '24px', fontSize: '1.25rem', fontWeight: '800', backgroundColor: '#0F172A', color: 'white', border: 'none' },
  subActionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width:'100%' },
  btnIssue: { flex: 1, padding: "18px", borderRadius: "16px", fontSize: "1rem", fontWeight: "700", cursor: "pointer", border: "2px solid #E2E8F0", backgroundColor: "#FFFFFF", color: "#0F172A", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  btnUndo: { flex: 1, padding: "18px", borderRadius: "16px", fontSize: "1rem", fontWeight: "700", cursor: "pointer", border: "none", backgroundColor: "#FEF2F2", color: "#EF4444", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" },

  statsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: 'auto' },
  statBox: { padding: '30px', backgroundColor: '#F8FAFC', borderRadius: '24px', textAlign: 'center', border: '1px solid #F1F5F9' },
  statLabel: { fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  statVal: { fontSize: '2.5rem', fontWeight: '900', color: '#0F172A', display: 'block' },

  sidePanel: { width: "380px", backgroundColor: "#F8FAFC", padding: "50px 30px", borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' },
  sideTitle: { fontSize: '1.1rem', fontWeight: '900', color: '#0F172A', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '1px' },
  listContainer: { flex: 1, overflowY: 'auto' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' },
  listToken: { fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' },
  statusTag: { fontSize: '0.7rem', fontWeight: '800', padding: '6px 12px', borderRadius: '8px' }
};