import React, { useEffect, useState } from "react";

export default function TrackToken() {
  const [data, setData] = useState(null);
  const [globalData, setGlobalData] = useState({ current: "---", waiting: 0 });
  const [error, setError] = useState(false);
  
  const params = new URLSearchParams(window.location.search);
  const [token, setToken] = useState(params.get("id") || "");
  const [searchInput, setSearchInput] = useState("");

  const calculateProgress = (currentData) => {
    if (!currentData) return 0;
    if (currentData.status === "serving" || currentData.status === "completed") return 100;
    const ahead = currentData.peopleAhead || 0;
    // Progress starts at 10% and fills up as people ahead decreases
    return Math.max(10, Math.min(95, 100 - (ahead * 15))); 
  };

  // Fetch Global Counter Status
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/admin/status`);
        const result = await response.json();
        setGlobalData({
          current: result.current || "---",
          waiting: result.waiting_count || 0
        });
      } catch (err) { console.error("Global Sync Error:", err); }
    };
    fetchGlobal();
    const interval = setInterval(fetchGlobal, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Specific Token Status
  useEffect(() => {
    if (!token) {
        setData(null);
        setError(false);
        return;
    };

    const fetchData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/track/${token}`);
        if (response.status === 404) {
            setError(true);
            setData(null);
            return;
        }
        if (!response.ok) throw new Error("Server error");
        
        const result = await response.json();
        setData(result);
        setError(false);
      } catch (err) { 
        console.error("Tracking Error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    let input = searchInput.trim().toUpperCase();
    if (input) {
      // Logic to ensure ID format (e.g., 001 -> A001 if your backend expects that)
      // If your backend just expects 001, keep it as is:
      let finalToken = input.padStart(3, '0'); 
      setToken(finalToken);
      setError(false);
      setData(null);
    }
  };

  const isServing = data?.status === "serving";
  const isCompleted = data?.status === "completed";
  const progress = calculateProgress(data);

  const getTheme = () => {
    if (isCompleted) return { color: "#64748b", gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)", label: "Service Finished", icon: "✅" };
    if (isServing) return { color: "#10b981", gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)", label: "It's Your Turn!", icon: "🔔" };
    return { color: "#6366f1", gradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)", label: "Waiting in Line", icon: "⏳" };
  };

  return (
    <div style={styles.pageWrapper}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulseRing { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
          .animate-slide { animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
          .serving-pulse { animation: pulseRing 2s infinite; }
          .live-dot { height: 8px; width: 8px; background-color: #10b981; border-radius: 50%; display: inline-block; margin-right: 6px; }
        `}
      </style>

      <div style={styles.container}>
        
        {/* TOP STATUS BAR */}
        <div style={styles.globalCard}>
          <div style={styles.globalHeader}>
            <span style={styles.liveIndicator}><span className="live-dot"></span> LIVE QUEUE</span>
            <span style={styles.counterLabel}>STATION 01</span>
          </div>
          <div style={styles.globalGrid}>
            <div style={styles.globalBox}>
              <p style={styles.labelDark}>NOW SERVING</p>
              <h2 style={styles.globalValuePrimary}>{globalData.current}</h2>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.globalBox}>
              <p style={styles.labelDark}>WAITING</p>
              <h2 style={styles.globalValue}>{globalData.waiting}</h2>
            </div>
          </div>
        </div>

        {/* SEARCH SECTION */}
        <div style={styles.searchSection}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input 
              style={styles.searchInput}
              placeholder="Enter Token Number (e.g. 001)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" style={styles.searchBtn}>Track</button>
          </form>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="animate-slide" style={styles.errorCard}>
             <div style={{fontSize: '2rem', marginBottom: '10px'}}>🔎</div>
             <h3 style={{color: '#ef4444', margin: '0 0 8px 0'}}>Token Not Found</h3>
             <p style={{color: '#64748b', fontSize: '0.9rem', marginBottom: '20px'}}>The number <b>{token}</b> doesn't seem to exist in our active queue.</p>
             <button onClick={() => {setToken(""); setSearchInput(""); setError(false);}} style={styles.retryBtn}>Clear & Try Again</button>
          </div>
        )}

        {/* IDLE / INITIAL STATE */}
        {!token && !error && (
          <div className="animate-slide" style={styles.idleCard}>
             <div style={{fontSize: '3rem', marginBottom: '15px'}}>👋</div>
             <h3 style={{color: '#1e293b', margin: '0 0 10px 0', fontSize: '1.4rem'}}>Ready to Track?</h3>
             <p style={{color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6'}}>
                Enter your token number above to get real-time updates on your position and estimated wait time.
             </p>
          </div>
        )}

        {/* TRACKING DATA STATE */}
        {data && !error && (
          <div className="animate-slide">
            <div style={{ ...styles.highlight, background: getTheme().gradient }} className={isServing ? 'serving-pulse' : ''}>
              <div style={styles.glassEffect}>
                <p style={styles.labelLight}>YOUR POSITION</p>
                <h1 style={styles.mainToken}>{data.token}</h1>
                <div style={{...styles.badge, color: getTheme().color}}>
                    {getTheme().icon} {getTheme().label}
                </div>
              </div>
            </div>

            <div style={styles.progressSection}>
              <div style={styles.progressLabelRow}>
                <span>Queue Progress</span>
                <span style={{color: getTheme().color}}>{isServing || isCompleted ? "Arrived" : `${progress}%`}</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ 
                  ...styles.progressBarFill, 
                  width: `${progress}%`, 
                  backgroundColor: getTheme().color,
                  boxShadow: isServing ? `0 0 15px ${getTheme().color}` : 'none'
                }}></div>
              </div>
            </div>

            <div style={styles.statsCard}>
              <div style={styles.row}>
                <div style={styles.box}>
                  <p style={styles.boxLabel}>Waiters Ahead</p>
                  <h2 style={styles.boxValue}>{ (isServing || isCompleted) ? "0" : data.peopleAhead}</h2>
                </div>
                <div style={styles.box}>
                  <p style={styles.boxLabel}>Est. Wait Time</p>
                  <h2 style={styles.boxValue}>
                    { (isServing || isCompleted) ? "0" : data.waitTime} <small style={styles.unit}>min</small>
                  </h2>
                </div>
              </div>
              
              <div style={{ 
                ...styles.footerNote, 
                backgroundColor: isCompleted ? "#f8fafc" : (isServing ? "#ecfdf5" : "#eef2ff"),
                color: isCompleted ? "#475569" : (isServing ? "#065f46" : "#4f46e5"),
              }}>
                {isCompleted 
                  ? "Your session has ended. Thank you!" 
                  : isServing 
                    ? "It is your turn! Please proceed to the counter now." 
                    : "You're in the queue. We'll refresh this page automatically."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: "#f0f4f8", minHeight: "100vh", display: "flex", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "24px" },
  container: { width: "100%", maxWidth: "420px" },
  
  // Header Status Card
  globalCard: { backgroundColor: '#fff', borderRadius: '32px', padding: '24px', marginBottom: '20px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', border: '1px solid #fff' },
  globalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' },
  liveIndicator: { fontSize: '0.7rem', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', letterSpacing: '0.05em' },
  counterLabel: { fontSize: '0.65rem', fontWeight: '800', color: '#6366f1', background: '#eef2ff', padding: '5px 12px', borderRadius: '10px' },
  globalGrid: { display: 'flex', alignItems: 'center' },
  globalBox: { flex: 1, textAlign: 'center' },
  globalValuePrimary: { fontSize: '2.4rem', margin: 0, color: '#1e293b', fontWeight: '800', letterSpacing: '-1.5px' },
  globalValue: { fontSize: '2.4rem', margin: 0, color: '#94a3b8', fontWeight: '800', letterSpacing: '-1.5px' },
  divider: { width: '1px', height: '35px', backgroundColor: '#f1f5f9', margin: '0 15px' },

  // Search
  searchSection: { marginBottom: '20px' },
  searchForm: { display: 'flex', gap: '10px' },
  searchInput: { flex: 1, padding: '18px', borderRadius: '20px', border: '1px solid #e2e8f0', backgroundColor: '#fff', outline: 'none', fontSize: '1rem', fontWeight: '600', color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  searchBtn: { padding: '0 24px', borderRadius: '20px', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },

  // Error & Idle States
  errorCard: { backgroundColor: '#fff', borderRadius: '32px', padding: '40px 24px', textAlign: 'center', border: '1px solid #fee2e2', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' },
  idleCard: { backgroundColor: '#fff', borderRadius: '32px', padding: '50px 30px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' },
  retryBtn: { padding: '12px 24px', borderRadius: '15px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700', cursor: 'pointer' },

  // Main Highlight Card
  highlight: { padding: "10px", borderRadius: "40px", textAlign: "center", marginBottom: "24px", boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.3)" },
  glassEffect: { padding: "35px 20px", background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(10px)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.2)" },
  mainToken: { fontSize: "5.5rem", margin: "0", fontWeight: "800", color: "white", letterSpacing: "-4px", lineHeight: 1 },
  labelLight: { fontSize: "0.7rem", fontWeight: "800", color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em", marginBottom: '8px' },
  badge: { display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#fff", padding: "8px 18px", borderRadius: "50px", fontSize: "0.85rem", fontWeight: "800", marginTop: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },

  // Progress
  progressSection: { marginBottom: "24px", padding: "0 8px" },
  progressLabelRow: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "800", color: "#94a3b8", marginBottom: "12px", textTransform: 'uppercase' },
  progressBarBg: { width: "100%", height: "10px", backgroundColor: "#e2e8f0", borderRadius: "10px", overflow: "hidden" },
  progressBarFill: { height: "100%", transition: "width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)" },

  // Stats Card
  statsCard: { backgroundColor: "#ffffff", borderRadius: '32px', padding: "24px", boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)' },
  row: { display: "flex", gap: "12px" },
  box: { flex: 1, background: "#f8fafc", padding: "24px 12px", borderRadius: "24px", textAlign: "center" },
  boxLabel: { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "800", marginBottom: "8px", textTransform: 'uppercase' },
  boxValue: { fontSize: "1.8rem", color: "#1e293b", margin: 0, fontWeight: "800", letterSpacing: '-1px' },
  unit: { fontSize: "0.8rem", color: "#94a3b8" },
  
  footerNote: { textAlign: "center", fontSize: "0.9rem", marginTop: "24px", padding: "18px", borderRadius: "20px", lineHeight: "1.5", fontWeight: "700" },
  labelDark: { fontSize: "0.65rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px", letterSpacing: "0.05em" }
};