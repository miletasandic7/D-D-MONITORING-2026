import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Hls from 'hls.js';
import { getSupabaseClient } from '../services/supabaseClient';

const hlsBaseUrl = (import.meta.env.VITE_HLS_BASE_URL || '/hls').replace(/\/$/, '');

const DASH_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Space+Grotesk:wght@400;500;600&display=swap');
  .ds{min-height:100vh;font-family:'Space Grotesk',sans-serif;color:#e5eef7;background:radial-gradient(circle at 16% 18%,rgba(0,212,255,.12),transparent 24%),radial-gradient(circle at 82% 14%,rgba(140,77,255,.1),transparent 22%),linear-gradient(180deg,#050b16 0%,#040914 60%,#030710 100%);display:flex;}
  .ds::before{content:'';position:fixed;inset:0;background:linear-gradient(rgba(87,125,196,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(87,125,196,.04) 1px,transparent 1px);background-size:68px 68px;opacity:.15;pointer-events:none;z-index:0;}

  /* Sidebar */
  .ds-sidebar{position:relative;z-index:2;width:220px;min-height:100vh;background:rgba(4,8,22,.92);border-right:1px solid rgba(87,125,196,.12);padding:2rem 1.25rem;display:flex;flex-direction:column;gap:2rem;flex-shrink:0;}
  .ds-brand{display:flex;align-items:center;gap:.75rem;}
  .ds-brand-mark{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(0,203,255,.45);box-shadow:0 0 16px rgba(0,173,255,.12);display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:900;color:#00d4ff;}
  .ds-brand-name{font-family:'Orbitron',sans-serif;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#dff5ff;line-height:1.3;}
  .ds-nav{display:flex;flex-direction:column;gap:.25rem;}
  .ds-nav a,.ds-nav button{display:block;padding:.55rem .85rem;border-radius:10px;font-size:.85rem;color:#8ab0c9;cursor:pointer;border:none;background:none;text-align:left;font-family:inherit;transition:background 150ms,color 150ms;width:100%;text-decoration:none;}
  .ds-nav a:hover,.ds-nav button:hover{background:rgba(87,125,196,.12);color:#dff7ff;}
  .ds-nav a.active,.ds-nav button.active{background:rgba(0,212,255,.08);color:#00d4ff;border:1px solid rgba(0,212,255,.18);}
  .ds-user{font-size:.78rem;color:#6a8aaa;padding:.5rem .85rem;}
  .ds-logout{margin-top:auto;padding-top:1rem;border-top:1px solid rgba(87,125,196,.12);}

  /* Main */
  .ds-main{position:relative;z-index:1;flex:1;padding:2rem 2rem 4rem;overflow-y:auto;min-width:0;}
  .ds-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;}
  .ds-eyebrow{font-size:.68rem;letter-spacing:.3em;text-transform:uppercase;color:#8ee8ff;margin-bottom:.2rem;}
  .ds-title{font-family:'Orbitron',sans-serif;font-size:1.5rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#dff5ff;}
  .ds-topbar-actions{display:flex;gap:.65rem;flex-wrap:wrap;}

  /* Buttons */
  .btn-primary{padding:.65rem 1.4rem;border:0;border-radius:10px;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:#03101c;background:linear-gradient(135deg,#00d4ff 0%,#8c4dff 52%,#ff55cc 100%);box-shadow:0 4px 18px rgba(0,212,255,.18);transition:transform 160ms,filter 160ms;}
  .btn-primary:hover{transform:translateY(-2px);filter:brightness(1.1);}
  .btn-ghost{padding:.6rem 1.2rem;border-radius:10px;border:1px solid rgba(87,125,196,.25);background:rgba(87,125,196,.08);color:#8ab0c9;font-size:.8rem;font-family:inherit;cursor:pointer;transition:border-color 150ms,color 150ms;}
  .btn-ghost:hover{border-color:rgba(80,208,255,.4);color:#dff7ff;}
  .btn-ghost:disabled{opacity:.4;cursor:not-allowed;}
  .btn-danger{padding:.5rem 1rem;border-radius:8px;border:1px solid rgba(255,80,80,.22);background:rgba(255,80,80,.07);color:#ff7676;font-size:.75rem;font-family:inherit;cursor:pointer;transition:background 150ms;}
  .btn-danger:hover{background:rgba(255,80,80,.14);}
  .btn-sm{padding:.38rem .85rem;font-size:.72rem;}

  /* Top Row: Map + Cameras */
  .ds-top-row{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem;}

  /* Panel base */
  .ds-panel{background:rgba(10,18,38,.85);border:1px solid rgba(87,140,255,.18);border-radius:18px;padding:1.5rem;}
  .ds-panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.1rem;}
  .ds-panel-kicker{font-size:.66rem;letter-spacing:.28em;text-transform:uppercase;color:#8ee8ff;margin-bottom:.2rem;}
  .ds-panel-title{font-family:'Orbitron',sans-serif;font-size:.88rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#dff7ff;}

  /* Live Map */
  .map-container{position:relative;height:340px;border-radius:12px;overflow:hidden;background:rgba(4,10,28,.9);border:1px solid rgba(87,125,196,.15);}
  .map-grid-h{position:absolute;top:50%;left:0;width:100%;height:1px;background:rgba(87,125,196,.15);}
  .map-grid-v{position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(87,125,196,.15);}
  .map-pin{position:absolute;width:14px;height:14px;border-radius:50%;background:#00d4ff;box-shadow:0 0 12px rgba(0,212,255,.7);transform:translate(-50%,-50%);transition:left .4s,top .4s;}
  .map-pin::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:1.5px solid rgba(0,212,255,.4);animation:pulse-ring 1.8s ease-out infinite;}
  @keyframes pulse-ring{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}
  .map-label{position:absolute;bottom:1rem;left:1rem;background:rgba(4,10,28,.88);border:1px solid rgba(87,125,196,.2);border-radius:8px;padding:.45rem .75rem;font-size:.78rem;color:#c8dff5;}
  .map-coord{font-size:.7rem;color:#8ee8ff;margin-top:.2rem;}
  .map-nodata{display:flex;align-items:center;justify-content:center;height:100%;color:#6a8aaa;font-size:.88rem;}

  /* Camera Grid */
  .cam-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;}
  .cam-card{background:rgba(4,10,28,.8);border:1px solid rgba(87,125,196,.15);border-radius:12px;overflow:hidden;}
  .cam-card-header{display:flex;align-items:center;justify-content:space-between;padding:.55rem .75rem;border-bottom:1px solid rgba(87,125,196,.1);}
  .cam-name{font-size:.78rem;font-weight:600;color:#c8dff5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cam-status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .dot-live{background:#00d450;box-shadow:0 0 6px rgba(0,212,80,.6);}
  .dot-off{background:#6a8aaa;}
  .cam-video{width:100%;height:120px;object-fit:cover;background:#000;display:block;}
  .cam-empty{display:flex;align-items:center;justify-content:center;height:120px;font-size:.75rem;color:#4a6a88;}
  .cam-nodata{grid-column:1/-1;text-align:center;padding:2.5rem;color:#6a8aaa;font-size:.88rem;}
  .cam-talkdown{display:flex;align-items:center;gap:.5rem;padding:.4rem .75rem;background:rgba(0,0,0,.2);}
  .talkdown-btn{flex:1;padding:.3rem;border:1px solid rgba(87,125,196,.2);border-radius:6px;background:transparent;color:#8ab0c9;font-size:.7rem;font-family:inherit;cursor:pointer;transition:border-color 150ms,color 150ms;}
  .talkdown-btn:hover{border-color:rgba(0,212,255,.4);color:#00d4ff;}
  .talkdown-btn.active{border-color:rgba(255,165,0,.5);color:#ffa500;animation:blink-btn .8s ease infinite;}
  @keyframes blink-btn{50%{opacity:.5}}

  /* Metric Cards */
  .ds-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-bottom:1.25rem;}
  .metric-card{background:rgba(10,18,38,.85);border:1px solid rgba(87,140,255,.18);border-radius:18px;padding:1.5rem 1.6rem;position:relative;overflow:hidden;}
  .metric-card::before{content:'';position:absolute;top:-30px;right:-20px;width:100px;height:100px;border-radius:50%;background:var(--mc-glow,rgba(0,212,255,.06));filter:blur(20px);pointer-events:none;}
  .metric-label{font-size:.68rem;letter-spacing:.22em;text-transform:uppercase;color:#8ab0c9;margin-bottom:.6rem;}
  .metric-value{font-family:'Orbitron',sans-serif;font-size:2.4rem;font-weight:900;color:#dff5ff;line-height:1;margin-bottom:.4rem;}
  .metric-value.cyan{color:#00d4ff;}
  .metric-value.green{color:#00d450;}
  .metric-value.orange{color:#ffa500;}
  .metric-value.red{color:#ff6b6b;}
  .metric-sub{font-size:.78rem;color:#6a8aaa;}
  .metric-icon{position:absolute;top:1.25rem;right:1.25rem;font-size:1.5rem;opacity:.4;}

  /* Alarms Table */
  .alarms-panel{background:rgba(10,18,38,.85);border:1px solid rgba(87,140,255,.18);border-radius:18px;padding:1.5rem;}
  .table-scroll{overflow-x:auto;}
  .alarms-table{width:100%;border-collapse:collapse;font-size:.86rem;}
  .alarms-table th{text-align:left;padding:.65rem 1rem;font-size:.66rem;text-transform:uppercase;letter-spacing:.16em;color:#8ee8ff;border-bottom:1px solid rgba(87,125,196,.2);font-weight:600;white-space:nowrap;}
  .alarms-table td{padding:.8rem 1rem;border-bottom:1px solid rgba(87,125,196,.07);color:#c8dff5;vertical-align:middle;}
  .alarms-table tbody tr:hover{background:rgba(87,125,196,.06);}
  .alarms-table .empty{text-align:center;color:#6a8aaa;padding:2.5rem;}
  .threat-badge{display:inline-block;padding:.2rem .65rem;border-radius:999px;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700;}
  .threat-LOW{background:rgba(80,180,255,.12);border:1px solid rgba(80,180,255,.3);color:#5bb4ff;}
  .threat-MEDIUM{background:rgba(255,180,0,.1);border:1px solid rgba(255,180,0,.3);color:#ffb400;}
  .threat-HIGH{background:rgba(255,100,50,.12);border:1px solid rgba(255,100,50,.3);color:#ff6432;}
  .threat-CRITICAL{background:rgba(255,50,50,.15);border:1px solid rgba(255,50,50,.4);color:#ff4444;animation:blink-critical 1s ease infinite;}
  @keyframes blink-critical{50%{opacity:.55}}
  .status-chip{display:inline-block;padding:.18rem .6rem;border-radius:6px;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;}
  .status-ACTIVE{background:rgba(255,100,50,.1);color:#ff6432;border:1px solid rgba(255,100,50,.25);}
  .status-DISMISSED{background:rgba(87,125,196,.1);color:#6a8aaa;border:1px solid rgba(87,125,196,.18);}
  .status-Resolved{background:rgba(0,212,80,.1);color:#00d450;border:1px solid rgba(0,212,80,.25);}
  .status-default{background:rgba(255,180,0,.1);color:#ffb400;border:1px solid rgba(255,180,0,.2);}
  .ts-text{font-size:.8rem;color:#c8dff5;white-space:nowrap;}
  .ts-ago{font-size:.72rem;color:#6a8aaa;margin-top:.15rem;}
  .dismiss-btn{padding:.35rem .9rem;border-radius:7px;border:1px solid rgba(0,212,255,.22);background:rgba(0,212,255,.06);color:#8ee8ff;font-size:.72rem;font-family:inherit;cursor:pointer;white-space:nowrap;transition:background 150ms,border-color 150ms;}
  .dismiss-btn:hover{background:rgba(0,212,255,.14);border-color:rgba(0,212,255,.45);}
  .dismiss-btn:disabled{opacity:.4;cursor:not-allowed;}
  .dismissed-by{font-size:.75rem;color:#8ee8ff;}

  /* Add Camera Modal */
  .modal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(2,5,14,.88);display:flex;align-items:center;justify-content:center;padding:1.5rem;}
  .modal-card{max-width:520px;width:100%;background:linear-gradient(160deg,rgba(10,16,36,.97),rgba(4,8,22,.98));border:1px solid rgba(87,140,255,.22);border-radius:20px;padding:2rem 1.75rem;}
  .modal-title{font-family:'Orbitron',sans-serif;font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#dff7ff;margin-bottom:1.25rem;}
  .modal-form{display:grid;gap:.85rem;}
  .field{display:grid;gap:.3rem;}
  .field span{font-size:.67rem;text-transform:uppercase;letter-spacing:.16em;color:#8ccfff;}
  .field input{border-radius:9px;border:1px solid rgba(109,162,255,.2);background:rgba(4,10,28,.85);color:#ecf7ff;padding:.65rem .85rem;outline:none;font-family:inherit;font-size:.9rem;transition:border-color 180ms;}
  .field input:focus{border-color:rgba(80,208,255,.6);}
  .modal-actions{display:flex;gap:.75rem;margin-top:.5rem;justify-content:flex-end;}

  /* Notif */
  .notif-stack{position:fixed;top:1.25rem;right:1.25rem;z-index:2000;display:flex;flex-direction:column;gap:.6rem;max-width:360px;}
  .notif-banner{display:flex;align-items:flex-start;gap:.75rem;background:rgba(10,18,38,.96);border:1px solid rgba(87,140,255,.25);border-radius:12px;padding:.85rem 1rem;box-shadow:0 8px 30px rgba(0,0,0,.4);}
  .notif-dot{width:8px;height:8px;border-radius:50%;background:#ff6432;margin-top:.3rem;flex-shrink:0;}
  .notif-body strong{font-size:.85rem;color:#dff7ff;display:block;}
  .notif-body p{font-size:.78rem;color:#8ab0c9;margin-top:.15rem;}
  .notif-x{background:none;border:none;color:#6a8aaa;cursor:pointer;font-size:1rem;margin-left:auto;flex-shrink:0;}

  /* Responsive */
  @media(max-width:1024px){.ds-top-row{grid-template-columns:1fr;}.ds-metrics{grid-template-columns:1fr 1fr;}}
  @media(max-width:700px){.ds-sidebar{display:none;}.ds-main{padding:1.25rem 1rem 3rem;}.ds-metrics{grid-template-columns:1fr;}.cam-grid{grid-template-columns:1fr;}}
`;

function formatTimestamp(raw) {
  if (!raw) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(raw));
  } catch { return raw; }
}

function timeAgo(raw) {
  if (!raw) return '';
  try {
    const diff = Date.now() - new Date(raw).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

function threatLevel(incident) {
  const severity = (incident.severity || '').toUpperCase();
  if (['CRITICAL', 'EMERGENCY'].includes(severity)) return 'CRITICAL';
  if (['HIGH', 'DANGER'].includes(severity)) return 'HIGH';
  if (['MEDIUM', 'WARNING'].includes(severity)) return 'MEDIUM';
  const conf = Number(incident.confidence);
  if (conf >= 0.9) return 'CRITICAL';
  if (conf >= 0.75) return 'HIGH';
  if (conf >= 0.5) return 'MEDIUM';
  return 'LOW';
}

function buildHlsUrl(camId) {
  return `${hlsBaseUrl}/${camId}/index.m3u8`;
}

function buildGeo(camera) {
  return {
    lat: Number(camera?.lat ?? 45.815),
    lng: Number(camera?.lng ?? 15.98),
    label: camera?.name || camera?.id || 'Unknown',
    note: camera?.location || 'Security perimeter',
  };
}

function playAlarmBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.45, 0.9].forEach((delay) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine';
      g.gain.setValueAtTime(0.35, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
  } catch {}
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoaded, setIncidentsLoaded] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [talkdownActive, setTalkdownActive] = useState(null);
  const [showAddCam, setShowAddCam] = useState(false);
  const [addCamForm, setAddCamForm] = useState({ name: '', rtsp_url: '', location: '', lat: '', lng: '' });
  const [addCamSaving, setAddCamSaving] = useState(false);
  const [addCamError, setAddCamError] = useState('');
  const prevNewRef = useRef(null);
  const focusedCam = cameras.find(c => c.enabled !== false) || cameras[0] || null;
  const focusedGeo = buildGeo(focusedCam);

  const isAdmin = currentUser?.role === 'admin';

  // Auth guard
  useEffect(() => {
    (async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) { localStorage.removeItem('currentUser'); navigate('/', { replace: true }); return; }
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) { localStorage.removeItem('currentUser'); await supabase.auth.signOut(); navigate('/', { replace: true }); return; }
        const stored = JSON.parse(localStorage.getItem('currentUser') || 'null');
        setCurrentUser(stored);
        setAuthChecked(true);
      } catch { localStorage.removeItem('currentUser'); navigate('/', { replace: true }); }
    })();
  }, [navigate]);

  // Fetch data
  useEffect(() => {
    if (!authChecked) return;
    api.get('/incidents').then(res => { setIncidents(res.data.incidents || []); setIncidentsLoaded(true); }).catch(err => setError(err.message));
    api.get('/cameras').then(res => setCameras(res.data.cameras || [])).catch(() => setCameras([]));
  }, [authChecked]);

  // Audio alarm
  useEffect(() => {
    if (!incidentsLoaded) return;
    const n = incidents.filter(i => i.status === 'New').length;
    if (prevNewRef.current !== null && n > prevNewRef.current) playAlarmBeep();
    prevNewRef.current = n;
  }, [incidents, incidentsLoaded]);

  // HLS init
  useEffect(() => {
    if (!authChecked) return;
    cameras.forEach(cam => {
      const video = document.getElementById(`vid-${cam.id}`);
      if (!video) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(buildHlsUrl(cam.id));
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = buildHlsUrl(cam.id);
      }
    });
  }, [cameras, authChecked]);

  const handleSignOut = async () => {
    const supabase = await getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    navigate('/', { replace: true });
  };

  const dismissAlarm = async (eventId) => {
    setUpdatingId(eventId);
    try {
      await api.patch(`/incidents/${eventId}/status`, {
        status: 'Resolved',
        dismissed_by: currentUser?.email || null,
        dismissed_by_name: currentUser?.name || currentUser?.email || 'Operator',
      });
      setIncidents(prev => prev.map(i => i.event_id === eventId
        ? { ...i, status: 'Resolved', dismissed_by: currentUser?.email, dismissed_by_name: currentUser?.name || currentUser?.email || 'Operator' }
        : i
      ));
    } catch (err) { alert('Failed to dismiss alarm: ' + err.message); }
    finally { setUpdatingId(null); }
  };

  const submitAddCamera = async (e) => {
    e.preventDefault();
    if (!addCamForm.name.trim() || !addCamForm.rtsp_url.trim()) { setAddCamError('Camera name and RTSP URL are required.'); return; }
    setAddCamSaving(true); setAddCamError('');
    const id = `CAM-${String(cameras.length + 1).padStart(2, '0')}`;
    const newCam = { id, name: addCamForm.name.trim(), rtsp_url: addCamForm.rtsp_url.trim(), location: addCamForm.location.trim() || id, lat: addCamForm.lat ? Number(addCamForm.lat) : null, lng: addCamForm.lng ? Number(addCamForm.lng) : null, enabled: true };
    try {
      await api.post('/cameras', newCam);
      setCameras(prev => [...prev, newCam]);
      setAddCamForm({ name: '', rtsp_url: '', location: '', lat: '', lng: '' });
      setShowAddCam(false);
    } catch (err) { setAddCamError(err?.response?.data?.error || err.message || 'Failed to save.'); }
    finally { setAddCamSaving(false); }
  };

  const triggerTalkdown = (camId) => {
    setTalkdownActive(camId);
    setTimeout(() => setTalkdownActive(null), 5000);
  };

  if (!authChecked) return null;

  const activeCams = cameras.filter(c => c.enabled !== false).length;
  const activeAlerts = incidents.filter(i => ['New', 'Acknowledged', 'In Progress'].includes(i.status)).length;

  const statusChip = (status) => {
    if (['Resolved', 'False Alarm'].includes(status)) return 'status-Resolved';
    if (['New', 'In Progress', 'Acknowledged'].includes(status)) return 'status-ACTIVE';
    return 'status-default';
  };

  return (
    <>
      <style>{DASH_CSS}</style>
      <div className="ds">

        {/* Notification stack */}
        {notifications.length > 0 && (
          <div className="notif-stack" role="alert">
            {notifications.map(n => (
              <div key={n.id} className="notif-banner">
                <span className="notif-dot" />
                <div className="notif-body"><strong>{n.title}</strong><p>{n.body}</p></div>
                <button className="notif-x" onClick={() => setNotifications(p => p.filter(x => x.id !== n.id))}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Add Camera Modal */}
        {showAddCam && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <p className="modal-title">Add New Camera</p>
              <form className="modal-form" onSubmit={submitAddCamera}>
                <label className="field"><span>Camera Name</span><input value={addCamForm.name} onChange={e => setAddCamForm(p => ({ ...p, name: e.target.value }))} placeholder="South Perimeter" required autoFocus /></label>
                <label className="field"><span>RTSP Stream URL</span><input value={addCamForm.rtsp_url} onChange={e => setAddCamForm(p => ({ ...p, rtsp_url: e.target.value }))} placeholder="rtsp://..." required /></label>
                <label className="field"><span>Location (optional)</span><input value={addCamForm.location} onChange={e => setAddCamForm(p => ({ ...p, location: e.target.value }))} placeholder="south_entrance" /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <label className="field"><span>Latitude</span><input type="number" step="any" value={addCamForm.lat} onChange={e => setAddCamForm(p => ({ ...p, lat: e.target.value }))} placeholder="45.815" /></label>
                  <label className="field"><span>Longitude</span><input type="number" step="any" value={addCamForm.lng} onChange={e => setAddCamForm(p => ({ ...p, lng: e.target.value }))} placeholder="15.98" /></label>
                </div>
                {addCamError && <p style={{ color: '#ff7676', fontSize: '.82rem' }}>{addCamError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={() => setShowAddCam(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={addCamSaving}>{addCamSaving ? 'Saving...' : 'Add Camera'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className="ds-sidebar">
          <div className="ds-brand">
            <div className="ds-brand-mark">D</div>
            <div className="ds-brand-name">D&amp;D Global AI Surveillance</div>
          </div>
          <nav className="ds-nav">
            <button className="active">Dashboard</button>
            {isAdmin && <button onClick={() => navigate('/operators')}>Team / Operators</button>}
          </nav>
          <div className="ds-user">{currentUser?.email || 'Operator'}<br /><span style={{ color: '#4a6a88', fontSize: '.72rem' }}>{currentUser?.role || 'operator'}</span></div>
          <div className="ds-logout">
            <button className="ds-nav a" style={{ color: '#6a8aaa', padding: '.5rem .85rem', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit' }} onClick={handleSignOut}>Sign out</button>
          </div>
        </aside>

        <main className="ds-main">
          {/* Topbar */}
          <div className="ds-topbar">
            <div>
              <p className="ds-eyebrow">Security Command Center</p>
              <h1 className="ds-title">Dashboard</h1>
            </div>
            <div className="ds-topbar-actions">
              {isAdmin && <button className="btn-ghost btn-sm" onClick={() => setShowAddCam(true)}>+ Add Camera</button>}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', color: '#ff7676', fontSize: '.88rem' }}>
              Failed to load data: {error}
            </div>
          )}

          {/* TOP ROW: Map + Camera Grid */}
          <div className="ds-top-row">

            {/* Live Map */}
            <div className="ds-panel">
              <div className="ds-panel-header">
                <div>
                  <p className="ds-panel-kicker">Live location</p>
                  <p className="ds-panel-title">Alarm Map</p>
                </div>
                <span style={{ fontSize: '.72rem', color: '#8ee8ff', background: 'rgba(0,212,255,.08)', border: '1px solid rgba(0,212,255,.18)', borderRadius: '999px', padding: '.2rem .65rem' }}>
                  {cameras.length} cameras
                </span>
              </div>
              <div className="map-container">
                {cameras.length > 0 ? (
                  <>
                    <div className="map-grid-h" />
                    <div className="map-grid-v" />
                    {cameras.filter(c => c.lat && c.lng).map(cam => (
                      <div
                        key={cam.id}
                        className="map-pin"
                        style={{
                          left: `${Math.min(Math.max(((Number(cam.lng) - 15.94) / 0.06) * 100, 8), 92)}%`,
                          top: `${Math.min(Math.max((1 - ((Number(cam.lat) - 45.80) / 0.03)) * 100, 10), 90)}%`,
                        }}
                        title={cam.name}
                      />
                    ))}
                    {cameras.filter(c => !c.lat || !c.lng).length > 0 && (
                      <div className="map-pin" style={{ left: '50%', top: '50%' }} />
                    )}
                    <div className="map-label">
                      <div>{focusedGeo.label}</div>
                      <div className="map-coord">{focusedGeo.lat.toFixed(4)}°N {focusedGeo.lng.toFixed(4)}°E</div>
                    </div>
                  </>
                ) : (
                  <div className="map-nodata">No camera locations configured</div>
                )}
              </div>
            </div>

            {/* Camera Grid */}
            <div className="ds-panel">
              <div className="ds-panel-header">
                <div>
                  <p className="ds-panel-kicker">Camera matrix</p>
                  <p className="ds-panel-title">Live Streams</p>
                </div>
                {isAdmin && (
                  <button className="btn-ghost btn-sm" onClick={() => setShowAddCam(true)}>+ Add</button>
                )}
              </div>
              <div className="cam-grid">
                {cameras.length === 0 ? (
                  <div className="cam-nodata">No active streams connected</div>
                ) : cameras.map(cam => (
                  <div key={cam.id} className="cam-card">
                    <div className="cam-card-header">
                      <span className="cam-name">{cam.name}</span>
                      <span className={`cam-status-dot ${cam.enabled !== false ? 'dot-live' : 'dot-off'}`} title={cam.enabled !== false ? 'Live' : 'Disabled'} />
                    </div>
                    <video id={`vid-${cam.id}`} className="cam-video" controls muted playsInline />
                    <div className="cam-talkdown">
                      <button
                        className={`talkdown-btn${talkdownActive === cam.id ? ' active' : ''}`}
                        onClick={() => triggerTalkdown(cam.id)}
                        disabled={talkdownActive === cam.id}
                      >
                        {talkdownActive === cam.id ? '▶ Broadcasting...' : 'Talkdown'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE ROW: Metric Cards */}
          <div className="ds-metrics">
            <div className="metric-card" style={{ '--mc-glow': 'rgba(0,212,255,.08)' }}>
              <span className="metric-icon">📷</span>
              <p className="metric-label">Active Cameras</p>
              <p className={`metric-value ${activeCams > 0 ? 'cyan' : ''}`}>{cameras.length ? activeCams : '—'}</p>
              <p className="metric-sub">{cameras.length} total streams</p>
            </div>
            <div className="metric-card" style={{ '--mc-glow': 'rgba(0,212,80,.06)' }}>
              <span className="metric-icon">🟢</span>
              <p className="metric-label">System Status</p>
              <p className="metric-value green" style={{ fontSize: '1.4rem', marginTop: '.3rem' }}>OPERATIONAL</p>
              <p className="metric-sub">Core services online</p>
            </div>
            <div className="metric-card" style={{ '--mc-glow': activeAlerts > 0 ? 'rgba(255,100,50,.1)' : 'rgba(87,125,196,.06)' }}>
              <span className="metric-icon">🚨</span>
              <p className="metric-label">Active Alerts</p>
              <p className={`metric-value ${activeAlerts > 5 ? 'red' : activeAlerts > 0 ? 'orange' : 'cyan'}`}>{incidentsLoaded ? activeAlerts : '—'}</p>
              <p className="metric-sub">{incidentsLoaded ? 'open incidents in queue' : 'loading...'}</p>
            </div>
          </div>

          {/* BOTTOM ROW: Alarms Table */}
          <div className="alarms-panel">
            <div className="ds-panel-header">
              <div>
                <p className="ds-panel-kicker">Activity feed</p>
                <p className="ds-panel-title">Alarms &amp; Incidents</p>
              </div>
              <span style={{ fontSize: '.72rem', color: '#8ab0c9', background: 'rgba(87,125,196,.1)', border: '1px solid rgba(87,125,196,.2)', borderRadius: '999px', padding: '.2rem .65rem' }}>
                Last 24h
              </span>
            </div>
            <div className="table-scroll">
              <table className="alarms-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Location</th>
                    <th>Threat Level</th>
                    <th>Status</th>
                    <th>Dismissed By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!incidentsLoaded ? (
                    <tr><td className="empty" colSpan="6">Loading incidents...</td></tr>
                  ) : incidents.length === 0 ? (
                    <tr><td className="empty" colSpan="6">No incidents recorded in the last 24 hours.</td></tr>
                  ) : incidents.slice(0, 50).map(inc => {
                    const tl = threatLevel(inc);
                    const isActive = ['New', 'Acknowledged', 'In Progress'].includes(inc.status);
                    const camName = cameras.find(c => c.id === inc.camera_id)?.name || inc.source || inc.camera_id || '—';
                    return (
                      <tr key={`${inc.event_id}-${inc.detection_id || 0}`}>
                        <td>
                          <div className="ts-text">{formatTimestamp(inc.timestamp)}</div>
                          <div className="ts-ago">{timeAgo(inc.timestamp)}</div>
                        </td>
                        <td>{camName}</td>
                        <td><span className={`threat-badge threat-${tl}`}>{tl}</span></td>
                        <td><span className={`status-chip ${statusChip(inc.status)}`}>{inc.status || 'New'}</span></td>
                        <td>
                          {inc.dismissed_by_name || inc.dismissed_by
                            ? <span className="dismissed-by">{inc.dismissed_by_name || inc.dismissed_by}</span>
                            : <span style={{ color: '#4a6a88', fontSize: '.78rem' }}>—</span>
                          }
                        </td>
                        <td>
                          {isActive ? (
                            <button
                              className="dismiss-btn"
                              onClick={() => dismissAlarm(inc.event_id)}
                              disabled={updatingId === inc.event_id}
                            >
                              {updatingId === inc.event_id ? 'Dismissing...' : 'Dismiss'}
                            </button>
                          ) : (
                            <span style={{ color: '#4a6a88', fontSize: '.78rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
