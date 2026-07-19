import{a as l,j as e}from"./index-CJESP0Xe.js";import{r}from"./react-npKdPpEf.js";const c=`
  .users-page { padding: 2rem; color: #e5eef7; }
  .users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .users-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .users-grid { display: grid; gap: 1rem; }
  .user-card { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .user-info { display: flex; align-items: center; gap: 1rem; }
  .user-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg,#00d4ff,#8c4dff); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
  .user-details h3 { color: #dff7ff; margin-bottom: .25rem; }
  .user-details p { color: #8ab0c9; font-size: .85rem; }
  .user-badge { padding: .3rem .8rem; border-radius: 20px; font-size: .75rem; text-transform: uppercase; letter-spacing: .05em; }
  .badge-admin { background: rgba(140,77,255,.2); color: #c580ff; border: 1px solid rgba(140,77,255,.4); }
  .badge-operator { background: rgba(0,212,255,.15); color: #00d4ff; border: 1px solid rgba(0,212,255,.3); }
  .badge-active { background: rgba(0,212,80,.15); color: #00d450; border: 1px solid rgba(0,212,80,.3); }
  .empty-state { text-align: center; padding: 3rem; color: #8ab0c9; }
`;function g(){const[a,t]=r.useState([]),[i,d]=r.useState(!0);r.useEffect(()=>{n()},[]);const n=async()=>{try{const s=await l.get("/users");t(s.data.users||[])}catch(s){console.error("Failed to fetch users:",s)}finally{d(!1)}};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:c}),e.jsxs("div",{className:"users-page",children:[e.jsx("div",{className:"users-header",children:e.jsx("h1",{className:"users-title",children:"User Management"})}),i?e.jsx("div",{className:"empty-state",children:"Loading..."}):a.length===0?e.jsxs("div",{className:"empty-state",children:[e.jsx("p",{children:"No users found."}),e.jsx("p",{children:"Users will appear here after they log in for the first time."})]}):e.jsx("div",{className:"users-grid",children:a.map(s=>e.jsxs("div",{className:"user-card",children:[e.jsxs("div",{className:"user-info",children:[e.jsx("div",{className:"user-avatar",children:s.email?.charAt(0).toUpperCase()||"?"}),e.jsxs("div",{className:"user-details",children:[e.jsx("h3",{children:s.name||s.email}),e.jsx("p",{children:s.email})]})]}),e.jsxs("div",{style:{display:"flex",gap:".5rem",alignItems:"center"},children:[e.jsx("span",{className:`user-badge badge-${s.user_type==="org_admin"?"admin":"operator"}`,children:s.user_type?.replace("_"," ")||"operator"}),e.jsx("span",{className:"user-badge badge-active",children:s.status||"active"})]})]},s.id))})]})]})}export{g as default};
