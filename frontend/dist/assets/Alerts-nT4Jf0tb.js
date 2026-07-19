import{a as b,j as r}from"./index-CJESP0Xe.js";import{r as l}from"./react-npKdPpEf.js";const x=`
  .alerts-page { padding: 2rem; color: #e5eef7; }
  .alerts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .alerts-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .alert-stats { display: flex; gap: 1rem; }
  .stat-badge { padding: .5rem 1rem; border-radius: 20px; font-size: .85rem; font-weight: bold; }
  .stat-critical { background: rgba(255,80,80,.2); color: #ff5050; border: 1px solid rgba(255,80,80,.4); }
  .stat-warning { background: rgba(255,180,50,.2); color: #ffb432; border: 1px solid rgba(255,180,50,.4); }
  .stat-info { background: rgba(0,212,255,.15); color: #00d4ff; border: 1px solid rgba(0,212,255,.3); }
  .alerts-list { display: flex; flex-direction: column; gap: .75rem; }
  .alert-card { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 12px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: all .2s; }
  .alert-card:hover { border-color: rgba(0,212,255,.5); transform: translateX(4px); }
  .alert-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
  .alert-critical { background: rgba(255,80,80,.15); }
  .alert-warning { background: rgba(255,180,50,.15); }
  .alert-info { background: rgba(0,212,255,.15); }
  .alert-content { flex: 1; }
  .alert-content h4 { color: #dff7ff; margin-bottom: .2rem; font-size: .95rem; }
  .alert-content p { color: #8ab0c9; font-size: .8rem; }
  .alert-meta { display: flex; gap: 1rem; color: #6a8aaa; font-size: .75rem; margin-top: .3rem; }
  .alert-actions { display: flex; gap: .5rem; }
  .alert-btn { padding: .4rem .8rem; border-radius: 6px; font-size: .75rem; cursor: pointer; transition: all .2s; border: none; }
  .alert-btn-dismiss { background: rgba(87,125,196,.2); color: #8ab0c9; }
  .alert-btn-acknowledge { background: rgba(0,212,255,.2); color: #00d4ff; }
  .alert-btn:hover { filter: brightness(1.2); }
  .empty-alerts { text-align: center; padding: 4rem; background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; }
  .empty-alerts h3 { color: #dff7ff; margin-bottom: 1rem; }
  .empty-alerts p { color: #8ab0c9; }
`;function j(){const[a,n]=l.useState([]),[o,c]=l.useState(!0);l.useEffect(()=>{d()},[]);const d=async()=>{try{const p=((await b.get("/incidents")).data.incidents||[]).map(s=>({id:s.id,title:s.title||"Alert",message:s.description||"Security alert detected",severity:s.severity||"info",time:s.created_at,camera:s.camera_name,acknowledged:s.status!=="new"}));n(p)}catch(e){console.error("Failed to fetch alerts:",e)}finally{c(!1)}},g=e=>{n(a.map(t=>t.id===e?{...t,acknowledged:!0}:t))},m=e=>{n(a.filter(t=>t.id!==e))},f=e=>{const t={critical:"🚨",warning:"⚠️",info:"ℹ️"};return t[e]||t.info},i={critical:a.filter(e=>e.severity==="critical"&&!e.acknowledged).length,warning:a.filter(e=>e.severity==="warning"&&!e.acknowledged).length,info:a.filter(e=>e.severity==="info"&&!e.acknowledged).length};return r.jsxs(r.Fragment,{children:[r.jsx("style",{children:x}),r.jsxs("div",{className:"alerts-page",children:[r.jsxs("div",{className:"alerts-header",children:[r.jsx("h1",{className:"alerts-title",children:"🚨 Alerts & Notifications"}),r.jsxs("div",{className:"alert-stats",children:[r.jsxs("span",{className:"stat-badge stat-critical",children:[i.critical," Critical"]}),r.jsxs("span",{className:"stat-badge stat-warning",children:[i.warning," Warning"]}),r.jsxs("span",{className:"stat-badge stat-info",children:[i.info," Info"]})]})]}),o?r.jsx("div",{className:"empty-alerts",children:r.jsx("p",{children:"Loading alerts..."})}):a.length===0?r.jsxs("div",{className:"empty-alerts",children:[r.jsx("h3",{children:"No Active Alerts"}),r.jsx("p",{children:"All systems operating normally. Alerts will appear here when issues are detected."})]}):r.jsx("div",{className:"alerts-list",children:a.map(e=>r.jsxs("div",{className:"alert-card",children:[r.jsx("div",{className:`alert-icon alert-${e.severity}`,children:f(e.severity)}),r.jsxs("div",{className:"alert-content",children:[r.jsx("h4",{children:e.title}),r.jsx("p",{children:e.message}),r.jsxs("div",{className:"alert-meta",children:[r.jsxs("span",{children:["🕐 ",e.time?new Date(e.time).toLocaleString():"Unknown"]}),e.camera&&r.jsxs("span",{children:["📷 ",e.camera]}),e.acknowledged&&r.jsx("span",{style:{color:"#00d450"},children:"✓ Acknowledged"})]})]}),r.jsxs("div",{className:"alert-actions",children:[!e.acknowledged&&r.jsx("button",{className:"alert-btn alert-btn-acknowledge",onClick:()=>g(e.id),children:"Acknowledge"}),r.jsx("button",{className:"alert-btn alert-btn-dismiss",onClick:()=>m(e.id),children:"Dismiss"})]})]},e.id))})]})]})}export{j as default};
