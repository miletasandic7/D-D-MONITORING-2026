import{j as e}from"./index-CJESP0Xe.js";import"./react-npKdPpEf.js";const s=`
  .sub-page { padding: 2rem; color: #e5eef7; }
  .sub-header { text-align: center; margin-bottom: 2rem; }
  .sub-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; margin-bottom: .5rem; }
  .sub-subtitle { color: #8ab0c9; }
  .sub-current { background: rgba(0,212,80,.1); border: 1px solid rgba(0,212,80,.3); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
  .current-plan { display: flex; align-items: center; gap: 1rem; }
  .plan-icon { font-size: 2rem; }
  .plan-name { font-family: 'Orbitron', sans-serif; color: #00d450; font-size: 1.2rem; }
  .plan-desc { color: #8ab0c9; font-size: .85rem; }
  .current-badge { background: rgba(0,212,80,.2); color: #00d450; padding: .5rem 1rem; border-radius: 20px; font-size: .85rem; font-weight: bold; }
  .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
  .plan-card { background: rgba(10,18,38,.9); border: 1px solid rgba(87,140,255,.18); border-radius: 20px; padding: 2rem; transition: transform .2s, border-color .2s; }
  .plan-card:hover { transform: translateY(-4px); border-color: rgba(0,212,255,.5); }
  .plan-card.featured { border-color: rgba(0,212,255,.5); box-shadow: 0 0 30px rgba(0,212,255,.15); }
  .plan-name-card { font-family: 'Orbitron', sans-serif; font-size: 1.1rem; color: #dff7ff; margin-bottom: .5rem; }
  .plan-price { font-size: 2rem; font-weight: bold; color: #00d4ff; margin-bottom: .25rem; }
  .plan-price span { font-size: .9rem; color: #8ab0c9; font-weight: normal; }
  .plan-features { list-style: none; margin: 1.5rem 0; }
  .plan-features li { color: #8ab0c9; padding: .5rem 0; font-size: .9rem; display: flex; align-items: center; gap: .5rem; }
  .plan-features li::before { content: '✓'; color: #00d450; font-weight: bold; }
  .plan-btn { width: 100%; padding: 1rem; border: none; border-radius: 12px; font-family: 'Orbitron', sans-serif; font-size: .85rem; text-transform: uppercase; letter-spacing: .1em; cursor: pointer; transition: all .2s; }
  .plan-btn-primary { background: linear-gradient(135deg,#00d4ff,#8c4dff); color: #03101c; }
  .plan-btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
  .plan-btn-secondary { background: rgba(87,125,196,.2); color: #8ab0c9; border: 1px solid rgba(87,125,196,.3); }
  .featured-badge { background: linear-gradient(135deg,#00d4ff,#8c4dff); color: #03101c; padding: .3rem .8rem; border-radius: 20px; font-size: .75rem; font-weight: bold; margin-bottom: 1rem; display: inline-block; }
`,t=[{id:"standard",name:"Standard Global",price:"$500",period:"/month",features:["Up to 5 active locations/cameras","Automated daily reports","Standard email support","Basic AI detection","30-day incident history"],button:"Current Plan",buttonClass:"plan-btn-secondary",disabled:!0},{id:"business",name:"Business Global",price:"$950",period:"/month",features:["Up to 15 active locations/cameras","Accelerated AI reporting","Priority support","Advanced analytics","90-day incident history","Custom alerts"],button:"Upgrade to Business",buttonClass:"plan-btn-primary",featured:!0},{id:"enterprise",name:"Enterprise Global",price:"$1500",period:"/month",features:["Unlimited locations/cameras","Dedicated AI analytics","24/7 premium support","Real-time streaming","Unlimited history","Custom integrations"],button:"Contact Sales",buttonClass:"plan-btn-primary"}];function d(){return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:s}),e.jsxs("div",{className:"sub-page",children:[e.jsxs("div",{className:"sub-header",children:[e.jsx("h1",{className:"sub-title",children:"Subscription & Billing"}),e.jsx("p",{className:"sub-subtitle",children:"Manage your monitoring plan and billing information"})]}),e.jsxs("div",{className:"sub-current",children:[e.jsxs("div",{className:"current-plan",children:[e.jsx("span",{className:"plan-icon",children:"🛡️"}),e.jsxs("div",{children:[e.jsx("div",{className:"plan-name",children:"Standard Global"}),e.jsx("div",{className:"plan-desc",children:"Billed monthly • Next invoice: August 18, 2026"})]})]}),e.jsx("span",{className:"current-badge",children:"ACTIVE"})]}),e.jsx("div",{className:"plans-grid",children:t.map(r=>e.jsxs("div",{className:`plan-card ${r.featured?"featured":""}`,children:[r.featured&&e.jsx("span",{className:"featured-badge",children:"MOST POPULAR"}),e.jsx("div",{className:"plan-name-card",children:r.name}),e.jsxs("div",{className:"plan-price",children:[r.price,e.jsx("span",{children:r.period})]}),e.jsx("ul",{className:"plan-features",children:r.features.map((a,n)=>e.jsx("li",{children:a},n))}),e.jsx("button",{className:`plan-btn ${r.buttonClass}`,disabled:r.disabled,children:r.button})]},r.id))})]})]})}export{d as default};
