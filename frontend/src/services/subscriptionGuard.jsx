import React from 'react';

// Subscription plans and their features
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    features: {
      cameras: 1,
      users: 1,
      aiDetection: false,
      faceRecognition: false,
      lpr: false,
      emergencyDispatch: false,
      videoPlayback: false,
      reports: false,
      apiAccess: false,
      priority: 'low'
    }
  },
  professional: {
    name: 'Professional',
    price: 29,
    features: {
      cameras: 5,
      users: 5,
      aiDetection: true,
      faceRecognition: false,
      lpr: false,
      emergencyDispatch: false,
      videoPlayback: true,
      reports: true,
      apiAccess: false,
      priority: 'medium'
    }
  },
  business: {
    name: 'Business',
    price: 99,
    features: {
      cameras: 20,
      users: 20,
      aiDetection: true,
      faceRecognition: true,
      lpr: true,
      emergencyDispatch: true,
      videoPlayback: true,
      reports: true,
      apiAccess: true,
      priority: 'high'
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    features: {
      cameras: -1, // unlimited
      users: -1,
      aiDetection: true,
      faceRecognition: true,
      lpr: true,
      emergencyDispatch: true,
      videoPlayback: true,
      reports: true,
      apiAccess: true,
      priority: 'critical'
    }
  }
};

// Get user's plan from localStorage (in real app, this would come from backend)
export const getUserPlan = () => {
  const planId = localStorage.getItem('planId') || 'starter';
  return PLANS[planId] || PLANS.starter;
};

// Check if feature is available
export const isFeatureAvailable = (feature) => {
  const plan = getUserPlan();
  return plan.features[feature] === true || plan.features[feature] === -1;
};

// Check camera limit
export const canAddCamera = (currentCount) => {
  const plan = getUserPlan();
  if (plan.features.cameras === -1) return true;
  return currentCount < plan.features.cameras;
};

// Check user limit
export const canAddUser = (currentCount) => {
  const plan = getUserPlan();
  if (plan.features.users === -1) return true;
  return currentCount < plan.features.users;
};

// Upgrade prompt component
export const UpgradePrompt = ({ feature, requiredPlan }) => (
  <div style={{
    padding: '3rem 2rem',
    textAlign: 'center',
    background: 'rgba(10,18,38,.95)',
    border: '2px solid rgba(255,180,50,.3)',
    borderRadius: '16px',
    margin: '2rem 0'
  }}>
    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
    <h2 style={{ 
      color: '#ffb432', 
      fontSize: '1.5rem',
      marginBottom: '1rem',
      fontFamily: 'Orbitron, sans-serif'
    }}>
      Premium Feature Locked
    </h2>
    <p style={{ 
      color: '#8ab0c9', 
      marginBottom: '1.5rem',
      maxWidth: '500px',
      margin: '0 auto 1.5rem'
    }}>
      The <strong style={{ color: '#00d4ff' }}>{feature}</strong> feature requires the 
      <strong style={{ color: '#00d450' }}> {requiredPlan}</strong> plan.
    </p>
    <div style={{
      display: 'inline-flex',
      gap: '1rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      {Object.entries(PLANS).map(([key, plan]) => (
        plan.features[feature.replace(' ', '').toLowerCase()] === true && (
          <div key={key} style={{
            background: 'rgba(0,212,255,.1)',
            border: '1px solid rgba(0,212,255,.3)',
            borderRadius: '12px',
            padding: '1rem 1.5rem'
          }}>
            <div style={{ color: '#00d4ff', fontWeight: 'bold' }}>{plan.name}</div>
            <div style={{ color: '#8ab0c9', fontSize: '.9rem' }}>${plan.price}/mo</div>
          </div>
        )
      ))}
    </div>
    <div style={{ marginTop: '1.5rem' }}>
      <button 
        onClick={() => window.location.href = '/subscription'}
        style={{
          background: 'linear-gradient(135deg,#00d4ff,#8c4dff)',
          border: 'none',
          color: '#03101c',
          padding: '1rem 2rem',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Upgrade Now 💳
      </button>
    </div>
  </div>
);

// Feature guard component
export const FeatureGuard = ({ feature, children, fallback = null }) => {
  if (isFeatureAvailable(feature)) {
    return children;
  }
  
  if (fallback) {
    return fallback;
  }
  
  const featureNames = {
    aiDetection: 'AI Detection',
    faceRecognition: 'Face Recognition',
    lpr: 'License Plate Recognition',
    emergencyDispatch: 'Emergency Dispatch',
    videoPlayback: 'Video Playback',
    reports: 'Reports',
    apiAccess: 'API Access'
  };
  
  // Find which plan has this feature
  let requiredPlan = 'Professional';
  Object.entries(PLANS).forEach(([key, plan]) => {
    if (plan.features[feature] === true) {
      requiredPlan = plan.name;
    }
  });
  
  return <UpgradePrompt feature={featureNames[feature] || feature} requiredPlan={requiredPlan} />;
};

// Camera limit guard
export const CameraLimitGuard = ({ currentCount, children }) => {
  if (canAddCamera(currentCount)) {
    return children;
  }
  
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      background: 'rgba(255,80,80,.1)',
      border: '1px solid rgba(255,80,80,.3)',
      borderRadius: '12px'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
      <h3 style={{ color: '#ff5050' }}>Camera Limit Reached</h3>
      <p style={{ color: '#8ab0c9', marginBottom: '1rem' }}>
        Your {getUserPlan().name} plan includes {getUserPlan().features.cameras} cameras.
      </p>
      <button 
        onClick={() => window.location.href = '/subscription'}
        style={{
          background: 'linear-gradient(135deg,#00d4ff,#8c4dff)',
          border: 'none',
          color: '#03101c',
          padding: '.8rem 1.5rem',
          borderRadius: '10px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Upgrade to Add More Cameras
      </button>
    </div>
  );
};

// Payment required modal
export const PaymentRequired = ({ onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      background: 'rgba(10,18,38,.95)',
      border: '2px solid rgba(255,80,80,.5)',
      borderRadius: '20px',
      padding: '3rem',
      maxWidth: '500px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💳</div>
      <h2 style={{ 
        color: '#ff5050',
        fontSize: '1.5rem',
        marginBottom: '1rem',
        fontFamily: 'Orbitron'
      }}>
        Payment Required
      </h2>
      <p style={{ color: '#8ab0c9', marginBottom: '2rem' }}>
        This feature requires an active subscription. 
        Please select a plan to continue using all features.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => window.location.href = '/subscription'}
          style={{
            background: 'linear-gradient(135deg,#00d4ff,#8c4dff)',
            border: 'none',
            color: '#03101c',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          View Plans
        </button>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(87,125,196,.2)',
            border: '1px solid rgba(87,125,196,.3)',
            color: '#8ab0c9',
            padding: '1rem 2rem',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  </div>
);

export default {
  PLANS,
  getUserPlan,
  isFeatureAvailable,
  canAddCamera,
  canAddUser,
  FeatureGuard,
  CameraLimitGuard,
  UpgradePrompt,
  PaymentRequired
};
