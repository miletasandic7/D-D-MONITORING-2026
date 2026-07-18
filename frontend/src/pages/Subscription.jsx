import React, { useState } from 'react';

const PAGE_CSS = `
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
`;

const PLANS = [
  {
    id: 'standard',
    name: 'Standard Global',
    price: '$500',
    period: '/month',
    features: [
      'Up to 5 active locations/cameras',
      'Automated daily reports',
      'Standard email support',
      'Basic AI detection',
      '30-day incident history'
    ],
    button: 'Current Plan',
    buttonClass: 'plan-btn-secondary',
    disabled: true
  },
  {
    id: 'business',
    name: 'Business Global',
    price: '$950',
    period: '/month',
    features: [
      'Up to 15 active locations/cameras',
      'Accelerated AI reporting',
      'Priority support',
      'Advanced analytics',
      '90-day incident history',
      'Custom alerts'
    ],
    button: 'Upgrade to Business',
    buttonClass: 'plan-btn-primary',
    featured: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Global',
    price: '$1500',
    period: '/month',
    features: [
      'Unlimited locations/cameras',
      'Dedicated AI analytics',
      '24/7 premium support',
      'Real-time streaming',
      'Unlimited history',
      'Custom integrations'
    ],
    button: 'Contact Sales',
    buttonClass: 'plan-btn-primary'
  }
];

export default function Subscription() {
  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="sub-page">
        <div className="sub-header">
          <h1 className="sub-title">Subscription & Billing</h1>
          <p className="sub-subtitle">Manage your monitoring plan and billing information</p>
        </div>

        <div className="sub-current">
          <div className="current-plan">
            <span className="plan-icon">🛡️</span>
            <div>
              <div className="plan-name">Standard Global</div>
              <div className="plan-desc">Billed monthly • Next invoice: August 18, 2026</div>
            </div>
          </div>
          <span className="current-badge">ACTIVE</span>
        </div>

        <div className="plans-grid">
          {PLANS.map(plan => (
            <div key={plan.id} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <span className="featured-badge">MOST POPULAR</span>}
              <div className="plan-name-card">{plan.name}</div>
              <div className="plan-price">{plan.price}<span>{plan.period}</span></div>
              <ul className="plan-features">
                {plan.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <button 
                className={`plan-btn ${plan.buttonClass}`}
                disabled={plan.disabled}
              >
                {plan.button}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
