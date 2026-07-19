import React, { useState } from 'react';
import api from '../services/api';

const PAGE_CSS = `
  .onboarding-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #050b16 0%, #0a1628 100%);
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .onboarding-container {
    background: rgba(10, 18, 38, 0.95);
    border: 1px solid rgba(87, 140, 255, 0.25);
    border-radius: 24px;
    padding: 3rem;
    max-width: 700px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .onboarding-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  .onboarding-header h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.75rem;
    color: #dff5ff;
    margin-bottom: 0.5rem;
  }
  .onboarding-header p {
    color: #8ab0c9;
    font-size: 0.95rem;
  }
  .progress-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }
  .progress-step {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: rgba(87, 125, 196, 0.2);
    transition: all 0.3s;
  }
  .progress-step.active {
    background: linear-gradient(90deg, #00d4ff, #8c4dff);
  }
  .progress-step.completed {
    background: #00d450;
  }
  .step-content {
    margin-bottom: 2rem;
  }
  .step-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.25rem;
    color: #dff7ff;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .form-group {
    margin-bottom: 1.5rem;
  }
  .form-label {
    display: block;
    color: #8ab0c9;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  .form-label.required::after {
    content: ' *';
    color: #ff5050;
  }
  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 0.9rem 1rem;
    background: rgba(87, 125, 196, 0.1);
    border: 1px solid rgba(87, 125, 196, 0.25);
    border-radius: 12px;
    color: #dff7ff;
    font-size: 0.95rem;
    transition: all 0.2s;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: #00d4ff;
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.15);
  }
  .form-textarea {
    min-height: 100px;
    resize: vertical;
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .camera-slots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .camera-slot {
    background: rgba(87, 125, 196, 0.1);
    border: 2px dashed rgba(87, 125, 196, 0.3);
    border-radius: 12px;
    padding: 1.25rem;
    text-align: center;
    transition: all 0.2s;
    cursor: pointer;
  }
  .camera-slot:hover {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
  }
  .camera-slot.filled {
    border-style: solid;
    border-color: #00d450;
    background: rgba(0, 212, 80, 0.1);
  }
  .camera-slot-number {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  .camera-slot-name {
    color: #8ab0c9;
    font-size: 0.85rem;
  }
  .camera-slot.filled .camera-slot-name {
    color: #00d450;
  }
  .location-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }
  .location-card {
    background: rgba(87, 125, 196, 0.1);
    border: 1px solid rgba(87, 125, 196, 0.2);
    border-radius: 12px;
    padding: 1.25rem;
  }
  .location-card h4 {
    color: #dff7ff;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .btn-group {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-top: 2rem;
  }
  .btn {
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .btn-primary {
    background: linear-gradient(135deg, #00d4ff, #8c4dff);
    border: none;
    color: #03101c;
    flex: 1;
    justify-content: center;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
  }
  .btn-secondary {
    background: rgba(87, 125, 196, 0.15);
    border: 1px solid rgba(87, 125, 196, 0.25);
    color: #8ab0c9;
  }
  .btn-secondary:hover {
    background: rgba(87, 125, 196, 0.25);
    color: #dff7ff;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  .summary-card {
    background: rgba(87, 125, 196, 0.1);
    border: 1px solid rgba(87, 125, 196, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(87, 125, 196, 0.1);
  }
  .summary-row:last-child {
    border-bottom: none;
  }
  .summary-label {
    color: #8ab0c9;
  }
  .summary-value {
    color: #dff7ff;
    font-weight: 500;
  }
  .success-icon {
    font-size: 4rem;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .success-message {
    text-align: center;
    color: #8ab0c9;
    margin-bottom: 2rem;
  }
  .success-message h2 {
    font-family: 'Orbitron', sans-serif;
    color: #00d450;
    margin-bottom: 0.5rem;
  }
`;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Company Info
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    industry: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: ''
  });

  // Step 2: Locations
  const [locations, setLocations] = useState([
    { id: 1, name: '', address: '', lat: '', lng: '' }
  ]);

  // Step 3: Camera Setup
  const [planType, setPlanType] = useState('starter');
  const [cameras, setCameras] = useState([]);
  const cameraLimit = planType === 'starter' ? 5 : planType === 'growth' ? 15 : 50;

  // Step 4: Confirmation
  const [confirmed, setConfirmed] = useState(false);

  const plans = {
    starter: { name: 'Standard', cameras: 5, price: '$500/mo' },
    growth: { name: 'Business', cameras: 15, price: '$950/mo' },
    enterprise: { name: 'Enterprise', cameras: 50, price: '$1,500/mo' }
  };

  const industries = [
    'Retail / Store',
    'Warehouse / Logistics',
    'Office Building',
    'Healthcare',
    'Education',
    'Hospitality',
    'Manufacturing',
    'Residential',
    'Government',
    'Other'
  ];

  const addLocation = () => {
    setLocations([...locations, { 
      id: locations.length + 1, 
      name: '', 
      address: '', 
      lat: '', 
      lng: '' 
    }]);
  };

  const removeLocation = (id) => {
    if (locations.length > 1) {
      setLocations(locations.filter(l => l.id !== id));
    }
  };

  const updateLocation = (id, field, value) => {
    setLocations(locations.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  const addCamera = (locationId) => {
    if (cameras.length < cameraLimit) {
      setCameras([...cameras, {
        id: cameras.length + 1,
        locationId,
        name: '',
        type: 'fixed',
        streamUrl: ''
      }]);
    }
  };

  const updateCamera = (id, field, value) => {
    setCameras(cameras.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeCamera = (id) => {
    setCameras(cameras.filter(c => c.id !== id));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return companyInfo.companyName && companyInfo.email && companyInfo.phone;
      case 2:
        return locations.every(l => l.name && l.address);
      case 3:
        return cameras.length > 0 && cameras.every(c => c.name);
      case 4:
        return confirmed;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save company info
      await api.post('/onboarding/company', companyInfo);
      
      // Save locations
      await api.post('/onboarding/locations', locations);
      
      // Save cameras
      await api.post('/onboarding/cameras', {
        plan: planType,
        cameras: cameras.map(c => ({
          name: c.name,
          location_id: c.locationId,
          stream_url: c.streamUrl || null,
          type: c.type
        }))
      });
      
      setStep(5); // Success
    } catch (err) {
      console.error('Onboarding failed:', err);
      alert('Setup failed. Please check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="onboarding-page">
        <div className="onboarding-container">
          {/* Header */}
          <div className="onboarding-header">
            <h1>🚀 Setup Your Security System</h1>
            <p>Complete your account setup to start monitoring</p>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`progress-step ${s < step ? 'completed' : ''} ${s === step ? 'active' : ''}`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="step-content">
            {/* STEP 1: Company Info */}
            {step === 1 && (
              <>
                <h2 className="step-title">
                  <span>🏢</span>
                  Company Information
                </h2>

                <div className="form-group">
                  <label className="form-label required">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your company name"
                    value={companyInfo.companyName}
                    onChange={(e) => setCompanyInfo({...companyInfo, companyName: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Business Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@company.com"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 555 123 4567"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <select
                    className="form-select"
                    value={companyInfo.industry}
                    onChange={(e) => setCompanyInfo({...companyInfo, industry: e.target.value})}
                  >
                    <option value="">Select industry...</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123 Business Street"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="New York"
                      value={companyInfo.city}
                      onChange={(e) => setCompanyInfo({...companyInfo, city: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="United States"
                      value={companyInfo.country}
                      onChange={(e) => setCompanyInfo({...companyInfo, country: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: Locations */}
            {step === 2 && (
              <>
                <h2 className="step-title">
                  <span>📍</span>
                  Your Locations
                </h2>

                <div className="location-cards">
                  {locations.map((loc, idx) => (
                    <div key={loc.id} className="location-card">
                      <h4>
                        <span>📍</span>
                        Location {idx + 1}
                        {locations.length > 1 && (
                          <button
                            onClick={() => removeLocation(loc.id)}
                            style={{
                              marginLeft: 'auto',
                              background: 'rgba(255,80,80,.2)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ff5050',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </h4>

                      <div className="form-group">
                        <label className="form-label required">Location Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., Main Office, Warehouse A, Store #123"
                          value={loc.name}
                          onChange={(e) => updateLocation(loc.id, 'name', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Address</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Full street address"
                          value={loc.address}
                          onChange={(e) => updateLocation(loc.id, 'address', e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            className="form-input"
                            placeholder="40.7128"
                            value={loc.lat}
                            onChange={(e) => updateLocation(loc.id, 'lat', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            className="form-input"
                            placeholder="-74.0060"
                            value={loc.lng}
                            onChange={(e) => updateLocation(loc.id, 'lng', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addLocation}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(0,212,255,.1)',
                    border: '2px dashed rgba(0,212,255,.3)',
                    borderRadius: '12px',
                    color: '#00d4ff',
                    cursor: 'pointer',
                    marginTop: '1rem',
                    fontWeight: '600'
                  }}
                >
                  + Add Another Location
                </button>
              </>
            )}

            {/* STEP 3: Cameras */}
            {step === 3 && (
              <>
                <h2 className="step-title">
                  <span>📹</span>
                  Camera Setup
                </h2>

                <div className="form-group">
                  <label className="form-label">Select Your Plan</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
                    {Object.entries(plans).map(([key, plan]) => (
                      <div
                        key={key}
                        onClick={() => setPlanType(key)}
                        style={{
                          padding: '1rem',
                          background: planType === key ? 'rgba(0,212,255,.2)' : 'rgba(87,125,196,.1)',
                          border: planType === key ? '2px solid #00d4ff' : '1px solid rgba(87,125,196,.2)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ color: planType === key ? '#00d4ff' : '#dff7ff', fontWeight: 'bold' }}>
                          {plan.name}
                        </div>
                        <div style={{ color: '#8ab0c9', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                          {plan.cameras} cameras
                        </div>
                        <div style={{ color: '#00d450', fontSize: '0.9rem', fontWeight: '600' }}>
                          {plan.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(255,180,50,.1)', 
                  border: '1px solid rgba(255,180,50,.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ color: '#ffb432', margin: 0, fontSize: '0.9rem' }}>
                    📹 Add cameras for your locations. You can add up to <strong>{cameraLimit}</strong> cameras with this plan.
                    <br/>
                    <span style={{ color: '#8ab0c9' }}>Current: {cameras.length} / {cameraLimit} cameras</span>
                  </p>
                </div>

                {cameras.length < cameraLimit && (
                  <button
                    onClick={() => addCamera(locations[0]?.id || 1)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(0,212,255,.1)',
                      border: '2px dashed rgba(0,212,255,.3)',
                      borderRadius: '12px',
                      color: '#00d4ff',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    + Add Camera ({cameras.length}/{cameraLimit})
                  </button>
                )}

                <div className="camera-slots">
                  {Array.from({ length: cameraLimit }).map((_, idx) => {
                    const camera = cameras[idx];
                    return (
                      <div 
                        key={idx}
                        className={`camera-slot ${camera ? 'filled' : ''}`}
                        onClick={() => !camera && addCamera(locations[0]?.id || 1)}
                      >
                        <div className="camera-slot-number">📹</div>
                        {camera ? (
                          <div className="camera-slot-name">{camera.name}</div>
                        ) : (
                          <div className="camera-slot-name">Camera {idx + 1}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Camera Details */}
                {cameras.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ color: '#dff7ff', marginBottom: '1rem' }}>Camera Details</h4>
                    {cameras.map(cam => (
                      <div key={cam.id} style={{
                        background: 'rgba(87,125,196,.1)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '0.75rem'
                      }}>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label required">Camera Name</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g., Front Entrance, Parking Lot"
                              value={cam.name}
                              onChange={(e) => updateCamera(cam.id, 'name', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Type</label>
                            <select
                              className="form-select"
                              value={cam.type}
                              onChange={(e) => updateCamera(cam.id, 'type', e.target.value)}
                            >
                              <option value="fixed">Fixed Camera</option>
                              <option value="ptz">PTZ (Pan/Tilt/Zoom)</option>
                              <option value="dome">Dome Camera</option>
                              <option value="bullet">Bullet Camera</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Stream URL (optional - for real cameras)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="rtsp://camera-ip/stream or leave empty for demo"
                            value={cam.streamUrl}
                            onChange={(e) => updateCamera(cam.id, 'streamUrl', e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => removeCamera(cam.id)}
                          style={{
                            background: 'rgba(255,80,80,.2)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#ff5050',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          Remove Camera
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* STEP 4: Review */}
            {step === 4 && (
              <>
                <h2 className="step-title">
                  <span>📋</span>
                  Review & Confirm
                </h2>

                <div className="summary-card">
                  <h4 style={{ color: '#dff7ff', marginBottom: '1rem' }}>Company Information</h4>
                  <div className="summary-row">
                    <span className="summary-label">Company</span>
                    <span className="summary-value">{companyInfo.companyName}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Email</span>
                    <span className="summary-value">{companyInfo.email}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Phone</span>
                    <span className="summary-value">{companyInfo.phone}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Address</span>
                    <span className="summary-value">{companyInfo.address || 'Not provided'}</span>
                  </div>
                </div>

                <div className="summary-card">
                  <h4 style={{ color: '#dff7ff', marginBottom: '1rem' }}>Locations ({locations.length})</h4>
                  {locations.map((loc, idx) => (
                    <div key={loc.id} className="summary-row">
                      <span className="summary-label">{loc.name}</span>
                      <span className="summary-value">{loc.address}</span>
                    </div>
                  ))}
                </div>

                <div className="summary-card">
                  <h4 style={{ color: '#dff7ff', marginBottom: '1rem' }}>Cameras ({cameras.length})</h4>
                  {cameras.map(cam => (
                    <div key={cam.id} className="summary-row">
                      <span className="summary-label">📹 {cam.name}</span>
                      <span className="summary-value">{cam.type}</span>
                    </div>
                  ))}
                  <div className="summary-row" style={{ borderTop: '1px solid rgba(87,125,196,.2)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
                    <span className="summary-label">Plan</span>
                    <span className="summary-value" style={{ color: '#00d4ff' }}>
                      {plans[planType].name} - {plans[planType].price}
                    </span>
                  </div>
                </div>

                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(87,125,196,.1)',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    style={{ width: '20px', height: '20px', marginTop: '2px' }}
                  />
                  <div style={{ color: '#8ab0c9', fontSize: '0.9rem' }}>
                    I agree to the <a href="/terms-of-service.html" target="_blank" style={{ color: '#00d4ff' }}>Terms of Service</a> and <a href="/privacy-policy.html" target="_blank" style={{ color: '#00d4ff' }}>Privacy Policy</a>. I understand this service is provided "as is" without guarantees.
                  </div>
                </label>
              </>
            )}

            {/* STEP 5: Success */}
            {step === 5 && (
              <>
                <div className="success-icon">🎉</div>
                <div className="success-message">
                  <h2>Setup Complete!</h2>
                  <p>Your security monitoring system is ready. All cameras and locations have been configured.</p>
                </div>
                <div className="summary-card">
                  <h4 style={{ color: '#00d450', marginBottom: '1rem' }}>✅ Configuration Summary</h4>
                  <div className="summary-row">
                    <span className="summary-label">Company</span>
                    <span className="summary-value">{companyInfo.companyName}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Locations</span>
                    <span className="summary-value">{locations.length}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Cameras Configured</span>
                    <span className="summary-value">{cameras.length}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Plan</span>
                    <span className="summary-value" style={{ color: '#00d4ff' }}>{plans[planType].name}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="btn-group">
            {step > 1 && step < 5 && (
              <button 
                className="btn btn-secondary"
                onClick={() => setStep(step - 1)}
              >
                ← Back
              </button>
            )}
            
            {step < 4 && (
              <button 
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue →
              </button>
            )}
            
            {step === 4 && (
              <button 
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
              >
                {loading ? 'Setting up...' : '🚀 Complete Setup'}
              </button>
            )}
            
            {step === 5 && (
              <a 
                href="/dashboard" 
                className="btn btn-primary"
                style={{ textDecoration: 'none', textAlign: 'center' }}
              >
                Go to Dashboard →
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
