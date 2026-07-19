import{a as b,j as e}from"./index-CJESP0Xe.js";import{r as s}from"./react-npKdPpEf.js";const f=`
  .incidents-page { padding: 2rem; color: #e5eef7; }
  .incidents-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .incidents-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .incidents-filters { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .filter-select { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); color: #8ab0c9; padding: .6rem 1rem; border-radius: 8px; font-size: .85rem; min-width: 150px; }
  .incidents-table { width: 100%; border-collapse: collapse; }
  .incidents-table th { text-align: left; padding: 1rem; color: #8ee8ff; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid rgba(87,125,196,.18); }
  .incidents-table td { padding: 1rem; border-bottom: 1px solid rgba(87,125,196,.12); }
  .incidents-table tr:hover { background: rgba(0,212,255,.05); }
  .incident-id { font-family: monospace; color: #00d4ff; font-size: .85rem; }
  .incident-title { color: #dff7ff; margin-bottom: .2rem; }
  .incident-desc { color: #8ab0c9; font-size: .8rem; }
  .incident-time { color: #6a8aaa; font-size: .8rem; }
  .status-badge { display: inline-block; padding: .25rem .6rem; border-radius: 10px; font-size: .75rem; font-weight: bold; text-transform: uppercase; }
  .status-new { background: rgba(255,80,80,.2); color: #ff5050; }
  .status-active { background: rgba(255,180,50,.2); color: #ffb432; }
  .status-investigating { background: rgba(140,77,255,.2); color: #c580ff; }
  .status-resolved { background: rgba(0,212,80,.2); color: #00d450; }
  .incident-actions { display: flex; gap: .5rem; }
  .action-btn { padding: .4rem .8rem; border-radius: 6px; font-size: .75rem; cursor: pointer; border: none; transition: all .2s; }
  .action-btn-view { background: rgba(0,212,255,.2); color: #00d4ff; }
  .action-btn-edit { background: rgba(87,125,196,.2); color: #8ab0c9; }
  .action-btn:hover { filter: brightness(1.2); }
  .empty-incidents { text-align: center; padding: 4rem; background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; }
  .empty-incidents h3 { color: #dff7ff; margin-bottom: 1rem; }
  .empty-incidents p { color: #8ab0c9; }
  .severity-indicator { width: 4px; height: 40px; border-radius: 2px; }
  .sev-critical { background: #ff5050; }
  .sev-high { background: #ffb432; }
  .sev-medium { background: #00d4ff; }
  .sev-low { background: #00d450; }
`;function p(){const[r,a]=s.useState([]),[c,d]=s.useState(!0),[i,o]=s.useState("all");s.useEffect(()=>{l()},[]);const l=async()=>{try{const t=await b.get("/incidents");a(t.data.incidents||[])}catch(t){console.error("Failed to fetch incidents:",t)}finally{d(!1)}},n=i==="all"?r:r.filter(t=>t.status===i),m=t=>({new:"status-new",active:"status-active",investigating:"status-investigating",resolved:"status-resolved"})[t]||"status-new",g=t=>({critical:"sev-critical",high:"sev-high",medium:"sev-medium",low:"sev-low"})[t]||"sev-medium";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:f}),e.jsxs("div",{className:"incidents-page",children:[e.jsxs("div",{className:"incidents-header",children:[e.jsx("h1",{className:"incidents-title",children:"📋 Incident Management"}),e.jsxs("span",{style:{color:"#8ab0c9",fontSize:".9rem"},children:[n.length," incidents"]})]}),e.jsx("div",{className:"incidents-filters",children:e.jsxs("select",{className:"filter-select",value:i,onChange:t=>o(t.target.value),children:[e.jsx("option",{value:"all",children:"All Status"}),e.jsx("option",{value:"new",children:"New"}),e.jsx("option",{value:"active",children:"Active"}),e.jsx("option",{value:"investigating",children:"Investigating"}),e.jsx("option",{value:"resolved",children:"Resolved"})]})}),c?e.jsx("div",{className:"empty-incidents",children:e.jsx("p",{children:"Loading incidents..."})}):n.length===0?e.jsxs("div",{className:"empty-incidents",children:[e.jsx("h3",{children:"No Incidents Found"}),e.jsx("p",{children:"No incidents match your current filters."})]}):e.jsxs("table",{className:"incidents-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{}),e.jsx("th",{children:"ID"}),e.jsx("th",{children:"Incident"}),e.jsx("th",{children:"Status"}),e.jsx("th",{children:"Time"}),e.jsx("th",{children:"Actions"})]})}),e.jsx("tbody",{children:n.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("div",{className:`severity-indicator ${g(t.severity)}`})}),e.jsxs("td",{className:"incident-id",children:["#",t.id?.slice(0,8)||"00000000"]}),e.jsxs("td",{children:[e.jsx("div",{className:"incident-title",children:t.title||"Untitled Incident"}),e.jsx("div",{className:"incident-desc",children:t.description||"No description"})]}),e.jsx("td",{children:e.jsx("span",{className:`status-badge ${m(t.status)}`,children:t.status||"new"})}),e.jsx("td",{className:"incident-time",children:t.created_at?new Date(t.created_at).toLocaleString():"Unknown"}),e.jsx("td",{children:e.jsxs("div",{className:"incident-actions",children:[e.jsx("button",{className:"action-btn action-btn-view",children:"View"}),e.jsx("button",{className:"action-btn action-btn-edit",children:"Edit"})]})})]},t.id))})]})]})]})}export{p as default};
