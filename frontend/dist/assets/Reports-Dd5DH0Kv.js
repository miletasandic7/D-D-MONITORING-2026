import{a as b,j as e}from"./index-CJESP0Xe.js";import{r as a}from"./react-npKdPpEf.js";const u=`
  .reports-page { padding: 2rem; color: #e5eef7; }
  .reports-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .reports-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .generate-btn { background: linear-gradient(135deg,#00d4ff,#8c4dff); color: #03101c; border: none; padding: .8rem 1.5rem; border-radius: 10px; font-family: 'Orbitron', sans-serif; font-size: .8rem; text-transform: uppercase; letter-spacing: .1em; cursor: pointer; }
  .report-types { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .report-type { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; padding: 1.5rem; cursor: pointer; transition: all .2s; }
  .report-type:hover { border-color: rgba(0,212,255,.5); transform: translateY(-2px); }
  .report-type.selected { border-color: #00d4ff; background: rgba(0,212,255,.1); }
  .report-icon { font-size: 2rem; margin-bottom: 1rem; }
  .report-type h4 { color: #dff7ff; margin-bottom: .5rem; }
  .report-type p { color: #8ab0c9; font-size: .85rem; }
  .report-content { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; padding: 1.5rem; }
  .report-section { margin-bottom: 1.5rem; }
  .report-section:last-child { margin-bottom: 0; }
  .report-section h4 { color: #8ee8ff; font-size: .85rem; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 1rem; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .stat-card { background: rgba(87,125,196,.1); border-radius: 12px; padding: 1rem; text-align: center; }
  .stat-value { font-size: 1.8rem; font-weight: bold; color: #00d4ff; }
  .stat-label { color: #8ab0c9; font-size: .8rem; margin-top: .25rem; }
  .incidents-list { max-height: 300px; overflow-y: auto; }
  .incident-row { display: flex; justify-content: space-between; padding: .75rem 0; border-bottom: 1px solid rgba(87,125,196,.12); }
  .incident-row:last-child { border-bottom: none; }
  .incident-time { color: #8ab0c9; font-size: .85rem; }
  .incident-title { color: #dff7ff; }
  .incident-status { padding: .2rem .6rem; border-radius: 10px; font-size: .75rem; }
  .status-new { background: rgba(255,80,80,.2); color: #ff5050; }
  .status-active { background: rgba(255,180,50,.2); color: #ffb432; }
  .status-resolved { background: rgba(0,212,80,.2); color: #00d450; }
  .empty-state { text-align: center; padding: 2rem; color: #8ab0c9; }
`;function j(){const[i,o]=a.useState("daily"),[r,c]=a.useState([]),[d,l]=a.useState(!0);a.useEffect(()=>{m()},[]);const m=async()=>{try{const t=await b.get("/incidents");c(t.data.incidents||[])}catch(t){console.error("Failed to fetch incidents:",t)}finally{l(!1)}},p=()=>{const t={generated_at:new Date().toISOString(),report_type:i,total_incidents:r.length,incidents_by_status:{new:r.filter(s=>s.status==="new").length,active:r.filter(s=>s.status==="active").length,resolved:r.filter(s=>s.status==="resolved").length},incidents:r.slice(0,10)},f=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),h=URL.createObjectURL(f),n=document.createElement("a");n.href=h,n.download=`security-report-${i}-${Date.now()}.json`,n.click()},g=[{id:"daily",icon:"📅",title:"Daily Report",desc:"24-hour incident summary"},{id:"weekly",icon:"📊",title:"Weekly Report",desc:"7-day analytics overview"},{id:"monthly",icon:"📈",title:"Monthly Report",desc:"30-day trend analysis"},{id:"custom",icon:"⚙️",title:"Custom Report",desc:"Select date range"}];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:u}),e.jsxs("div",{className:"reports-page",children:[e.jsxs("div",{className:"reports-header",children:[e.jsx("h1",{className:"reports-title",children:"Security Reports"}),e.jsx("button",{className:"generate-btn",onClick:p,children:"Download Report"})]}),e.jsx("div",{className:"report-types",children:g.map(t=>e.jsxs("div",{className:`report-type ${i===t.id?"selected":""}`,onClick:()=>o(t.id),children:[e.jsx("div",{className:"report-icon",children:t.icon}),e.jsx("h4",{children:t.title}),e.jsx("p",{children:t.desc})]},t.id))}),e.jsxs("div",{className:"report-content",children:[e.jsxs("div",{className:"report-section",children:[e.jsx("h4",{children:"Incident Summary"}),e.jsxs("div",{className:"stat-grid",children:[e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",children:r.length}),e.jsx("div",{className:"stat-label",children:"Total Incidents"})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",children:r.filter(t=>t.status==="new").length}),e.jsx("div",{className:"stat-label",children:"New"})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",children:r.filter(t=>t.status==="active").length}),e.jsx("div",{className:"stat-label",children:"Active"})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",children:r.filter(t=>t.status==="resolved").length}),e.jsx("div",{className:"stat-label",children:"Resolved"})]})]})]}),e.jsxs("div",{className:"report-section",children:[e.jsx("h4",{children:"Recent Incidents"}),d?e.jsx("div",{className:"empty-state",children:"Loading..."}):r.length===0?e.jsx("div",{className:"empty-state",children:"No incidents recorded."}):e.jsx("div",{className:"incidents-list",children:r.slice(0,10).map(t=>e.jsxs("div",{className:"incident-row",children:[e.jsxs("div",{children:[e.jsx("div",{className:"incident-title",children:t.title||"Incident"}),e.jsx("div",{className:"incident-time",children:t.created_at?new Date(t.created_at).toLocaleString():"Unknown time"})]}),e.jsx("span",{className:`incident-status status-${t.status||"new"}`,children:t.status||"new"})]},t.id))})]})]})]})]})}export{j as default};
