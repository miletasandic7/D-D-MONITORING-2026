import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Hls from 'hls.js';
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { getSupabaseClient } from '../services/supabaseClient';

const hlsBaseUrl = (import.meta.env.VITE_HLS_BASE_URL || '/hls').replace(/\/$/, '');

const DASH_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Space+Grotesk:wght@400;500;600&display=swap');
  .ds{min-height:100vh;font-family:'Space Grotesk',sans-serif;color:#e5eef7;background:radial-gradient(circle at 16% 18%,rgba(0,212,255,.12),transparent 24%),radial-gradient(circle at 82% 14%,rgba(140,77,255,.1),transparent 22%),linear-gradient(180deg,#050b16 0%,#040914 60%,#030710 100%);display:flex;}
  .ds::before{content:'';position:fixed;inset:0;background:linear-gradient(rgba(87,125,196,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(87,125,196,.04) 1px,transparent 1px);background-size:68px 68px;opacity:.15;pointer-events:none;z-index:0;}
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
  .ds-main{position:relative;z-index:1;flex:1;padding:2rem 2rem 4rem;overflow-y:auto;min-width:0;}
  .ds-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;}
  .ds-eyebrow{font-size:.68rem;letter-spacing:.3em;text-transform:uppercase;color:#8ee8ff;margin-bottom:.2rem;}
  .ds-title{font-family:'Orbitron',sans-serif;font-size:1.5rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#dff5ff;}
  .ds-topbar-actions{display:flex;gap:.65rem;flex-wrap:wrap;}
  .btn-primary{padding:.65rem 1.4rem;border:0;border-radius:10px;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:#03101c;background:linear-gradient(135deg,#00d4ff 0%,#8c4dff 52%,#ff55cc 100%);box-shadow:0 4px 18px rgba(0,212,255,.18);transition:transform 160ms,filter 160ms;}
  .btn-primary:hover{transform:translateY(-2px);filter:brightness(1.1);}
  .btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;}
  .btn-ghost{padding:.6rem 1.2rem;border-radius:10px;border:1px solid rgba(87,125,196,.25);background:rgba(87,125,196,.08);color:#8ab0c9;font-size:.8rem;font-family:inherit;cursor:pointer;transition:border-color 150ms,color 150ms;}
  .btn-ghost:hover{border-color:rgba(80,208,255,.4);color:#dff7ff;}
  .btn-ghost:disabled{opacity:.4;cursor:not-allowed;}
  .btn-sm{padding:.38rem .85rem;font-size:.72rem;}
  .ds-top-row{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem;}
  .ds-panel{background:rgba(10,18,38,.85);border:1px solid rgba(87,140,255,.18);border-radius:18px;padding:1.5rem;}
  .ds-panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.1rem;}
  .ds-panel-kicker{font-size:.66rem;letter-spacing:.28em;text-transform:uppercase;color:#8ee8ff;margin-bottom:.2rem;}
  .ds-panel-title{font-family:'Orbitron',sans-serif;font-size:.88rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#dff7ff;}
  .map-container{position:relative;height:340px;border-radius:12px;overflow:hidden;background:rgba(4,10,28,.9);border:1px solid rgba(87,125,196,.15);}
  .map-grid-h{position:absolute;top:50%;left:0;width:100%;height:1px;background:rgba(87,125,196,.15);}
  .map-grid-v{position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(87,125,196,.15);}
  .map-pin{position:absolute;width:14px;height:14px;border-radius:50%;background:#00d4ff;box-shadow:0 0 12px rgba(0,212,255,.7);transform:translate(-50%,-50%);transition:left .4s,top .4s;}
  .map-pin::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:1.5px solid rgba(0,212,255,.4);animation:pulse-ring 1.8s ease-out infinite;}
  @keyframes pulse-ring{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}
  .map-label{position:absolute;bottom:1rem;left:1rem;background:rgba(4,10,28,.88);border:1px solid rgba(87,125,196,.2);border-radius:8px;padding:.45rem .75rem;font-size:.78rem;color:#c8dff5;}
  .map-coord{font-size:.7rem;color:#8ee8ff;margin-top:.2rem;}
  .map-nodata{display:flex;align-items:center;justify-content:center;height:100%;color:#6a8aaa;font-size:.88rem;}
  .cam-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;}
  .cam-card{background:rgba(4,10,28,.8);border:1px solid rgba(87,125,196,.15);border-radius:12px;overflow:hidden;}
  .cam-card-header{display:flex;align-items:center;justify-content:space-between;padding:.55rem .75rem;border-bottom:1px solid rgba(87,125,196,.1);}
  .cam-name{font-size:.78rem;font-weight:600;color:#c8dff5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cam-status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .dot-live{background:#00d450;box-shadow:0 0 6px rgba(0,212,80,.6);}
  .dot-off{background:#6a8aaa;}
  .cam-video{width:100%;height:120px;object-fit:cover;background:#000;display:block;}
  .cam-nodata{grid-column:1/-1;text-align:center;padding:2.5rem;color:#6a8aaa;font-size:.88rem;}
  .cam-talkdown{display:flex;align-items:center;gap:.5rem;padding:.4rem .75rem;background:rgba(0,0,0,.2);}
  .talkdown-btn{flex:1;padding:.3rem;border:1px solid rgba(87,125,196,.2);border-radius:6px;background:transparent;color:#8ab0c9;font-size:.7rem;font-family:inherit;cursor:pointer;transition:border-color 150ms,color 150ms;}
  .talkdown-btn:hover{border-color:rgba(0,212,255,.4);color:#00d4ff;}
  .talkdown-btn.t-active{border-color:rgba(255,165,0,.5);color:#ffa500;animation:blink-btn .8s ease infinite;}
  @keyframes blink-btn{50%{opacity:.5}}
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
  .alarms-panel{background:rgba(10,18,38,.85);border:1px solid rgba(87,140,255,.18);border-radius:18px;padding:1.5rem;}
  .table-scroll{overflow-x:auto;}
  .alarms-table{width:100%;border-collapse:collapse;font-size:.86rem;}
  .alarms-table th{text-align:left;padding:.65rem 1rem;font-size:.66rem;text-transform:uppercase;letter-spacing:.16em;color:#8ee8ff;border-bottom:1px solid rgba(87,125,196,.2);font-weight:600;white-space:nowrap;}
  .alarms-table td{padding:.8rem 1rem;border-bottom:1px solid rgba(87,125,196,.07);color:#c8dff5;vertical-align:middle;}
  .alarms-table tbody tr{cursor:pointer;transition:background 120ms;}
  .alarms-table tbody tr:hover:not(.row-critical){background:rgba(87,125,196,.07);}
  .alarms-table .empty{text-align:center;color:#6a8aaa;padding:2.5rem;cursor:default;}
  .row-critical{animation:row-flash 1.4s ease infinite;}
  @keyframes row-flash{0%,100%{background:rgba(255,40,40,.05);}50%{background:rgba(255,40,40,.14);box-shadow:inset 0 0 0 1px rgba(255,40,40,.28);}}
  .threat-badge{display:inline-block;padding:.2rem .65rem;border-radius:999px;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700;}
  .threat-LOW{background:rgba(80,180,255,.12);border:1px solid rgba(80,180,255,.3);color:#5bb4ff;}
  .threat-MEDIUM{background:rgba(255,180,0,.1);border:1px solid rgba(255,180,0,.3);color:#ffb400;}
  .threat-HIGH{background:rgba(255,100,50,.12);border:1px solid rgba(255,100,50,.3);color:#ff6432;}
  .threat-CRITICAL{background:rgba(255,40,40,.18);border:1px solid rgba(255,40,40,.55);color:#ff3333;animation:badge-pulse 1s ease infinite;}
  @keyframes badge-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,40,40,.5);}50%{box-shadow:0 0 0 5px rgba(255,40,40,0);}}
  .status-chip{display:inline-block;padding:.18rem .6rem;border-radius:6px;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;}
  .s-active{background:rgba(255,100,50,.1);color:#ff6432;border:1px solid rgba(255,100,50,.25);}
  .s-resolved{background:rgba(0,212,80,.1);color:#00d450;border:1px solid rgba(0,212,80,.25);}
  .s-default{background:rgba(255,180,0,.1);color:#ffb400;border:1px solid rgba(255,180,0,.2);}
  .ts-text{font-size:.8rem;color:#c8dff5;white-space:nowrap;}
  .ts-ago{font-size:.72rem;color:#6a8aaa;margin-top:.15rem;}
  .dismiss-btn{padding:.35rem .9rem;border-radius:7px;border:1px solid rgba(0,212,255,.22);background:rgba(0,212,255,.06);color:#8ee8ff;font-size:.72rem;font-family:inherit;cursor:pointer;white-space:nowrap;transition:background 150ms,border-color 150ms;}
  .dismiss-btn:hover{background:rgba(0,212,255,.14);border-color:rgba(0,212,255,.45);}
  .dismiss-btn:disabled{opacity:.4;cursor:not-allowed;}
  .dismissed-by{font-size:.75rem;color:#8ee8ff;}
  .modal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(2,5,14,.88);display:flex;align-items:center;justify-content:center;padding:1.5rem;}
  .modal-card{max-width:520px;width:100%;background:linear-gradient(160deg,rgba(10,16,36,.97),rgba(4,8,22,.98));border:1px solid rgba(87,140,255,.22);border-radius:20px;padding:2rem 1.75rem;}
  .modal-title{font-family:'Orbitron',sans-serif;font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#dff7ff;margin-bottom:1.25rem;}
  .modal-form{display:grid;gap:.85rem;}
  .field{display:grid;gap:.3rem;}
  .field span{font-size:.67rem;text-transform:uppercase;letter-spacing:.16em;color:#8ccfff;}
  .field input,.field select,.field textarea{border-radius:9px;border:1px solid rgba(109,162,255,.2);background:rgba(4,10,28,.85);color:#ecf7ff;padding:.65rem .85rem;outline:none;font-family:inherit;font-size:.9rem;transition:border-color 180ms;width:100%;}
  .field input:focus,.field select:focus,.field textarea:focus{border-color:rgba(80,208,255,.6);}
  .field select option{background:#050b16;}
  .field textarea{resize:vertical;min-height:72px;}
  .modal-actions{display:flex;gap:.75rem;margin-top:.5rem;justify-content:flex-end;}
  .vv-modal{max-width:680px;width:100%;background:linear-gradient(160deg,rgba(8,14,32,.98),rgba(3,7,18,.99));border:1px solid rgba(87,140,255,.22);border-radius:20px;overflow:hidden;}
  .vv-header{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.5rem;border-bottom:1px solid rgba(87,125,196,.14);}
  .vv-header-left{display:flex;align-items:center;gap:.75rem;}
  .vv-rec{width:10px;height:10px;border-radius:50%;background:#ff3333;box-shadow:0 0 8px rgba(255,50,50,.7);animation:vv-blink .9s ease infinite;flex-shrink:0;}
  @keyframes vv-blink{50%{opacity:.25}}
  .vv-title{font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#dff7ff;}
  .vv-close{background:none;border:1px solid rgba(87,125,196,.22);color:#8ab0c9;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:border-color 150ms,color 150ms;flex-shrink:0;}
  .vv-close:hover{border-color:rgba(80,208,255,.4);color:#dff7ff;}
  .vv-video-area{position:relative;background:#000;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;overflow:hidden;}
  .vv-scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,.025) 2px,rgba(0,212,255,.025) 4px);pointer-events:none;z-index:1;}
  .vv-placeholder{display:flex;flex-direction:column;align-items:center;gap:1rem;color:#4a6a88;z-index:0;}
  .vv-cam-icon{font-size:3rem;opacity:.35;}
  .vv-replay-text{font-size:.88rem;color:#8ab0c9;}
  .vv-progress-bar{width:220px;height:3px;background:rgba(87,125,196,.2);border-radius:999px;overflow:hidden;margin-top:.25rem;}
  .vv-progress-fill{height:100%;background:linear-gradient(90deg,#00d4ff,#8c4dff);border-radius:999px;animation:vv-load 5s linear forwards;}
  @keyframes vv-load{0%{width:0%}100%{width:100%}}
  .vv-timer{font-family:'Orbitron',sans-serif;font-size:.7rem;color:#8ee8ff;margin-top:.25rem;}
  .vv-overlay-badge{position:absolute;top:.75rem;left:.75rem;background:rgba(220,30,30,.88);color:#fff;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.22rem .7rem;border-radius:999px;z-index:2;}
  .vv-ts-overlay{position:absolute;bottom:.6rem;right:.75rem;font-family:'Orbitron',sans-serif;font-size:.66rem;color:rgba(0,212,255,.65);z-index:2;}
  .vv-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;padding:1rem 1.5rem;border-top:1px solid rgba(87,125,196,.1);}
  .vv-meta-item span{font-size:.64rem;text-transform:uppercase;letter-spacing:.14em;color:#6a8aaa;display:block;margin-bottom:.2rem;}
  .vv-meta-item strong{font-size:.84rem;color:#c8dff5;}
  .vv-footer{display:flex;gap:.75rem;padding:.85rem 1.5rem;border-top:1px solid rgba(87,125,196,.1);justify-content:flex-end;}
  .sop-modal{max-width:490px;width:100%;background:linear-gradient(160deg,rgba(10,16,36,.98),rgba(4,8,22,.99));border:1px solid rgba(87,140,255,.22);border-radius:20px;padding:1.75rem;}
  .sop-title{font-family:'Orbitron',sans-serif;font-size:.88rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#dff7ff;margin-bottom:.35rem;}
  .sop-sub{font-size:.82rem;color:#8ab0c9;margin-bottom:1.25rem;line-height:1.55;}
  .sop-options{display:grid;gap:.5rem;margin-bottom:1rem;}
  .sop-option{display:flex;align-items:flex-start;gap:.75rem;padding:.7rem .9rem;border-radius:10px;border:1px solid rgba(87,125,196,.18);background:rgba(87,125,196,.05);cursor:pointer;transition:border-color 150ms,background 150ms;}
  .sop-option:hover{border-color:rgba(0,212,255,.3);background:rgba(0,212,255,.06);}
  .sop-option.sel{border-color:rgba(0,212,255,.55);background:rgba(0,212,255,.1);}
  .sop-option input[type=radio]{accent-color:#00d4ff;width:15px;height:15px;flex-shrink:0;margin-top:.15rem;}
  .sop-lbl{font-size:.88rem;color:#c8dff5;}
  .sop-desc{font-size:.74rem;color:#6a8aaa;margin-top:.1rem;}
  .sop-err{color:#ff7676;font-size:.8rem;margin-bottom:.75rem;}
  .notif-stack{position:fixed;top:1.25rem;right:1.25rem;z-index:2000;display:flex;flex-direction:column;gap:.6rem;max-width:360px;}
  .notif-banner{display:flex;align-items:flex-start;gap:.75rem;background:rgba(10,18,38,.96);border:1px solid rgba(87,140,255,.25);border-radius:12px;padding:.85rem 1rem;box-shadow:0 8px 30px rgba(0,0,0,.4);}
  .notif-dot{width:8px;height:8px;border-radius:50%;background:#ff6432;margin-top:.3rem;flex-shrink:0;}
  .notif-body strong{font-size:.85rem;color:#dff7ff;display:block;}
  .notif-body p{font-size:.78rem;color:#8ab0c9;margin-top:.15rem;}
  .notif-x{background:none;border:none;color:#6a8aaa;cursor:pointer;font-size:1rem;margin-left:auto;flex-shrink:0;}
  @media(max-width:1024px){.ds-top-row{grid-template-columns:1fr;}.ds-metrics{grid-template-columns:1fr 1fr;}}
  @media(max-width:700px){.ds-sidebar{display:none;}.ds-main{padding:1.25rem 1rem 3rem;}.ds-metrics{grid-template-columns:1fr;}.cam-grid{grid-template-columns:1fr;}.vv-meta{grid-template-columns:1fr 1fr;}}
`;

const SOP_REASONS = [
  { value: 'False Alarm',       label: 'False Alarm',        desc: 'No real threat — sensor or motion trigger error.' },
  { value: 'Guard Dispatched',  label: 'Guard Dispatched',   desc: 'Security personnel sent to investigate.' },
  { value: 'Checked - Safe',    label: 'Checked — Safe',     desc: 'Area inspected on-site, no incident confirmed.' },
  { value: 'Resolved Remotely', label: 'Resolved Remotely',  desc: 'Handled via remote intervention or talkdown.' },
  { value: 'Police Notified',   label: 'Police Notified',    desc: 'Law enforcement alerted, incident handed over.' },
];
const ACTIVE_INCIDENT_STATUSES = ['New', 'Acknowledged', 'In Progress'];
const CRITICAL_BEEP_DURATION_SECONDS = 0.15;
const CRITICAL_BEEP_INTERVAL_MS = 3000;
const CRITICAL_BEEP_INITIAL_GAIN = 0.0001;

function fmtTs(raw) {
  if (!raw) return '—';
  try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(raw)); }
  catch { return raw; }
}

function timeAgo(raw) {
  if (!raw) return '';
  try {
    const m = Math.floor((Date.now() - new Date(raw).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

function getThreat(inc) {
  const s = (inc.severity || '').toUpperCase();
  if (['CRITICAL','EMERGENCY'].includes(s)) return 'CRITICAL';
  if (['HIGH','DANGER'].includes(s)) return 'HIGH';
  if (['MEDIUM','WARNING'].includes(s)) return 'MEDIUM';
  const c = Number(inc.confidence);
  if (c >= 0.9) return 'CRITICAL';
  if (c >= 0.75) return 'HIGH';
  if (c >= 0.5) return 'MEDIUM';
  return 'LOW';
}

function buildHlsUrl(id) { return `${hlsBaseUrl}/${id}/index.m3u8`; }
function buildGeo(cam) {
  return { lat: Number(cam?.lat ?? 45.815), lng: Number(cam?.lng ?? 15.98), label: cam?.name || cam?.id || 'Unknown', note: cam?.location || 'Security perimeter' };
}

function isActiveIncident(inc) {
  const status = inc.status ?? 'New';
  return ACTIVE_INCIDENT_STATUSES.includes(status);
}

function playAlarmBeep(audioCtxRef) {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    let ctx = audioCtxRef.current;
    if (!ctx || ctx.state === 'closed') {
      ctx = new AudioCtor();
      audioCtxRef.current = ctx;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    o.type = 'sine';
    g.gain.setValueAtTime(CRITICAL_BEEP_INITIAL_GAIN, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + CRITICAL_BEEP_DURATION_SECONDS);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + CRITICAL_BEEP_DURATION_SECONDS);
  } catch {}
}

function stopAlarmLoop(intervalRef, audioCtxRef) {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
    audioCtxRef.current.close().catch(() => {});
  }
  audioCtxRef.current = null;
}

/* ── Feature 1: Video Verification Modal ── */
function VVModal({ inc, camName, onClose }) {
  const [secs, setSecs] = useState(5);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  const tl = getThreat(inc);
  const tlColor = { CRITICAL: '#ff3333', HIGH: '#ff6432', MEDIUM: '#ffb400', LOW: '#5bb4ff' }[tl];

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay">
          <Dialog.Content className="vv-modal">
            <VisuallyHidden>
              <Dialog.Title>Video incident verification</Dialog.Title>
            </VisuallyHidden>
            <VisuallyHidden>
              <Dialog.Description>Review replay and metadata for event #{inc.event_id} from {camName || inc.camera_id || 'unknown camera'}.</Dialog.Description>
            </VisuallyHidden>
            <div className="vv-header">
              <div className="vv-header-left">
                <span className="vv-rec" />
                <span className="vv-title">Video Verification — Event #{inc.event_id}</span>
              </div>
              <Dialog.Close asChild>
                <button className="vv-close" aria-label="Close">✕</button>
              </Dialog.Close>
            </div>

            <div className="vv-video-area">
              <div className="vv-scanlines" />
              <div className="vv-placeholder">
                <div className="vv-cam-icon">📷</div>
                <div className="vv-replay-text">{secs > 0 ? `Replaying 5-second clip… ${secs}s` : 'Replay complete'}</div>
                <div className="vv-progress-bar"><div className="vv-progress-fill" /></div>
                <div className="vv-timer">{fmtTs(inc.timestamp)}</div>
              </div>
              <div className="vv-overlay-badge">{tl}</div>
              <div className="vv-ts-overlay">{new Date().toLocaleTimeString()}</div>
            </div>

            <div className="vv-meta">
              <div className="vv-meta-item"><span>Camera</span><strong>{camName || inc.camera_id || '—'}</strong></div>
              <div className="vv-meta-item"><span>Threat Level</span><strong style={{ color: tlColor }}>{tl}</strong></div>
              <div className="vv-meta-item"><span>Status</span><strong>{inc.status || 'New'}</strong></div>
              <div className="vv-meta-item"><span>Object</span><strong>{inc.object_type || '—'}</strong></div>
              <div className="vv-meta-item"><span>Zone</span><strong>{inc.zone || inc.location || '—'}</strong></div>
              <div className="vv-meta-item"><span>Confidence</span><strong>{inc.confidence ? `${Math.round(Number(inc.confidence) * 100)}%` : '—'}</strong></div>
            </div>

            <div className="vv-footer">
              <Dialog.Close asChild>
                <button className="btn-ghost">Close</button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button className="btn-primary" style={{ fontSize: '.72rem' }}>Export Evidence</button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Feature 2: SOP Dismiss Modal ── */
function SOPModal({ inc, camName, onConfirm, onClose, saving }) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!reason) { setErr('Please select a resolution reason.'); return; }
    onConfirm({ reason, comment });
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay">
          <Dialog.Content className="sop-modal">
            <VisuallyHidden>
              <Dialog.Title>SOP dismissal form</Dialog.Title>
            </VisuallyHidden>
            <VisuallyHidden>
              <Dialog.Description>Resolve event #{inc.event_id} for {camName || inc.camera_id || 'unknown camera'} by selecting a protocol reason and optional operator comment.</Dialog.Description>
            </VisuallyHidden>
            <p className="sop-title">Resolve Alarm — SOP</p>
            <p className="sop-sub">Event #{inc.event_id} · {camName || inc.camera_id || '—'}<br />Select a resolution reason before dismissing.</p>
            <form onSubmit={submit}>
              <div className="sop-options">
                {SOP_REASONS.map(r => (
                  <label key={r.value} className={`sop-option${reason === r.value ? ' sel' : ''}`}>
                    <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => { setReason(r.value); setErr(''); }} />
                    <div><div className="sop-lbl">{r.label}</div><div className="sop-desc">{r.desc}</div></div>
                  </label>
                ))}
              </div>
              <label className="field" style={{ marginBottom: '1rem' }}>
                <span>Operator Comment (optional)</span>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add notes — witness details, response actions, etc." />
              </label>
              {err && <p className="sop-err">{err}</p>}
              <div className="modal-actions">
                <Dialog.Close asChild>
                  <button type="button" className="btn-ghost">Cancel</button>
                </Dialog.Close>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Confirm & Dismiss'}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoaded, setIncidentsLoaded] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [talkdownActive, setTalkdownActive] = useState(null);
  const [showAddCam, setShowAddCam] = useState(false);
  const [addCamForm, setAddCamForm] = useState({ name: '', rtsp_url: '', location: '', lat: '', lng: '' });
  const [addCamSaving, setAddCamSaving] = useState(false);
  const [addCamError, setAddCamError] = useState('');
  const [vvIncident, setVvIncident] = useState(null);    // Feature 1
  const [sopIncident, setSopIncident] = useState(null);  // Feature 2
  const [sopSaving, setSopSaving] = useState(false);
  const alarmAudioCtxRef = useRef(null);
  const criticalAlarmIntervalRef = useRef(null);
  const focusedGeo = buildGeo(cameras.find(c => c.enabled !== false) || cameras[0] || null);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) { localStorage.removeItem('currentUser'); navigate('/', { replace: true }); return; }
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) { localStorage.removeItem('currentUser'); await supabase.auth.signOut(); navigate('/', { replace: true }); return; }
        setCurrentUser(JSON.parse(localStorage.getItem('currentUser') || 'null'));
        setAuthChecked(true);
      } catch { localStorage.removeItem('currentUser'); navigate('/', { replace: true }); }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;
    api.get('/incidents').then(r => { setIncidents(r.data.incidents || []); setIncidentsLoaded(true); }).catch(e => setError(e.message));
    api.get('/cameras').then(r => setCameras(r.data.cameras || [])).catch(() => setCameras([]));
  }, [authChecked]);

  useEffect(() => {
    if (!incidentsLoaded) return;
    const hasActiveCritical = incidents.some(i => isActiveIncident(i) && getThreat(i) === 'CRITICAL');
    if (hasActiveCritical) {
      if (!criticalAlarmIntervalRef.current) {
        playAlarmBeep(alarmAudioCtxRef);
        criticalAlarmIntervalRef.current = setInterval(() => playAlarmBeep(alarmAudioCtxRef), CRITICAL_BEEP_INTERVAL_MS);
      }
      return;
    }
    stopAlarmLoop(criticalAlarmIntervalRef, alarmAudioCtxRef);
  }, [incidents, incidentsLoaded]);

  useEffect(() => () => stopAlarmLoop(criticalAlarmIntervalRef, alarmAudioCtxRef), []);

  useEffect(() => {
    if (!authChecked) return;
    cameras.forEach(cam => {
      const v = document.getElementById(`vid-${cam.id}`);
      if (!v) return;
      if (Hls.isSupported()) { const h = new Hls(); h.loadSource(buildHlsUrl(cam.id)); h.attachMedia(v); }
      else if (v.canPlayType('application/vnd.apple.mpegurl')) v.src = buildHlsUrl(cam.id);
    });
  }, [cameras, authChecked]);

  const handleSignOut = async () => {
    const s = await getSupabaseClient();
    if (s) await s.auth.signOut();
    localStorage.removeItem('currentUser');
    navigate('/', { replace: true });
  };

  const handleSopConfirm = async ({ reason, comment }) => {
    if (!sopIncident) return;
    setSopSaving(true);
    try {
      await api.patch(`/incidents/${sopIncident.event_id}/status`, {
        status: 'Resolved',
        dismissed_by: currentUser?.email || null,
        dismissed_by_name: currentUser?.name || currentUser?.email || 'Operator',
        resolution_reason: reason,
        resolution_comment: comment,
      });
      setIncidents(prev => prev.map(i => i.event_id === sopIncident.event_id
        ? { ...i, status: 'Resolved', dismissed_by: currentUser?.email, dismissed_by_name: currentUser?.name || currentUser?.email || 'Operator', resolution_reason: reason }
        : i));
      setSopIncident(null);
    } catch (e) { alert('Failed to dismiss: ' + e.message); }
    finally { setSopSaving(false); }
  };

  const submitAddCamera = async (e) => {
    e.preventDefault();
    if (!addCamForm.name.trim() || !addCamForm.rtsp_url.trim()) { setAddCamError('Name and RTSP URL required.'); return; }
    setAddCamSaving(true); setAddCamError('');
    const id = `CAM-${String(cameras.length + 1).padStart(2, '0')}`;
    const nc = { id, name: addCamForm.name.trim(), rtsp_url: addCamForm.rtsp_url.trim(), location: addCamForm.location.trim() || id, lat: addCamForm.lat ? Number(addCamForm.lat) : null, lng: addCamForm.lng ? Number(addCamForm.lng) : null, enabled: true };
    try { await api.post('/cameras', nc); setCameras(p => [...p, nc]); setAddCamForm({ name: '', rtsp_url: '', location: '', lat: '', lng: '' }); setShowAddCam(false); }
    catch (e) { setAddCamError(e?.response?.data?.error || e.message || 'Failed.'); }
    finally { setAddCamSaving(false); }
  };

  if (!authChecked) return null;

  const activeCams = cameras.filter(c => c.enabled !== false).length;
  const activeAlerts = incidents.filter(isActiveIncident).length;

  return (
    <>
      <style>{DASH_CSS}</style>
      <div className="ds">
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

        {/* Feature 1 */}
        {vvIncident && (
          <VVModal
            inc={vvIncident}
            camName={cameras.find(c => c.id === vvIncident.camera_id)?.name || vvIncident.source || vvIncident.camera_id}
            onClose={() => setVvIncident(null)}
          />
        )}

        {/* Feature 2 */}
        {sopIncident && (
          <SOPModal
            inc={sopIncident}
            camName={cameras.find(c => c.id === sopIncident.camera_id)?.name || sopIncident.source || sopIncident.camera_id}
            onConfirm={handleSopConfirm}
            onClose={() => setSopIncident(null)}
            saving={sopSaving}
          />
        )}

        {showAddCam && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <p className="modal-title">Add New Camera</p>
              <form className="modal-form" onSubmit={submitAddCamera}>
                <label className="field"><span>Camera Name</span><input value={addCamForm.name} onChange={e => setAddCamForm(p => ({...p, name: e.target.value}))} placeholder="South Perimeter" required autoFocus /></label>
                <label className="field"><span>RTSP Stream URL</span><input value={addCamForm.rtsp_url} onChange={e => setAddCamForm(p => ({...p, rtsp_url: e.target.value}))} placeholder="rtsp://..." required /></label>
                <label className="field"><span>Location (optional)</span><input value={addCamForm.location} onChange={e => setAddCamForm(p => ({...p, location: e.target.value}))} placeholder="south_entrance" /></label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem'}}>
                  <label className="field"><span>Latitude</span><input type="number" step="any" value={addCamForm.lat} onChange={e => setAddCamForm(p => ({...p, lat: e.target.value}))} placeholder="45.815" /></label>
                  <label className="field"><span>Longitude</span><input type="number" step="any" value={addCamForm.lng} onChange={e => setAddCamForm(p => ({...p, lng: e.target.value}))} placeholder="15.98" /></label>
                </div>
                {addCamError && <p style={{color:'#ff7676',fontSize:'.82rem'}}>{addCamError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={() => setShowAddCam(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={addCamSaving}>{addCamSaving ? 'Saving...' : 'Add Camera'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <aside className="ds-sidebar">
          <div className="ds-brand">
            <div className="ds-brand-mark">D</div>
            <div className="ds-brand-name">D&amp;D Global AI Surveillance</div>
          </div>
          <nav className="ds-nav">
            <button className="active">Dashboard</button>
            {isAdmin && <button onClick={() => navigate('/operators')}>Team / Operators</button>}
          </nav>
          <div className="ds-user">{currentUser?.email || 'Operator'}<br /><span style={{color:'#4a6a88',fontSize:'.72rem'}}>{currentUser?.role || 'operator'}</span></div>
          <div className="ds-logout">
            <button style={{color:'#6a8aaa',padding:'.5rem .85rem',borderRadius:'8px',border:'none',background:'none',cursor:'pointer',fontSize:'.82rem',fontFamily:'inherit'}} onClick={handleSignOut}>Sign out</button>
          </div>
        </aside>

        <main className="ds-main">
          <div className="ds-topbar">
            <div>
              <p className="ds-eyebrow">Security Command Center</p>
              <h1 className="ds-title">Dashboard</h1>
            </div>
            <div className="ds-topbar-actions">
              {isAdmin && <button className="btn-ghost btn-sm" onClick={() => setShowAddCam(true)}>+ Add Camera</button>}
            </div>
          </div>

          {error && <div style={{background:'rgba(255,80,80,.08)',border:'1px solid rgba(255,80,80,.25)',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'1.25rem',color:'#ff7676',fontSize:'.88rem'}}>Failed to load data: {error}</div>}

          {/* TOP ROW */}
          <div className="ds-top-row">
            <div className="ds-panel">
              <div className="ds-panel-header">
                <div><p className="ds-panel-kicker">Live location</p><p className="ds-panel-title">Alarm Map</p></div>
                <span style={{fontSize:'.72rem',color:'#8ee8ff',background:'rgba(0,212,255,.08)',border:'1px solid rgba(0,212,255,.18)',borderRadius:'999px',padding:'.2rem .65rem'}}>{cameras.length} cameras</span>
              </div>
              <div className="map-container">
                {cameras.length > 0 ? (
                  <>
                    <div className="map-grid-h" /><div className="map-grid-v" />
                    {cameras.filter(c => c.lat && c.lng).map(cam => (
                      <div key={cam.id} className="map-pin" title={cam.name}
                        style={{left:`${Math.min(Math.max(((Number(cam.lng)-15.94)/0.06)*100,8),92)}%`,top:`${Math.min(Math.max((1-((Number(cam.lat)-45.80)/0.03))*100,10),90)}%`}}
                      />
                    ))}
                    {cameras.filter(c => !c.lat || !c.lng).length > 0 && <div className="map-pin" style={{left:'50%',top:'50%'}} />}
                    <div className="map-label"><div>{focusedGeo.label}</div><div className="map-coord">{focusedGeo.lat.toFixed(4)}°N {focusedGeo.lng.toFixed(4)}°E</div></div>
                  </>
                ) : <div className="map-nodata">No camera locations configured</div>}
              </div>
            </div>

            <div className="ds-panel">
              <div className="ds-panel-header">
                <div><p className="ds-panel-kicker">Camera matrix</p><p className="ds-panel-title">Live Streams</p></div>
                {isAdmin && <button className="btn-ghost btn-sm" onClick={() => setShowAddCam(true)}>+ Add</button>}
              </div>
              <div className="cam-grid">
                {cameras.length === 0
                  ? <div className="cam-nodata">No active streams connected</div>
                  : cameras.map(cam => (
                    <div key={cam.id} className="cam-card">
                      <div className="cam-card-header">
                        <span className="cam-name">{cam.name}</span>
                        <span className={`cam-status-dot ${cam.enabled !== false ? 'dot-live' : 'dot-off'}`} />
                      </div>
                      <video id={`vid-${cam.id}`} className="cam-video" controls muted playsInline />
                      <div className="cam-talkdown">
                        <button className={`talkdown-btn${talkdownActive === cam.id ? ' t-active' : ''}`} onClick={() => { setTalkdownActive(cam.id); setTimeout(() => setTalkdownActive(null), 5000); }} disabled={talkdownActive === cam.id}>
                          {talkdownActive === cam.id ? '▶ Broadcasting...' : 'Talkdown'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* MIDDLE ROW */}
          <div className="ds-metrics">
            <div className="metric-card" style={{'--mc-glow':'rgba(0,212,255,.08)'}}>
              <span className="metric-icon">📷</span>
              <p className="metric-label">Active Cameras</p>
              <p className={`metric-value${activeCams > 0 ? ' cyan' : ''}`}>{cameras.length ? activeCams : '—'}</p>
              <p className="metric-sub">{cameras.length} total streams</p>
            </div>
            <div className="metric-card" style={{'--mc-glow':'rgba(0,212,80,.06)'}}>
              <span className="metric-icon">🟢</span>
              <p className="metric-label">System Status</p>
              <p className="metric-value green" style={{fontSize:'1.4rem',marginTop:'.3rem'}}>OPERATIONAL</p>
              <p className="metric-sub">Core services online</p>
            </div>
            <div className="metric-card" style={{'--mc-glow':activeAlerts > 0 ? 'rgba(255,100,50,.1)' : 'rgba(87,125,196,.06)'}}>
              <span className="metric-icon">🚨</span>
              <p className="metric-label">Active Alerts</p>
              <p className={`metric-value${activeAlerts > 5 ? ' red' : activeAlerts > 0 ? ' orange' : ' cyan'}`}>{incidentsLoaded ? activeAlerts : '—'}</p>
              <p className="metric-sub">{incidentsLoaded ? 'open incidents in queue' : 'loading...'}</p>
            </div>
          </div>

          {/* BOTTOM ROW — Alarms Table */}
          <div className="alarms-panel">
            <div className="ds-panel-header">
              <div><p className="ds-panel-kicker">Activity feed</p><p className="ds-panel-title">Alarms &amp; Incidents</p></div>
              <span style={{fontSize:'.72rem',color:'#8ab0c9',background:'rgba(87,125,196,.1)',border:'1px solid rgba(87,125,196,.2)',borderRadius:'999px',padding:'.2rem .65rem'}}>Click row to verify · Last 24h</span>
            </div>
            <div className="table-scroll">
              <table className="alarms-table">
                <thead>
                  <tr>
                    <th>Timestamp</th><th>Location</th><th>Threat</th><th>Status</th><th>Resolution</th><th>Dismissed By</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!incidentsLoaded ? (
                    <tr><td className="empty" colSpan="7">Loading incidents...</td></tr>
                  ) : incidents.length === 0 ? (
                    <tr><td className="empty" colSpan="7">No incidents recorded in the last 24 hours.</td></tr>
                  ) : incidents.slice(0, 50).map(inc => {
                    const tl = getThreat(inc);
                    const isActive = isActiveIncident(inc);
                    const camName = cameras.find(c => c.id === inc.camera_id)?.name || inc.source || inc.camera_id || '—';
                    // Feature 3: flash CRITICAL active rows
                    const rowCls = tl === 'CRITICAL' && isActive ? 'row-critical' : '';
                    return (
                      <tr
                        key={`${inc.event_id}-${inc.detection_id || 0}`}
                        className={rowCls}
                        onClick={() => setVvIncident(inc)}
                        title="Click to open video verification"
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <div className="ts-text">{fmtTs(inc.timestamp)}</div>
                          <div className="ts-ago">{timeAgo(inc.timestamp)}</div>
                        </td>
                        <td>{camName}</td>
                        <td><span className={`threat-badge threat-${tl}`}>{tl}</span></td>
                        <td><span className={`status-chip ${isActive ? 's-active' : 's-resolved'}`}>{inc.status || 'New'}</span></td>
                        <td>
                          {inc.resolution_reason
                            ? <span style={{fontSize:'.78rem',color:'#8ee8ff'}}>{inc.resolution_reason}</span>
                            : <span style={{color:'#4a6a88',fontSize:'.78rem'}}>—</span>}
                        </td>
                        <td>
                          {inc.dismissed_by_name || inc.dismissed_by
                            ? <span className="dismissed-by">{inc.dismissed_by_name || inc.dismissed_by}</span>
                            : <span style={{color:'#4a6a88',fontSize:'.78rem'}}>—</span>}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {isActive
                            ? <button className="dismiss-btn" onClick={() => setSopIncident(inc)}>Dismiss</button>
                            : <span style={{color:'#4a6a88',fontSize:'.78rem'}}>—</span>}
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
