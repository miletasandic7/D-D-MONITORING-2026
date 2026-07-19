import{a as b,j as e}from"./index-CJESP0Xe.js";import{r}from"./react-npKdPpEf.js";const g=`
  .map-page { height: calc(100vh - 60px); display: flex; flex-direction: column; }
  .map-header { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: rgba(10,18,38,.9); border-bottom: 1px solid rgba(87,140,255,.18); }
  .map-title { font-family: 'Orbitron', sans-serif; font-size: 1.2rem; color: #dff5ff; }
  .map-controls { display: flex; gap: .5rem; }
  .map-btn { background: rgba(87,125,196,.2); border: 1px solid rgba(87,125,196,.3); color: #8ab0c9; padding: .5rem 1rem; border-radius: 8px; font-size: .85rem; cursor: pointer; transition: all .2s; }
  .map-btn:hover { border-color: #00d4ff; color: #00d4ff; }
  .map-btn.active { background: rgba(0,212,255,.2); border-color: #00d4ff; color: #00d4ff; }
  .map-container { flex: 1; background: #0a0f1a; position: relative; overflow: hidden; }
  .map-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,212,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,.05) 1px, transparent 1px); background-size: 50px 50px; }
  .map-locations { position: absolute; inset: 0; }
  .location-marker { position: absolute; transform: translate(-50%, -50%); cursor: pointer; }
  .marker-dot { width: 16px; height: 16px; border-radius: 50%; background: #00d4ff; border: 2px solid #fff; box-shadow: 0 0 20px rgba(0,212,255,.5); animation: pulse 2s infinite; }
  .marker-dot.offline { background: #ff5050; box-shadow: 0 0 20px rgba(255,80,80,.5); animation: none; }
  .marker-label { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(10,18,38,.9); padding: .25rem .5rem; border-radius: 4px; font-size: .75rem; color: #dff7ff; white-space: nowrap; border: 1px solid rgba(0,212,255,.3); }
  @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: .8; } }
  .map-sidebar { position: absolute; right: 0; top: 0; bottom: 0; width: 300px; background: rgba(10,18,38,.95); border-left: 1px solid rgba(87,140,255,.18); padding: 1rem; overflow-y: auto; }
  .sidebar-title { color: #8ee8ff; font-size: .85rem; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 1rem; }
  .camera-list { display: flex; flex-direction: column; gap: .5rem; }
  .camera-item { background: rgba(87,125,196,.1); border: 1px solid rgba(87,125,196,.2); border-radius: 10px; padding: 1rem; cursor: pointer; transition: all .2s; }
  .camera-item:hover { border-color: rgba(0,212,255,.5); }
  .camera-item h4 { color: #dff7ff; font-size: .9rem; margin-bottom: .25rem; }
  .camera-item p { color: #8ab0c9; font-size: .8rem; }
  .camera-status { display: flex; align-items: center; gap: .5rem; margin-top: .5rem; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; }
  .status-dot.online { background: #00d450; }
  .status-dot.offline { background: #ff5050; }
  .empty-map { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8ab0c9; }
  .empty-map h3 { color: #dff7ff; margin-bottom: .5rem; }
`;function j(){const[s,l]=r.useState([]),[o,d]=r.useState(!0),[t,c]=r.useState(!0),[x,i]=r.useState(null);r.useEffect(()=>{m()},[]);const m=async()=>{try{const a=await b.get("/cameras");l(a.data.cameras||[])}catch(a){console.error("Failed to fetch cameras:",a)}finally{d(!1)}};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:g}),e.jsxs("div",{className:"map-page",children:[e.jsxs("div",{className:"map-header",children:[e.jsx("h1",{className:"map-title",children:"📍 Live Camera Map"}),e.jsxs("div",{className:"map-controls",children:[e.jsx("button",{className:`map-btn ${t?"active":""}`,onClick:()=>c(!t),children:"Labels"}),e.jsx("button",{className:"map-btn",children:"Refresh"})]})]}),e.jsxs("div",{className:"map-container",children:[e.jsx("div",{className:"map-grid"}),s.length===0&&!o?e.jsxs("div",{className:"empty-map",children:[e.jsx("h3",{children:"No Camera Locations"}),e.jsx("p",{children:"Add cameras with latitude/longitude coordinates to see them on the map."}),e.jsx("p",{style:{marginTop:"1rem",fontSize:"0.85rem"},children:"Tip: Use the camera settings to add location coordinates."})]}):e.jsx("div",{className:"map-locations",children:s.map((a,n)=>{const p=a.lng?(a.lng+180)/360*100:20+n*15%60,f=a.lat?(90-a.lat)/180*100:20+n*20%60;return e.jsxs("div",{className:"location-marker",style:{left:`${p}%`,top:`${f}%`},onClick:()=>i(a),children:[e.jsx("div",{className:`marker-dot ${a.enabled===!1?"offline":""}`}),t&&e.jsx("div",{className:"marker-label",children:a.name})]},a.id)})}),e.jsxs("div",{className:"map-sidebar",children:[e.jsx("div",{className:"sidebar-title",children:"Camera Locations"}),o?e.jsx("p",{style:{color:"#8ab0c9"},children:"Loading..."}):s.length===0?e.jsx("p",{style:{color:"#8ab0c9"},children:"No cameras configured."}):e.jsx("div",{className:"camera-list",children:s.map(a=>e.jsxs("div",{className:"camera-item",onClick:()=>i(a),children:[e.jsx("h4",{children:a.name}),e.jsx("p",{children:a.location||"No location set"}),e.jsxs("div",{className:"camera-status",children:[e.jsx("span",{className:`status-dot ${a.enabled!==!1?"online":"offline"}`}),e.jsx("span",{style:{color:a.enabled!==!1?"#00d450":"#ff5050",fontSize:".8rem"},children:a.enabled!==!1?"Online":"Offline"})]})]},a.id))})]})]})]})]})}export{j as default};
