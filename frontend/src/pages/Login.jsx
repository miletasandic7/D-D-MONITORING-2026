import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../services/supabaseClient';
import api from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Space+Grotesk:wght@400;500;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .ls{position:relative;min-height:100vh;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:'Space Grotesk',sans-serif;color:#e5eef7;background:radial-gradient(circle at 16% 18%,rgba(0,212,255,.15),transparent 24%),radial-gradient(circle at 82% 14%,rgba(52,120,255,.12),transparent 22%),radial-gradient(circle at 50% 84%,rgba(44,81,155,.18),transparent 30%),linear-gradient(180deg,#050b16 0%,#040914 44%,#030710 100%);}
  .ls::before{content:'';position:absolute;inset:0;background:linear-gradient(rgba(87,125,196,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(87,125,196,.06) 1px,transparent 1px);background-size:68px 68px;mask-image:radial-gradient(circle at center,black 35%,transparent 100%);opacity:.33;pointer-events:none;z-index:0;}
  .ls::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,rgba(0,173,255,.14),transparent 55%);pointer-events:none;z-index:0;}
  .ls-shell{position:relative;z-index:1;width:min(1120px,100%);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,420px);align-items:center;gap:2rem;}
  .ls-hero{position:relative;min-height:620px;display:grid;place-items:center;text-align:center;padding:2rem;}
  .ls-hero-frame{position:relative;width:min(100%,520px);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;perspective:1800px;transform-style:preserve-3d;}
  .ls-hero-frame::before{content:'';position:absolute;inset:7%;border-radius:50%;border:1px solid rgba(101,170,255,.20);box-shadow:0 0 50px rgba(20,126,255,.18),inset 0 0 42px rgba(19,125,245,.10);}
  .ls-hero-frame::after{content:'';position:absolute;inset:17%;border-radius:50%;border:1px solid rgba(0,203,255,.24);}
  .ls-scene{position:relative;width:min(100%,430px);aspect-ratio:1;display:grid;place-items:center;transform-style:preserve-3d;}
  .ls-globe{position:relative;width:74%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 36% 28%,rgba(164,233,255,.48),rgba(42,121,188,.22) 38%,rgba(5,28,65,.34) 68%,rgba(1,8,24,.85) 100%);border:1px solid rgba(135,214,255,.28);box-shadow:0 0 40px rgba(0,149,255,.22),inset 0 0 80px rgba(58,176,255,.16);overflow:hidden;transform:rotateX(20deg);}
  .ls-globe::before{content:'';position:absolute;inset:-10%;background:repeating-linear-gradient(90deg,transparent 0 18px,rgba(121,206,255,.09) 18px 19px);opacity:.7;}
  .ls-globe::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 64% 72%,rgba(0,0,0,.36),transparent 48%);}
  .ls-grid-lat,.ls-grid-lon{position:absolute;inset:8%;border-radius:50%;border:1px solid rgba(123,212,255,.20);}
  .ls-grid-lat{transform:rotateX(68deg) scale(1.1);}
  .ls-grid-lon{transform:rotateY(70deg) scale(1.08);}
  .ls-orbit-ring{position:absolute;inset:6%;border-radius:50%;border:1px dashed rgba(121,194,255,.24);transform:rotateX(72deg);animation:ls-orbit 18s linear infinite;}
  .ls-sweep{position:absolute;inset:10%;border-radius:50%;background:conic-gradient(from 120deg,rgba(0,198,255,.24),rgba(0,198,255,0) 24%);mix-blend-mode:screen;animation:ls-sweep 4s linear infinite;}
  .ls-scene-pillar{position:absolute;left:50%;top:50%;width:2px;height:22%;background:linear-gradient(180deg,rgba(161,234,255,.8),rgba(161,234,255,0));transform:translate(-50%,-50%) translateY(-72%);box-shadow:0 0 16px rgba(132,224,255,.7);}
  .ls-monument{position:absolute;left:50%;top:50%;transform:translate(calc(var(--x) * 1%),calc(var(--y) * 1%)) rotateX(8deg) rotateY(-18deg);display:grid;place-items:center;animation:ls-float 4.8s ease-in-out infinite;animation-delay:var(--d);}
  .ls-monument-base{position:absolute;bottom:-10px;width:56px;height:14px;border-radius:8px;background:linear-gradient(180deg,rgba(10,26,48,.96),rgba(5,12,28,.96));border:1px solid rgba(103,189,255,.24);box-shadow:0 0 18px rgba(0,172,255,.18);}
  .ls-monument-glow{position:absolute;bottom:-2px;width:10px;height:10px;border-radius:50%;background:#82ecff;box-shadow:0 0 0 8px rgba(130,236,255,.16),0 0 18px rgba(130,236,255,.72);}
  .ls-monument-chip{position:absolute;top:calc(100% + 10px);padding:.3rem .55rem;border-radius:999px;border:1px solid rgba(120,208,255,.28);background:rgba(3,14,30,.84);color:#daf4ff;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;}

  .ls-shape-opera{position:relative;width:44px;height:34px;}
  .ls-shape-opera::before,.ls-shape-opera::after{content:'';position:absolute;bottom:0;width:18px;height:24px;background:linear-gradient(180deg,rgba(174,233,255,.9),rgba(44,107,165,.86));clip-path:polygon(0 100%,36% 20%,100% 100%);border:1px solid rgba(163,224,255,.42);border-bottom:none;}
  .ls-shape-opera::before{left:2px;transform:rotate(-8deg);}
  .ls-shape-opera::after{right:2px;transform:rotate(8deg);}

  .ls-shape-bridge{position:relative;width:50px;height:24px;border-bottom:2px solid rgba(140,222,255,.78);}
  .ls-shape-bridge::before,.ls-shape-bridge::after{content:'';position:absolute;top:0;width:20px;height:14px;border:2px solid rgba(140,222,255,.78);border-bottom:none;border-radius:20px 20px 0 0;}
  .ls-shape-bridge::before{left:2px;}
  .ls-shape-bridge::after{right:2px;}

  .ls-shape-khalifa{position:relative;width:14px;height:62px;background:linear-gradient(180deg,rgba(179,236,255,.96),rgba(57,122,186,.9));clip-path:polygon(42% 0,58% 0,66% 18%,72% 34%,80% 62%,100% 100%,0 100%,20% 62%,28% 34%,34% 18%);border:1px solid rgba(160,226,255,.48);}
  .ls-shape-khalifa::after{content:'';position:absolute;left:50%;top:-10px;transform:translateX(-50%);width:2px;height:10px;background:rgba(170,239,255,.9);}

  .ls-shape-arab{position:relative;width:28px;height:54px;background:linear-gradient(180deg,rgba(177,235,255,.95),rgba(58,123,188,.88));clip-path:polygon(14% 100%,14% 20%,48% 0,84% 20%,84% 100%);border:1px solid rgba(158,226,255,.46);border-radius:4px;}
  .ls-shape-arab::before{content:'';position:absolute;left:50%;top:10px;transform:translateX(-50%);width:2px;height:28px;background:rgba(15,56,102,.35);}

  .ls-shape-liberty{position:relative;width:16px;height:44px;background:linear-gradient(180deg,rgba(161,255,223,.95),rgba(45,140,122,.86));border:1px solid rgba(140,244,211,.42);border-radius:8px 8px 3px 3px;}
  .ls-shape-liberty::before{content:'';position:absolute;left:50%;top:-9px;transform:translateX(-50%);width:8px;height:8px;background:rgba(161,255,223,.96);border-radius:50%;}
  .ls-shape-liberty::after{content:'';position:absolute;right:-6px;top:6px;width:8px;height:2px;background:rgba(161,255,223,.96);transform:rotate(-26deg);}
  .ls-emblem{position:relative;width:110px;height:110px;display:grid;place-items:center;}
  .ls-emblem-ring{position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(34,206,255,.75);box-shadow:0 0 24px rgba(34,206,255,.26),0 0 60px rgba(146,61,255,.20),inset 0 0 28px rgba(255,255,255,.04);animation:ls-pulse 3.5s ease-in-out infinite;}
  .ls-emblem-core{position:relative;z-index:1;font-size:2.6rem;color:#eb86ff;text-shadow:0 0 12px rgba(235,134,255,.90),0 0 28px rgba(41,198,255,.85),0 0 46px rgba(110,60,255,.85);}
  .ls-hero-copy{position:absolute;top:10%;left:50%;transform:translateX(-50%);width:min(100%,440px);}
  .ls-kicker{font-size:.72rem;letter-spacing:.34em;text-transform:uppercase;color:#8ee8ff;text-shadow:0 0 16px rgba(57,192,255,.66);margin-bottom:.4rem;}
  .ls-hero-copy h1{font-family:'Orbitron',sans-serif;font-size:clamp(2.2rem,3.8vw,4rem);font-weight:900;text-transform:uppercase;letter-spacing:.1em;line-height:1;color:#dff5ff;text-shadow:0 0 12px rgba(47,170,255,.56),0 0 42px rgba(27,100,255,.35);}
  .ls-hero-copy h2{font-family:'Orbitron',sans-serif;font-size:clamp(.82rem,1.1vw,.96rem);font-weight:700;text-transform:uppercase;letter-spacing:.24em;color:#9ec9ff;text-shadow:0 0 12px rgba(103,149,255,.46);margin-top:.5rem;}
  .ls-hero-copy p{margin-top:1.2rem;color:#9ab0c9;line-height:1.7;font-size:.95rem;}
  .ls-card{position:relative;border-radius:28px;padding:2.25rem 2rem;background:linear-gradient(160deg,rgba(14,18,38,.82),rgba(5,9,22,.78));border:1px solid rgba(128,165,255,.18);backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);box-shadow:0 0 0 1px rgba(255,255,255,.025) inset,0 20px 90px rgba(0,0,0,.50),0 0 50px rgba(135,62,255,.28),0 0 80px rgba(0,195,255,.18);}
  .ls-card::before{content:'';position:absolute;inset:1px;border-radius:27px;border:1px solid rgba(255,255,255,.04);pointer-events:none;}
  .ls-card-head{margin-bottom:1.6rem;}
  .ls-card-head h3{font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#dff7ff;margin-top:.4rem;text-shadow:0 0 10px rgba(55,188,255,.80),0 0 26px rgba(140,74,255,.75);}
  .ls-desc{margin-top:.8rem;color:#94a8c2;line-height:1.65;font-size:.9rem;}
  .ls-form{display:grid;gap:1.1rem;}
  .ls-field{display:grid;gap:.5rem;}
  .ls-field span{font-size:.72rem;text-transform:uppercase;letter-spacing:.18em;color:#8ccfff;text-shadow:0 0 12px rgba(80,190,255,.55);}
  .ls-field input{width:100%;border-radius:14px;border:1px solid rgba(109,162,255,.22);background:rgba(4,10,28,.86);color:#ecf7ff;padding:.95rem 1rem;outline:none;font-family:inherit;font-size:1rem;transition:border-color 180ms ease,box-shadow 180ms ease,transform 180ms ease;}
  .ls-field input::placeholder{color:#5f7a96;}
  .ls-field input:focus{border-color:rgba(80,208,255,.75);box-shadow:0 0 0 1px rgba(67,206,255,.18),0 0 24px rgba(63,181,255,.20),0 0 42px rgba(160,76,255,.12);transform:translateY(-1px);}
  .ls-btn{margin-top:.4rem;width:100%;border:0;border-radius:14px;padding:1.05rem;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.84rem;text-transform:uppercase;letter-spacing:.2em;color:#03101c;background:linear-gradient(135deg,#00d4ff 0%,#8c4dff 52%,#ff55cc 100%);box-shadow:0 0 20px rgba(0,212,255,.34),0 0 52px rgba(140,77,255,.28),0 0 76px rgba(255,85,204,.18);transition:transform 180ms ease,filter 180ms ease,box-shadow 180ms ease;}
  .ls-btn:hover,.ls-btn:focus-visible{transform:translateY(-2px);filter:brightness(1.10);box-shadow:0 0 28px rgba(0,212,255,.46),0 0 66px rgba(140,77,255,.42),0 0 96px rgba(255,85,204,.26);}
  @keyframes ls-orbit{0%{transform:rotateX(72deg) rotateZ(0deg)}100%{transform:rotateX(72deg) rotateZ(360deg)}}
  @keyframes ls-sweep{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  @keyframes ls-float{0%,100%{translate:0 -2px}50%{translate:0 4px}}
  @keyframes ls-pulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.07);opacity:1}}
  @media(max-width:1060px){.ls-shell{grid-template-columns:1fr;}.ls-hero{min-height:400px;padding-bottom:0;}}
  @media(max-width:680px){.ls{padding:1rem;}.ls-hero{min-height:300px;padding:1rem;}.ls-hero-frame{width:min(100%,340px);}.ls-monument-chip{display:none;}.ls-card{padding:1.4rem 1.25rem;border-radius:22px;}}
`;

const MONUMENTS = [
  { id: 'opera', label: 'Sydney Opera House', x: -24, y: -38, d: '-0.2s', shapeClass: 'ls-shape-opera' },
  { id: 'bridge', label: 'Sydney Harbour Bridge', x: 20, y: -34, d: '-1.0s', shapeClass: 'ls-shape-bridge' },
  { id: 'khalifa', label: 'Burj Khalifa', x: 26, y: 4, d: '-1.8s', shapeClass: 'ls-shape-khalifa' },
  { id: 'arab', label: 'Burj Al Arab', x: -12, y: 20, d: '-2.5s', shapeClass: 'ls-shape-arab' },
  { id: 'liberty', label: 'Statue of Liberty', x: -34, y: 2, d: '-3.2s', shapeClass: 'ls-shape-liberty' },
];

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
let paypalSdkPromise = null;

function loadPayPalSdk(clientId, currency = 'USD') {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'));
  if (window.paypal) return Promise.resolve(window.paypal);
  if (!clientId) return Promise.reject(new Error('Missing PayPal client ID'));
  if (!paypalSdkPromise) {
    paypalSdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-paypal-sdk="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.paypal));
        existing.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK')));
        return;
      }
      const s = document.createElement('script');
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
      s.async = true;
      s.defer = true;
      s.dataset.paypalSdk = 'true';
      s.onload = () => resolve(window.paypal);
      s.onerror = () => reject(new Error('Failed to load PayPal SDK'));
      document.body.appendChild(s);
    }).finally(() => { paypalSdkPromise = null; });
  }
  return paypalSdkPromise;
}

const PLAN_OPTIONS = [
  {
    id: 'starter',
    name: 'Standard Global',
    price: '$500 / month',
    paypalAmount: '500',
    features: ['Up to 5 cameras / locations', 'Automated incident reports', 'Standard support'],
  },
  {
    id: 'growth',
    name: 'Business Global',
    price: '$950 / month',
    paypalAmount: '950',
    features: ['Up to 15 cameras / locations', 'AI-accelerated reporting', 'Priority support'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Global',
    price: '$1,500 / month',
    paypalAmount: '1500',
    features: ['Unlimited cameras', 'Dedicated AI analytics', '24/7 premium SLA support'],
  },
];

const PRICING_CSS = `
  .pr-wrap{background:linear-gradient(180deg,#030710 0%,#040a16 100%);padding:5rem 2rem 7rem;color:#e5eef7;font-family:'Space Grotesk',sans-serif;border-top:1px solid rgba(87,140,255,.12);}
  .pr-inner{max-width:1100px;margin:0 auto;}
  .pr-eyebrow{font-size:.72rem;letter-spacing:.34em;text-transform:uppercase;color:#8ee8ff;text-shadow:0 0 16px rgba(57,192,255,.66);margin-bottom:.5rem;}
  .pr-heading{font-family:'Orbitron',sans-serif;font-size:clamp(1.5rem,3vw,2.2rem);font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#dff5ff;text-shadow:0 0 12px rgba(47,170,255,.4);margin-bottom:.8rem;}
  .pr-sub{color:#8ab0c9;line-height:1.6;font-size:.95rem;margin-bottom:3rem;max-width:600px;}
  .pr-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-bottom:2.5rem;}
  .pr-card{position:relative;border-radius:20px;padding:2rem 1.75rem;background:rgba(10,18,38,.8);border:1px solid rgba(87,140,255,.18);text-align:left;cursor:pointer;color:#e5eef7;transition:border-color 200ms,transform 200ms,box-shadow 200ms;width:100%;}
  .pr-card:hover{border-color:rgba(80,190,255,.5);transform:translateY(-3px);box-shadow:0 0 28px rgba(0,172,255,.15);}
  .pr-card-active{border-color:rgba(0,210,255,.8)!important;box-shadow:0 0 0 2px rgba(0,210,255,.22),0 0 32px rgba(0,172,255,.2)!important;}
  .pr-card-recommended{border-color:rgba(140,77,255,.5);}
  .pr-badge{display:inline-block;margin-bottom:.75rem;padding:.2rem .65rem;border-radius:999px;background:rgba(140,77,255,.2);border:1px solid rgba(140,77,255,.45);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#c580ff;}
  .pr-name{display:block;font-family:'Orbitron',sans-serif;font-size:.92rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#dff7ff;margin-bottom:.4rem;}
  .pr-price{display:block;font-size:1.4rem;font-weight:700;color:#00d4ff;text-shadow:0 0 10px rgba(0,212,255,.35);margin-bottom:1rem;}
  .pr-features{list-style:none;margin-bottom:1.4rem;display:grid;gap:.5rem;}
  .pr-features li{font-size:.88rem;color:#8ab0c9;padding-left:1.2rem;position:relative;}
  .pr-features li::before{content:'ΓåÆ';position:absolute;left:0;color:#00d4ff;font-size:.8rem;}
  .pr-select{display:inline-block;padding:.35rem .85rem;border-radius:8px;background:rgba(0,210,255,.08);border:1px solid rgba(0,210,255,.25);font-size:.76rem;letter-spacing:.08em;color:#8ee8ff;}
  .pr-card-active .pr-select{background:rgba(0,210,255,.18);border-color:rgba(0,210,255,.55);color:#00d4ff;}
  .pr-checkout{background:rgba(8,14,32,.9);border:1px solid rgba(80,140,255,.2);border-radius:20px;padding:2rem;margin-top:.5rem;}
  .pr-checkout-title{font-size:1rem;font-weight:600;color:#dff7ff;margin-bottom:.4rem;}
  .pr-checkout-note{font-size:.84rem;color:#6a8aaa;margin-bottom:1.5rem;line-height:1.55;}
  .pr-contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.9rem;margin-bottom:1.5rem;}
  .pr-field{display:grid;gap:.35rem;}
  .pr-field span{font-size:.68rem;text-transform:uppercase;letter-spacing:.18em;color:#8ccfff;}
  .pr-field input{border-radius:10px;border:1px solid rgba(100,160,255,.2);background:rgba(4,10,28,.85);color:#ecf7ff;padding:.65rem .9rem;outline:none;font-family:inherit;font-size:.88rem;transition:border-color 180ms;}
  .pr-field input:focus{border-color:rgba(80,208,255,.55);box-shadow:0 0 0 1px rgba(67,206,255,.12);}
  .pr-paypal-btn{margin-top:1.2rem;padding:.85rem 2rem;border:0;border-radius:12px;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.8rem;text-transform:uppercase;letter-spacing:.16em;color:#03101c;background:linear-gradient(135deg,#00d4ff 0%,#8c4dff 52%,#ff55cc 100%);box-shadow:0 0 20px rgba(0,212,255,.28);transition:transform 160ms,filter 160ms;}
  .pr-paypal-btn:hover{transform:translateY(-2px);filter:brightness(1.1);}
  .pr-paypal-container{min-height:60px;margin-top:1.2rem;}
  .pr-error{color:#ff7676;font-size:.86rem;margin-top:.9rem;}
  .pr-status{color:#8ee8ff;font-size:.86rem;margin-top:.9rem;}
  .pr-success{text-align:center;padding:3rem 2rem;background:rgba(0,212,80,.07);border:1px solid rgba(0,212,80,.28);border-radius:20px;margin-top:1rem;}
  .pr-success-icon{display:block;font-size:2.8rem;color:#00d450;margin-bottom:1rem;text-shadow:0 0 18px rgba(0,212,80,.5);}
  .pr-success h3{font-family:'Orbitron',sans-serif;font-size:1.3rem;color:#dff7ff;margin-bottom:.75rem;}
  .pr-success p{color:#8ab0c9;line-height:1.6;}
  @media(max-width:768px){.pr-wrap{padding:3rem 1rem 4rem;}}
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Pricing + PayPal state
  const paypalButtonsRef = useRef(null);
  const [selectedPlanId, setSelectedPlanId] = useState('growth');
  const [checkoutStep, setCheckoutStep] = useState('plans'); // 'plans' | 'contacts' | 'checkout' | 'complete'
  const [paypalStatus, setPaypalStatus] = useState('');
  const [paypalMountError, setPaypalMountError] = useState('');
  const [emergencyDistrict, setEmergencyDistrict] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState({ policeStation: '', fireService: '', ambulance: '', localCommand: '' });

  const selectedPlan = PLAN_OPTIONS.find((p) => p.id === selectedPlanId) || PLAN_OPTIONS[1];
  const requiredContacts = [emergencyDistrict, emergencyContacts.policeStation, emergencyContacts.fireService, emergencyContacts.ambulance, emergencyContacts.localCommand].every((v) => String(v || '').trim().length > 0);

  useEffect(() => {
    if (checkoutStep !== 'checkout') return undefined;
    if (!requiredContacts) return undefined;
    let cancelled = false;
    setPaypalMountError('');

    (async () => {
      try {
        const paypal = await loadPayPalSdk(paypalClientId, 'USD');
        if (cancelled || !paypalButtonsRef.current) return;
        paypalButtonsRef.current.innerHTML = '';

        const buttons = paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'paypal', height: 48 },
          createOrder: async () => {
            const response = await api.post('/paypal/orders', {
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              amount: selectedPlan.paypalAmount,
              currency: 'USD',
              district: emergencyDistrict,
              contacts: emergencyContacts,
            });
            return response.data.id;
          },
          onApprove: async (data) => {
            const response = await api.post(`/paypal/orders/${data.orderID}/capture`, { planId: selectedPlan.id });
            if (!cancelled) {
              setCheckoutStep('complete');
              setPaypalStatus(`Payment confirmed: ${response.data.status || 'COMPLETED'}`);
            }
          },
          onCancel: () => { if (!cancelled) setPaypalStatus('PayPal checkout cancelled.'); },
          onError: (err) => { if (!cancelled) setPaypalMountError(err?.message || 'PayPal checkout failed.'); },
        });

        if (!buttons.isEligible()) {
          if (!cancelled) setPaypalMountError('PayPal is not available in this browser.');
          return;
        }
        await buttons.render(paypalButtonsRef.current);
      } catch (err) {
        if (!cancelled) setPaypalMountError(err?.message || 'Failed to load PayPal.');
      }
    })();

    return () => {
      cancelled = true;
      if (paypalButtonsRef.current) paypalButtonsRef.current.innerHTML = '';
    };
  }, [checkoutStep, selectedPlan.id, selectedPlan.name, selectedPlan.paypalAmount, emergencyDistrict,
    emergencyContacts.policeStation, emergencyContacts.fireService, emergencyContacts.ambulance,
    emergencyContacts.localCommand, requiredContacts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        alert('Supabase environment variables are missing.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert('Invalid credentials');
        return;
      }
      // Store user info locally
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      alert('Sign in failed: ' + err.message);
    }
  };

  return (
    <>
      <style>{CSS + PRICING_CSS}</style>
      <main className="ls">
        <div className="ls-shell">
          <div className="ls-hero" aria-hidden="true">
            <div className="ls-hero-frame">
              <div className="ls-scene">
                <div className="ls-globe">
                  <span className="ls-grid-lat" />
                  <span className="ls-grid-lon" />
                </div>
                <span className="ls-orbit-ring" />
                <span className="ls-sweep" />
                <span className="ls-scene-pillar" />
                <div className="ls-landmark-orbit">
                  {MONUMENTS.map((marker) => (
                    <div
                      key={marker.id}
                      className="ls-monument"
                      style={{
                        '--x': marker.x,
                        '--y': marker.y,
                        '--d': marker.d,
                      }}
                    >
                      <span className="ls-monument-base" />
                      <span className={marker.shapeClass} />
                      <span className="ls-monument-glow" />
                      <span className="ls-monument-chip">{marker.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ls-emblem">
                <span className="ls-emblem-ring" />
                <span className="ls-emblem-core">Γùë</span>
              </div>
            </div>
            <div className="ls-hero-copy">
              <p className="ls-kicker">Global AI Surveillance</p>
              <h1>SECURITY<br />DASHBOARD</h1>
              <h2>MONITORING</h2>
              <p>Neon-grade surveillance intelligence for cameras, detections, and live threat awareness.</p>
            </div>
          </div>

          <section className="ls-card" aria-labelledby="ls-title">
            <div className="ls-card-head">
              <p className="ls-kicker">Threat escalation hub</p>
              <h3 id="ls-title">ACCESS TERMINAL</h3>
              <p className="ls-desc">Sign in to continue into the secured monitoring console.</p>
            </div>

            <form onSubmit={handleSubmit} className="ls-form">
              <label className="ls-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@agency.com"
                  required
                />
              </label>
              <label className="ls-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
                  required
                />
              </label>
              <button type="submit" className="ls-btn">Enter Secure Console</button>
            </form>
          </section>
        </div>
      </main>

      {/* ΓöÇΓöÇ Pricing & PayPal section ΓÇö visible without login ΓöÇΓöÇ */}
      <section className="pr-wrap" id="plans" aria-label="Subscription plans">
        <div className="pr-inner">
          <p className="pr-eyebrow">Transparent pricing</p>
          <h2 className="pr-heading">Choose your monitoring plan</h2>
          <p className="pr-sub">Activate your subscription immediately via secure PayPal checkout ΓÇö no hidden fees, cancel anytime.</p>

          <div className="pr-cards" role="list">
            {PLAN_OPTIONS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                role="listitem"
                className={`pr-card${selectedPlanId === plan.id ? ' pr-card-active' : ''}${plan.recommended ? ' pr-card-recommended' : ''}`}
                onClick={() => { setSelectedPlanId(plan.id); setCheckoutStep('contacts'); setPaypalStatus(''); setPaypalMountError(''); }}
              >
                {plan.recommended && <span className="pr-badge">Most popular</span>}
                <strong className="pr-name">{plan.name}</strong>
                <span className="pr-price">{plan.price}</span>
                <ul className="pr-features" aria-label={`${plan.name} features`}>
                  {plan.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <span className="pr-select">{selectedPlanId === plan.id ? 'Selected Γ£ô' : 'Select plan'}</span>
              </button>
            ))}
          </div>

          {checkoutStep !== 'plans' && checkoutStep !== 'complete' && (
            <div className="pr-checkout">
              <h3 className="pr-checkout-title">Emergency contacts for <strong>{selectedPlan.name}</strong></h3>
              <p className="pr-checkout-note">Required for emergency dispatch integration. Stored securely with your subscription order.</p>
              <div className="pr-contact-grid">
                <label className="pr-field"><span>District / Region</span><input value={emergencyDistrict} onChange={(e) => setEmergencyDistrict(e.target.value)} placeholder="District / county" required /></label>
                <label className="pr-field"><span>Police station</span><input value={emergencyContacts.policeStation} onChange={(e) => setEmergencyContacts((p) => ({ ...p, policeStation: e.target.value }))} placeholder="110 / local number" required /></label>
                <label className="pr-field"><span>Fire service</span><input value={emergencyContacts.fireService} onChange={(e) => setEmergencyContacts((p) => ({ ...p, fireService: e.target.value }))} placeholder="112 / local number" required /></label>
                <label className="pr-field"><span>Ambulance / medical</span><input value={emergencyContacts.ambulance} onChange={(e) => setEmergencyContacts((p) => ({ ...p, ambulance: e.target.value }))} placeholder="Medical emergency number" required /></label>
                <label className="pr-field"><span>Local command center</span><input value={emergencyContacts.localCommand} onChange={(e) => setEmergencyContacts((p) => ({ ...p, localCommand: e.target.value }))} placeholder="District dispatch" required /></label>
              </div>

              {requiredContacts && checkoutStep === 'contacts' && (
                <button className="pr-paypal-btn" type="button" onClick={() => setCheckoutStep('checkout')}>
                  Continue to PayPal ΓåÆ
                </button>
              )}

              {checkoutStep === 'checkout' && (
                <div className="pr-paypal-container" ref={paypalButtonsRef} aria-live="polite" />
              )}

              {paypalMountError && <p className="pr-error" role="alert">{paypalMountError}</p>}
              {paypalStatus && <p className="pr-status" role="status">{paypalStatus}</p>}
            </div>
          )}

          {checkoutStep === 'complete' && (
            <div className="pr-success" role="status">
              <span className="pr-success-icon" aria-hidden="true">Γ£ô</span>
              <h3>Payment successful!</h3>
              <p>Your <strong>{selectedPlan.name}</strong> plan is now active. Log in above to access your security dashboard.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
