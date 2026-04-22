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

  const refreshStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/status");
      const data = await res.json();
      setAllTokens(data.all_tokens || []);
      setCurrent(data.current);
      setTotalIssued(data.total);
      setWaitingCount(data.waiting_count);
    } catch (err) {
      console.error("Sync error:", err);
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
        showToast(`Now calling ${data.current}`, "success");
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
          
          /* Top-Right Notification Animation */
          @keyframes slideInRight { 
            from { transform: translateX(120%); opacity: 0; } 
            to { transform: translateX(0); opacity: 1; } 
          }
          
          .toast-animation { 
            animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; 
          }

          @keyframes pulse { 
            0% { transform: scale(1); opacity: 1; } 
            50% { transform: scale(1.5); opacity: 0.5; } 
            100% { transform: scale(1); opacity: 1; } 
          }

          .btn-hover { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
          .btn-hover:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); }
          .btn-hover:active:not(:disabled) { transform: translateY(0); }
          
          .custom-scroll::-webkit-scrollbar { width: 5px; }
          .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `}
      </style>

      {/* TOAST - ANCHORED TOP RIGHT */}
      {toast.show && (
        <div className="toast-animation" style={{
            ...styles.toast, 
            backgroundColor: toast.type === 'error' ? '#EF4444' : (toast.type === 'success' ? '#10B981' : '#0F172A')
        }}>
          <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>
              {toast.type === 'success' ? '✓' : (toast.type === 'error' ? '✕' : 'ℹ')}
          </span>
          {toast.message}
        </div>
      )}

      {modal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ marginTop: 0, color: '#0F172A', fontSize: '1.25rem' }}>{modal.title}</h3>
            <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: '1.6' }}>{modal.message}</p>
            <div style={styles.modalActions}>
              <button onClick={closeConfirm} style={styles.modalCancel}>Cancel</button>
              <button onClick={() => { modal.onConfirm(); closeConfirm(); }} style={styles.modalConfirm}>Proceed</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.dashboard}>
        <div style={styles.mainPanel}>
          <header style={styles.header}>
            <div>
              <h2 style={styles.title}>Desk Console</h2>
              <div style={styles.statusRowHeader}>
                <div style={styles.pulseDot}></div>
                <span style={styles.statusText}>Counter 01 • Active</span>
              </div>
            </div>
            <button 
              onClick={refreshStatus} 
              className="btn-hover" 
              style={styles.refreshBtn}
            >
              ↻ Sync Status
            </button>
          </header>

          <div style={styles.servingCard}>
            <p style={styles.cardLabel}>NOW SERVING</p>
            <div style={styles.bigToken}>{current || "— —"}</div>
            {current && (
              <button onClick={completeService} className="btn-hover" style={styles.completeBtn}>
                Mark as Completed
              </button>
            )}
          </div>

          <div style={styles.actionGrid}>
            <button className="btn-hover" style={styles.btnNext} onClick={nextToken} disabled={loading}>
              {loading ? "Processing..." : "Call Next Customer"}
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-hover" style={styles.btnIssue} onClick={generateToken}>
                Issue New Ticket
              </button>
              <button className="btn-hover" style={styles.btnUndo} onClick={handleUndo}>
                Undo Last
              </button>
            </div>
            <button 
              onClick={resetSystem} 
              className="btn-hover" 
              disabled={isSystemFresh}
              style={{ ...styles.resetBtnAction, opacity: isSystemFresh ? 0.3 : 1 }}
            >
              Reset All System Data
            </button>
          </div>

          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Issued</span>
              <span style={styles.statVal}>{totalIssued}</span>
            </div>
            <div style={{ ...styles.statItem, borderLeft: '1px solid #F1F5F9' }}>
              <span style={styles.statLabel}>Waiting</span>
              <span style={{ ...styles.statVal, color: '#4F46E5' }}>{waitingCount}</span>
            </div>
          </div>
        </div>

        <div style={styles.sidePanel}>
          <h3 style={styles.sideTitle}>Live History</h3>
          <div className="custom-scroll" style={styles.listContainer}>
            {[...allTokens].reverse().map((t, i) => {
              const style = getStatusStyle(t.status);
              return (
                <div key={i} style={{ ...styles.listItem, borderLeft: `4px solid ${style.color}` }}>
                  <div>
                    <div style={styles.listToken}>{t.id}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>TICKET ID</div>
                  </div>
                  <span style={{...styles.statusTag, color: style.color, backgroundColor: style.bg}}>{style.label}</span>
                </div>
              );
            })}
            {allTokens.length === 0 && (
                <div style={styles.emptyHistory}>History is clear</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: "#F8FAFC", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: "20px" },
  
  // FIX: TOP RIGHT NOTIFICATION
  toast: { position: "fixed", top: "24px", right: "24px", padding: "16px 28px", borderRadius: "16px", color: "white", fontWeight: "700", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", zIndex: 5000, fontSize: '0.95rem', display: 'flex', alignItems: 'center', minWidth: '300px', border: '1px solid rgba(255,255,255,0.1)' },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4000, backdropFilter: "blur(4px)" },
  modalContent: { backgroundColor: "white", padding: "40px", borderRadius: "32px", width: "100%", maxWidth: "400px", textAlign: 'center', boxShadow: "0 30px 60px -12px rgba(0,0,0,0.25)" },
  modalActions: { display: "flex", gap: "12px", marginTop: "30px" },
  modalCancel: { flex: 1, padding: "14px", borderRadius: "16px", border: "1px solid #E2E8F0", backgroundColor: "#fff", cursor: "pointer", fontWeight: "700", color: "#64748B" },
  modalConfirm: { flex: 1, padding: "14px", borderRadius: "16px", border: "none", backgroundColor: "#EF4444", color: "white", cursor: "pointer", fontWeight: "700" },

  dashboard: { display: "flex", backgroundColor: "#ffffff", width: "100%", maxWidth: "940px", height: "680px", borderRadius: "32px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.04)", border: '1px solid #E2E8F0' },
  mainPanel: { flex: 1, padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  sidePanel: { width: "300px", backgroundColor: "#F8FAFC", padding: "40px 24px", display: "flex", flexDirection: "column", borderLeft: '1px solid #E2E8F0' },

  header: { display: "flex", justifyContent: "space-between", alignItems: 'flex-start', marginBottom: "10px" },
  title: { fontSize: "1.4rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: '-0.5px' },
  statusRowHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  pulseDot: { width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 2s infinite' },
  statusText: { fontSize: "0.75rem", color: "#64748B", fontWeight: "600" },
  refreshBtn: { background: "#F1F5F9", border: "none", color: "#475569", padding: "8px 14px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" },

  servingCard: { textAlign: "center", padding: "40px 20px", backgroundColor: "#F8FAFC", borderRadius: "24px", border: '1px solid #F1F5F9' },
  cardLabel: { fontSize: "0.7rem", color: "#94A3B8", fontWeight: "800", letterSpacing: "1.5px" },
  bigToken: { fontSize: "6rem", fontWeight: "900", color: "#0F172A", margin: "5px 0", lineHeight: 1, letterSpacing: '-3px' },
  completeBtn: { backgroundColor: "#FFF", color: "#4F46E5", padding: "8px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: '0.85rem', border: '1px solid #E2E8F0' },

  actionGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  btnNext: { padding: "18px", borderRadius: "16px", fontSize: "1.05rem", fontWeight: "700", cursor: "pointer", border: "none", backgroundColor: "#4F46E5", color: "white" },
  btnIssue: { flex: 3, padding: "14px", borderRadius: "16px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", border: "1px solid #E2E8F0", backgroundColor: "#fff", color: "#0F172A" },
  btnUndo: { flex: 1, padding: "14px", borderRadius: "16px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", border: "none", backgroundColor: "#FEF2F2", color: "#EF4444" },
  resetBtnAction: { background: "none", border: "none", color: "#94A3B8", fontSize: "0.75rem", fontWeight: "600", marginTop: "4px", textDecoration: "underline" },

  statsContainer: { display: "flex", backgroundColor: "#F8FAFC", borderRadius: "18px", border: '1px solid #F1F5F9' },
  statItem: { flex: 1, padding: "16px", textAlign: "center" },
  statLabel: { display: "block", fontSize: "0.65rem", color: "#94A3B8", fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' },
  statVal: { fontSize: "1.5rem", fontWeight: "800", color: "#0F172A" },

  sideTitle: { fontSize: "0.9rem", fontWeight: "800", color: "#0F172A", marginBottom: "20px", textTransform: 'uppercase', letterSpacing: '1px' },
  listContainer: { flex: 1, overflowY: "auto", paddingRight: '4px' },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", borderRadius: "14px", marginBottom: "10px", backgroundColor: '#fff', border: '1px solid #F1F5F9' },
  listToken: { fontWeight: "800", color: '#0F172A', fontSize: '1.1rem' },
  statusTag: { fontSize: "0.65rem", fontWeight: "800", padding: '4px 8px', borderRadius: '6px' },
  emptyHistory: { textAlign: 'center', marginTop: '60px', color: '#CBD5E1', fontSize: '0.85rem', fontWeight: 600 }
};