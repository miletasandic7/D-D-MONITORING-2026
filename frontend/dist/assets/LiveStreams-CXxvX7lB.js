import{a as o,j as e}from"./index-CJESP0Xe.js";import{r}from"./react-npKdPpEf.js";const l=`
  .streams-page { padding: 2rem; color: #e5eef7; }
  .streams-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .streams-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .streams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
  .stream-card { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; overflow: hidden; }
  .stream-preview { height: 225px; background: #000; display: flex; align-items: center; justify-content: center; position: relative; }
  .stream-placeholder { color: #8ab0c9; font-size: 3rem; }
  .stream-status { position: absolute; top: .75rem; right: .75rem; padding: .25rem .6rem; border-radius: 10px; font-size: .7rem; font-weight: bold; }
  .stream-live { background: rgba(255,80,80,.8); color: white; animation: pulse-live 1.5s infinite; }
  @keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
  .stream-info { padding: 1rem; }
  .stream-info h4 { color: #dff7ff; margin-bottom: .5rem; }
  .stream-meta { display: flex; gap: 1rem; color: #8ab0c9; font-size: .8rem; }
  .stream-actions { display: flex; gap: .5rem; padding: 1rem; padding-top: 0; }
  .stream-btn { flex: 1; padding: .6rem; border: none; border-radius: 8px; font-size: .8rem; cursor: pointer; transition: all .2s; }
  .stream-btn-primary { background: linear-gradient(135deg,#00d4ff,#8c4dff); color: #03101c; font-weight: bold; }
  .stream-btn-secondary { background: rgba(87,125,196,.2); color: #8ab0c9; }
  .stream-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .empty-streams { text-align: center; padding: 4rem; background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; }
  .empty-streams h3 { color: #dff7ff; margin-bottom: 1rem; }
  .empty-streams p { color: #8ab0c9; margin-bottom: 1.5rem; }
`;function g(){const[a,t]=r.useState([]),[i,n]=r.useState(!0),[d,c]=r.useState(null);r.useEffect(()=>{m()},[]);const m=async()=>{try{const s=await o.get("/cameras");t(s.data.cameras||[])}catch(s){console.error("Failed to fetch cameras:",s)}finally{n(!1)}};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:l}),e.jsxs("div",{className:"streams-page",children:[e.jsxs("div",{className:"streams-header",children:[e.jsx("h1",{className:"streams-title",children:"📹 Live Camera Streams"}),e.jsxs("span",{style:{color:"#00d450",fontSize:".9rem"},children:[a.filter(s=>s.enabled!==!1).length," cameras online"]})]}),i?e.jsx("div",{className:"empty-streams",children:e.jsx("p",{children:"Loading cameras..."})}):a.length===0?e.jsxs("div",{className:"empty-streams",children:[e.jsx("h3",{children:"No Active Streams"}),e.jsx("p",{children:"Configure cameras in the Dashboard to start streaming."})]}):e.jsx("div",{className:"streams-grid",children:a.map(s=>e.jsxs("div",{className:"stream-card",children:[e.jsxs("div",{className:"stream-preview",children:[e.jsx("div",{className:"stream-placeholder",children:"📹"}),s.enabled!==!1&&e.jsx("span",{className:"stream-status stream-live",children:"LIVE"})]}),e.jsxs("div",{className:"stream-info",children:[e.jsx("h4",{children:s.name}),e.jsxs("div",{className:"stream-meta",children:[e.jsxs("span",{children:["📍 ",s.location||"No location"]}),e.jsxs("span",{children:[s.fps||0," FPS"]})]})]}),e.jsxs("div",{className:"stream-actions",children:[e.jsx("button",{className:"stream-btn stream-btn-secondary",children:"Snapshot"}),e.jsx("button",{className:"stream-btn stream-btn-primary",children:"View Stream"})]})]},s.id))})]})]})}export{g as default};
