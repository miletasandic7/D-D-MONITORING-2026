import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../services/supabaseClient';
import api from '../services/api';

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Space+Grotesk:wght@400;500;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .pg{position:relative;min-height:100vh;width:100%;overflow-x:hidden;font-family:'Space Grotesk',sans-serif;color:#e5eef7;background:radial-gradient(circle at 16% 18%,rgba(0,212,255,.15),transparent 24%),radial-gradient(circle at 82% 14%,rgba(52,120,255,.12),transparent 22%),linear-gradient(180deg,#050b16 0%,#040914 60%,#030710 100%);}
  .pg::before{content:'';position:fixed;inset:0;background:linear-gradient(rgba(87,125,196,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(87,125,196,.06) 1px,transparent 1px);background-size:68px 68px;mask-image:radial-gradient(ellipse at center,black 30%,transparent 90%);opacity:.28;pointer-events:none;z-index:0;}
  .pg-header{position:relative;z-index:1;text-align:center;padding:2.5rem 1.5rem 1.5rem;}
  .pg-emblem{display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;border:1.5px solid rgba(0,203,255,.45);box-shadow:0 0 28px rgba(0,173,255,.22),0 0 60px rgba(140,60,255,.14);margin-bottom:1rem;font-size:2rem;}
  .pg-kicker{font-size:.7rem;letter-spacing:.36em;text-transform:uppercase;color:#8ee8ff;text-shadow:0 0 14px rgba(57,192,255,.6);margin-bottom:.4rem;}
  .pg-title{font-family:'Orbitron',sans-serif;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#dff5ff;text-shadow:0 0 12px rgba(47,170,255,.5),0 0 40px rgba(27,100,255,.3);}
  .pg-tagline{font-size:.95rem;color:#8ab0c9;margin-top:.55rem;line-height:1.6;}
  .pg-grid{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:1.5rem 2rem 4rem;display:grid;grid-template-columns:1fr minmax(300px,390px);gap:2rem;align-items:start;}
  .lc{border-radius:24px;padding:2.25rem 2rem;background:linear-gradient(160deg,rgba(14,18,38,.88),rgba(5,9,22,.84));border:1px solid rgba(128,165,255,.2);backdrop-filter:blur(28px) saturate(160%);box-shadow:0 0 0 1px rgba(255,255,255,.025) inset,0 20px 80px rgba(0,0,0,.50),0 0 50px rgba(135,62,255,.24),0 0 80px rgba(0,195,255,.14);}
  .lc-kicker{font-size:.7rem;letter-spacing:.34em;text-transform:uppercase;color:#8ee8ff;margin-bottom:.3rem;}
  .lc h3{font-family:'Orbitron',sans-serif;font-size:1.05rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#dff7ff;text-shadow:0 0 10px rgba(55,188,255,.8),0 0 26px rgba(140,74,255,.7);margin-bottom:.5rem;}
  .lc-desc{color:#8ab0c9;line-height:1.65;font-size:.88rem;margin-bottom:1.6rem;}
  .lc-form{display:grid;gap:1.1rem;}
  .lc-field{display:grid;gap:.45rem;}
  .lc-field span{font-size:.7rem;text-transform:uppercase;letter-spacing:.18em;color:#8ccfff;}
  .lc-field input{width:100%;border-radius:12px;border:1px solid rgba(109,162,255,.22);background:rgba(4,10,28,.86);color:#ecf7ff;padding:.9rem 1rem;outline:none;font-family:inherit;font-size:1rem;transition:border-color 180ms,box-shadow 180ms;}
  .lc-field input::placeholder{color:#4e6580;}
  .lc-field input:focus{border-color:rgba(80,208,255,.75);box-shadow:0 0 0 1px rgba(67,206,255,.18),0 0 22px rgba(63,181,255,.18);}
  .lc-btn{margin-top:.4rem;width:100%;border:0;border-radius:12px;padding:1.05rem;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.2em;color:#03101c;background:linear-gradient(135deg,#00d4ff 0%,#8c4dff 52%,#ff55cc 100%);box-shadow:0 0 20px rgba(0,212,255,.30),0 0 50px rgba(140,77,255,.22);transition:transform 180ms,filter 180ms;}
  .lc-btn:hover{transform:translateY(-2px);filter:brightness(1.10);}
  .pr{display:flex;flex-direction:column;gap:1.5rem;}
  .pr-eyebrow{font-size:.7rem;letter-spacing:.34em;text-transform:uppercase;color:#8ee8ff;margin-bottom:.35rem;}
  .pr-heading{font-family:'Orbitron',sans-serif;font-size:clamp(1rem,2vw,1.4rem);font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#dff5ff;text-shadow:0 0 10px rgba(47,170,255,.3);margin-bottom:.45rem;}
  .pr-sub{color:#8ab0c9;font-size:.88rem;line-height:1.6;margin-bottom:.25rem;}
  .pr-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem;}
  .pr-card{border-radius:18px;padding:1.5rem 1.4rem;background:rgba(10,18,38,.85);border:1px solid rgba(87,140,255,.18);text-align:left;cursor:pointer;color:#e5eef7;transition:border-color 200ms,transform 200ms,box-shadow 200ms;width:100%;}
  .pr-card:hover{border-color:rgba(80,190,255,.5);transform:translateY(-2px);box-shadow:0 0 22px rgba(0,172,255,.14);}
  .pr-card-sel{border-color:rgba(0,210,255,.8)!important;box-shadow:0 0 0 2px rgba(0,210,255,.22),0 0 26px rgba(0,172,255,.18)!important;}
  .pr-card-rec{border-color:rgba(140,77,255,.42);}
  .pr-badge{display:inline-block;margin-bottom:.6rem;padding:.18rem .6rem;border-radius:999px;background:rgba(140,77,255,.18);border:1px solid rgba(140,77,255,.42);font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:#c580ff;}
  .pr-name{display:block;font-family:'Orbitron',sans-serif;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#dff7ff;margin-bottom:.3rem;}
  .pr-price{display:block;font-size:1.25rem;font-weight:700;color:#00d4ff;text-shadow:0 0 8px rgba(0,212,255,.28);margin-bottom:.8rem;}
  .pr-features{list-style:none;margin-bottom:1.1rem;display:grid;gap:.35rem;}
  .pr-features li{font-size:.82rem;color:#8ab0c9;padding-left:1.1rem;position:relative;}
  .pr-features li::before{content:'→';position:absolute;left:0;color:#00d4ff;font-size:.8rem;}
  .pr-sel-label{display:inline-block;padding:.28rem .75rem;border-radius:8px;background:rgba(0,210,255,.08);border:1px solid rgba(0,210,255,.25);font-size:.72rem;letter-spacing:.06em;color:#8ee8ff;}
  .pr-card-sel .pr-sel-label{background:rgba(0,210,255,.18);border-color:rgba(0,210,255,.55);color:#00d4ff;font-weight:600;}
  .pr-checkout{background:rgba(8,14,32,.93);border:1px solid rgba(80,140,255,.2);border-radius:18px;padding:1.6rem 1.5rem;}
  .pr-checkout h4{font-size:.95rem;font-weight:600;color:#dff7ff;margin-bottom:.35rem;}
  .pr-checkout-note{font-size:.82rem;color:#6a8aaa;margin-bottom:1.2rem;line-height:1.55;}
  .pr-contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem;margin-bottom:1.1rem;}
  .pr-cfield{display:grid;gap:.3rem;}
  .pr-cfield span{font-size:.65rem;text-transform:uppercase;letter-spacing:.16em;color:#8ccfff;}
  .pr-cfield input{border-radius:10px;border:1px solid rgba(100,160,255,.2);background:rgba(4,10,28,.85);color:#ecf7ff;padding:.6rem .85rem;outline:none;font-family:inherit;font-size:.84rem;transition:border-color 180ms;}
  .pr-cfield input:focus{border-color:rgba(80,208,255,.55);}
  .pr-proceed-btn{padding:.8rem 1.8rem;border:0;border-radius:10px;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.76rem;text-transform:uppercase;letter-spacing:.14em;color:#03101c;background:linear-gradient(135deg,#00d4ff 0%,#8c4dff 52%,#ff55cc 100%);box-shadow:0 0 16px rgba(0,212,255,.22);transition:transform 160ms,filter 160ms;}
  .pr-proceed-btn:hover{transform:translateY(-2px);filter:brightness(1.1);}
  .pr-pp-wrap{min-height:60px;margin-top:1rem;}
  .pr-error{color:#ff7676;font-size:.83rem;margin-top:.75rem;}
  .pr-status-msg{color:#8ee8ff;font-size:.83rem;margin-top:.75rem;}
  .pr-success{text-align:center;padding:2.5rem 1.5rem;background:rgba(0,212,80,.07);border:1px solid rgba(0,212,80,.28);border-radius:18px;}
  .pr-success-icon{display:block;font-size:2.4rem;color:#00d450;margin-bottom:.8rem;}
  .pr-success h3{font-family:'Orbitron',sans-serif;font-size:1.15rem;color:#dff7ff;margin-bottom:.55rem;}
  .pr-success p{color:#8ab0c9;line-height:1.6;font-size:.88rem;}
  @media(max-width:860px){.pg-grid{grid-template-columns:1fr;}.lc{order:-1;}}
  @media(max-width:520px){.pg-grid{padding:1rem 1rem 3rem;}.pg-header{padding:1.5rem 1rem 1rem;}.pr-cards{grid-template-columns:1fr;}}
`;

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
let _ppSdkPromise = null;

function loadPayPalSdk(clientId, currency = 'USD') {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'));
  if (window.paypal) return Promise.resolve(window.paypal);
  if (!clientId) return Promise.reject(new Error('Missing PayPal client ID'));
  if (!_ppSdkPromise) {
    _ppSdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-pp-sdk]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.paypal));
        existing.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK')));
        return;
      }
      const s = document.createElement('script');
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
      s.async = true;
      s.dataset.ppSdk = 'true';
      s.onload = () => resolve(window.paypal);
      s.onerror = () => reject(new Error('Failed to load PayPal SDK'));
      document.body.appendChild(s);
    }).finally(() => { _ppSdkPromise = null; });
  }
  return _ppSdkPromise;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Standard Global',
    price: '$500 / month',
    amount: '500',
    features: ['Up to 5 cameras / locations', 'Automated incident reports', 'Standard support'],
  },
  {
    id: 'growth',
    name: 'Business Global',
    price: '$950 / month',
    amount: '950',
    features: ['Up to 15 cameras / locations', 'AI-accelerated reporting', 'Priority support'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Global',
    price: '$1,500 / month',
    amount: '1500',
    features: ['Unlimited cameras', 'Dedicated AI analytics', '24/7 premium SLA support'],
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const ppRef = useRef(null);
  const [planId, setPlanId] = useState('growth');
  const [step, setStep] = useState('plans');
  const [ppStatus, setPpStatus] = useState('');
  const [ppError, setPpError] = useState('');
  const [district, setDistrict] = useState('');
  const [contacts, setContacts] = useState({ police: '', fire: '', ambulance: '', command: '' });

  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];
  const contactsFilled = [district, contacts.police, contacts.fire, contacts.ambulance, contacts.command].every(
    (v) => String(v || '').trim().length > 0
  );

  useEffect(() => {
    if (step !== 'checkout' || !contactsFilled) return;
    let cancelled = false;
    setPpError('');

    (async () => {
      try {
        const paypal = await loadPayPalSdk(paypalClientId, 'USD');
        if (cancelled || !ppRef.current) return;
        ppRef.current.innerHTML = '';

        const buttons = paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'paypal', height: 48 },
          createOrder: async () => {
            const res = await api.post('/paypal/orders', {
              planId: plan.id,
              planName: plan.name,
              amount: plan.amount,
              currency: 'USD',
              district,
              contacts,
            });
            return res.data.id;
          },
          onApprove: async (data) => {
            const res = await api.post(`/paypal/orders/${data.orderID}/capture`, { planId: plan.id });
            if (!cancelled) {
              setStep('complete');
              setPpStatus(`Payment confirmed: ${res.data.status || 'COMPLETED'}`);
            }
          },
          onCancel: () => { if (!cancelled) setPpStatus('PayPal checkout cancelled.'); },
          onError: (err) => { if (!cancelled) setPpError(err?.message || 'PayPal checkout failed.'); },
        });

        if (!buttons.isEligible()) {
          if (!cancelled) setPpError('PayPal is not available in this browser.');
          return;
        }
        await buttons.render(ppRef.current);
      } catch (err) {
        if (!cancelled) setPpError(err?.message || 'Failed to load PayPal.');
      }
    })();

    return () => {
      cancelled = true;
      if (ppRef.current) ppRef.current.innerHTML = '';
    };
  }, [step, plan.id, plan.name, plan.amount, district,
    contacts.police, contacts.fire, contacts.ambulance, contacts.command, contactsFilled]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) { alert('Supabase environment variables are missing.'); return; }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { alert('Invalid credentials'); return; }
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      alert('Sign in failed: ' + err.message);
    }
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="pg">
        <header className="pg-header">
          <div className="pg-emblem" aria-hidden="true">&#x1F6E1;</div>
          <p className="pg-kicker">Global AI Surveillance</p>
          <h1 className="pg-title">D&amp;D SECURITY DASHBOARD</h1>
          <p className="pg-tagline">Neon-grade surveillance intelligence for cameras, detections and live threat awareness.</p>
        </header>

        <div className="pg-grid">
          {/* LEFT — Pricing plans */}
          <div className="pr">
            <div>
              <p className="pr-eyebrow">Transparent pricing</p>
              <h2 className="pr-heading">Choose your monitoring plan</h2>
              <p className="pr-sub">Activate your subscription via secure PayPal checkout &#x2014; no hidden fees, cancel anytime.</p>
            </div>

            {step !== 'complete' ? (
              <>
                <div className="pr-cards" role="list">
                  {PLANS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="listitem"
                      className={`pr-card${planId === p.id ? ' pr-card-sel' : ''}${p.recommended ? ' pr-card-rec' : ''}`}
                      onClick={() => { setPlanId(p.id); setStep('contacts'); setPpStatus(''); setPpError(''); }}
                    >
                      {p.recommended && <span className="pr-badge">Most popular</span>}
                      <strong className="pr-name">{p.name}</strong>
                      <span className="pr-price">{p.price}</span>
                      <ul className="pr-features" aria-label={`${p.name} features`}>
                        {p.features.map((f) => <li key={f}>{f}</li>)}
                      </ul>
                      <span className="pr-sel-label">{planId === p.id ? 'Selected' : 'Select plan'}</span>
                    </button>
                  ))}
                </div>

                {step !== 'plans' && (
                  <div className="pr-checkout">
                    <h4>Emergency contacts &#x2014; <strong>{plan.name}</strong></h4>
                    <p className="pr-checkout-note">Required for emergency dispatch integration. Stored securely with your subscription order.</p>
                    <div className="pr-contact-grid">
                      <label className="pr-cfield">
                        <span>District / Region</span>
                        <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District or county" required />
                      </label>
                      <label className="pr-cfield">
                        <span>Police station</span>
                        <input value={contacts.police} onChange={(e) => setContacts((c) => ({ ...c, police: e.target.value }))} placeholder="110 / local number" required />
                      </label>
                      <label className="pr-cfield">
                        <span>Fire service</span>
                        <input value={contacts.fire} onChange={(e) => setContacts((c) => ({ ...c, fire: e.target.value }))} placeholder="112 / local number" required />
                      </label>
                      <label className="pr-cfield">
                        <span>Ambulance / medical</span>
                        <input value={contacts.ambulance} onChange={(e) => setContacts((c) => ({ ...c, ambulance: e.target.value }))} placeholder="Medical emergency number" required />
                      </label>
                      <label className="pr-cfield">
                        <span>Local command center</span>
                        <input value={contacts.command} onChange={(e) => setContacts((c) => ({ ...c, command: e.target.value }))} placeholder="District dispatch" required />
                      </label>
                    </div>

                    {contactsFilled && step === 'contacts' && (
                      <button className="pr-proceed-btn" type="button" onClick={() => setStep('checkout')}>
                        Continue to PayPal
                      </button>
                    )}

                    {step === 'checkout' && (
                      <div className="pr-pp-wrap" ref={ppRef} aria-live="polite" />
                    )}

                    {ppError && <p className="pr-error" role="alert">{ppError}</p>}
                    {ppStatus && <p className="pr-status-msg" role="status">{ppStatus}</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="pr-success" role="status">
                <span className="pr-success-icon" aria-hidden="true">&#x2713;</span>
                <h3>Payment successful!</h3>
                <p>Your <strong>{plan.name}</strong> plan is now active. Sign in to access your security dashboard.</p>
              </div>
            )}
          </div>

          {/* RIGHT — Login form */}
          <section className="lc" aria-labelledby="lc-title">
            <p className="lc-kicker">Secure access</p>
            <h3 id="lc-title">ACCESS TERMINAL</h3>
            <p className="lc-desc">Sign in to continue into the secured monitoring console.</p>
            <form onSubmit={handleLogin} className="lc-form">
              <label className="lc-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@agency.com"
                  required
                />
              </label>
              <label className="lc-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </label>
              <button type="submit" className="lc-btn">Enter Secure Console</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}