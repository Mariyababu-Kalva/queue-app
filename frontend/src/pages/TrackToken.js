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
    return Math.max(15, Math.min(98, 100 - (ahead * 12))); 
  };

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

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/track/${token}`);
        if (response.status === 404) {
            setError(true);
            setData(null);
            return;
        }
        const result = await response.json();
        setData(result);
        setError(false);
      } catch (err) { console.error("Tracking Error:", err); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    let input = searchInput.trim().toUpperCase();
    if (input) {
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
    if (isCompleted) return { color: "#64748b", gradient: "linear-gradient(135deg, #94a3b8 0%, #475569 100%)", label: "Finished", icon: "✨" };
    if (isServing) return { color: "#10b981", gradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)", label: "Your Turn!", icon: "🔔" };
    return { color: "#6366f1", gradient: "linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)", label: "In Queue", icon: "⏱️" };
  };

  return (
    <div style={styles.pageWrapper}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
          .animate-up { animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .pulse-text { animation: pulse 2s infinite; }
        `}
      </style>

      {/* BACKGROUND DECORATION */}
      <div style={styles.bgBlob}></div>

      <div style={styles.contentWrapper}>
        {/* WIDE TOP NAV */}
        <header style={styles.topNav}>
          <div style={styles.brand}>
            <div style={styles.logo}>Q</div>
            <span style={styles.brandText}>SmartTracker</span>
          </div>
          <div style={styles.liveStatus}>
             <div style={styles.dot}></div>
             <span>System Online</span>
          </div>
        </header>

        <main style={styles.mainContent}>
          {/* GLOBAL MONITOR SECTION */}
          <section style={styles.monitorSection}>
             <div style={styles.monitorCard}>
                <div style={styles.monItem}>
                   <p style={styles.monLabel}>NOW AT COUNTER</p>
                   <h2 style={styles.monValue}>{globalData.current}</h2>
                </div>
                <div style={styles.vLine}></div>
                <div style={styles.monItem}>
                   <p style={styles.monLabel}>TOTAL WAITING</p>
                   <h2 style={{...styles.monValue, color: '#6366f1'}}>{globalData.waiting}</h2>
                </div>
             </div>

             <form onSubmit={handleSearch} style={styles.searchBar}>
                <input 
                  style={styles.input}
                  placeholder="Enter token ID to track..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" style={styles.searchBtn}>Track Status</button>
             </form>
          </section>

          {/* DYNAMIC CONTENT AREA */}
          <section className="animate-up" style={styles.dynamicArea}>
            {!token && !error ? (
              <div style={styles.idleState}>
                 <div style={styles.idleIcon}>🛋️</div>
                 <h3>Welcome</h3>
                 <p>Enter your token number to see live progress.</p>
              </div>
            ) : error ? (
              <div style={styles.errorState}>
                 <div style={styles.errorIcon}>⚠️</div>
                 <h3>Token Not Found</h3>
                 <button onClick={() => {setToken(""); setError(false);}} style={styles.clearBtn}>Try Different Number</button>
              </div>
            ) : data && (
              <div style={styles.trackerGrid}>
                {/* BIG TOKEN PLATE */}
                <div style={{...styles.plate, background: getTheme().gradient}}>
                   <span style={styles.plateSub}>YOUR TOKEN</span>
                   <h1 style={styles.plateMain}>{data.token}</h1>
                   <div style={styles.statusPill}>
                      {getTheme().icon} {getTheme().label}
                   </div>
                </div>

                {/* PROGRESS & STATS */}
                <div style={styles.detailsSide}>
                   <div style={styles.progressGroup}>
                      <div style={styles.progHeader}>
                        <span>Queue Progress</span>
                        <span style={{color: getTheme().color}} className="pulse-text">
                           {isServing ? "Proceed Now" : `${progress}%`}
                        </span>
                      </div>
                      <div style={styles.track}>
                        <div style={{...styles.fill, width: `${progress}%`, backgroundColor: getTheme().color}}></div>
                      </div>
                   </div>

                   <div style={styles.statsGrid}>
                      <div style={styles.statTile}>
                         <span style={styles.tileLabel}>People Ahead</span>
                         <span style={styles.tileVal}>{isServing ? "0" : data.peopleAhead}</span>
                      </div>
                      <div style={styles.statTile}>
                         <span style={styles.tileLabel}>Est. Wait Time</span>
                         <span style={styles.tileVal}>{isServing ? "0" : data.waitTime} <small style={{fontSize: '0.8rem'}}>min</small></span>
                      </div>
                   </div>

                   <div style={{...styles.alertBox, borderLeft: `4px solid ${getTheme().color}`}}>
                      {isServing 
                        ? "🚨 Your token has been called! Please go to Counter 01." 
                        : "Please keep this page open for live updates."}
                   </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: "#F8FAFC", minHeight: "100vh", position: 'relative', overflowX: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  bgBlob: { position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 },
  
  contentWrapper: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  
  topNav: { width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 40px', boxSizing: 'border-box' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { width: '35px', height: '35px', background: '#0F172A', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  brandText: { fontSize: '1.2rem', fontWeight: '800', color: '#0F172A' },
  liveStatus: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748B', fontWeight: '600' },
  dot: { width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' },

  mainContent: { width: '90%', maxWidth: '1100px', paddingBottom: '100px' },
  
  monitorSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', marginBottom: '50px' },
  monitorCard: { display: 'flex', backgroundColor: 'white', padding: '30px 60px', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' },
  monItem: { textAlign: 'center' },
  monLabel: { fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', marginBottom: '10px', letterSpacing: '1px' },
  monValue: { fontSize: '3rem', fontWeight: '900', color: '#0F172A', margin: 0 },
  vLine: { width: '1px', background: '#F1F5F9', margin: '0 50px' },

  searchBar: { display: 'flex', width: '100%', maxWidth: '600px', gap: '12px' },
  input: { flex: 1, padding: '20px 25px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
  searchBtn: { padding: '0 30px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' },

  dynamicArea: { width: '100%' },
  idleState: { textAlign: 'center', padding: '60px', color: '#64748B' },
  idleIcon: { fontSize: '4rem', marginBottom: '20px' },
  errorState: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '32px' },
  errorIcon: { fontSize: '3rem', marginBottom: '20px' },
  clearBtn: { padding: '12px 25px', borderRadius: '12px', border: 'none', background: '#F1F5F9', color: '#475569', fontWeight: '700', cursor: 'pointer' },

  trackerGrid: { display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1.5fr', gap: '40px', alignItems: 'center', background: 'white', padding: '40px', borderRadius: '40px', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.08)' },
  
  plate: { padding: '60px 40px', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' },
  plateSub: { fontSize: '0.8rem', fontWeight: '800', opacity: 0.8, letterSpacing: '2px' },
  plateMain: { fontSize: '7rem', fontWeight: '900', margin: '15px 0', letterSpacing: '-5px' },
  statusPill: { background: 'white', color: '#0F172A', padding: '10px 20px', borderRadius: '50px', fontWeight: '800', fontSize: '0.9rem' },

  detailsSide: { display: 'flex', flexDirection: 'column', gap: '30px' },
  progressGroup: { width: '100%' },
  progHeader: { display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.9rem', marginBottom: '15px' },
  track: { height: '14px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' },
  fill: { height: '100%', transition: 'width 1s ease' },

  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  statTile: { background: '#F8FAFC', padding: '25px', borderRadius: '24px', border: '1px solid #F1F5F9' },
  tileLabel: { display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' },
  tileVal: { fontSize: '2.2rem', fontWeight: '900', color: '#0F172A' },
  
  alertBox: { padding: '20px', background: '#F8FAFC', borderRadius: '16px', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }
};