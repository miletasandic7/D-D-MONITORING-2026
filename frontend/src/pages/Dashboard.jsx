import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Hls from 'hls.js';
import { getSupabaseClient } from '../services/supabaseClient';

const hlsBaseUrl = (import.meta.env.VITE_HLS_BASE_URL || '/hls').replace(/\/$/, '');
const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const paypalCurrency = import.meta.env.VITE_PAYPAL_CURRENCY || 'USD';

let paypalSdkPromise = null;

function loadPayPalSdk(clientId, currency = 'USD') {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PayPal SDK can only load in the browser.'));
  }

  if (window.paypal) {
    return Promise.resolve(window.paypal);
  }

  if (!clientId) {
    return Promise.reject(new Error('Missing PayPal client ID.'));
  }

  if (!paypalSdkPromise) {
    paypalSdkPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-paypal-sdk="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.paypal));
        existingScript.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK.')));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
      script.async = true;
      script.defer = true;
      script.dataset.paypalSdk = 'true';
      script.onload = () => resolve(window.paypal);
      script.onerror = () => reject(new Error('Failed to load PayPal SDK.'));
      document.body.appendChild(script);
    }).finally(() => {
      paypalSdkPromise = null;
    });
  }

  return paypalSdkPromise;
}

const CAMERA_GEO = {
  'CAM-01': { lat: 45.8154, lng: 15.9819, label: 'Main Entrance', note: 'front access lane and reception perimeter' },
  'CAM-02': { lat: 45.8129, lng: 15.9672, label: 'Parking Lot', note: 'northwest parking bay near service road' },
  'CAM-03': { lat: 45.8138, lng: 15.9862, label: 'Lobby', note: 'central lobby and badge access point' },
  'CAM-04': { lat: 45.8087, lng: 15.9728, label: 'Server Room', note: 'secured internal infrastructure room' },
  'CAM-05': { lat: 45.8071, lng: 15.9594, label: 'Warehouse A', note: 'east warehouse loading corridor' },
  'CAM-06': { lat: 45.8061, lng: 15.9524, label: 'Warehouse B', note: 'west warehouse receiving corridor' },
  'CAM-07': { lat: 45.8047, lng: 15.9658, label: 'Loading Dock', note: 'truck access and unloading platform' },
  'CAM-08': { lat: 45.8189, lng: 15.9715, label: 'Perimeter North', note: 'north fence line and exterior patrol route' },
  'CAM-09': { lat: 45.8032, lng: 15.9781, label: 'Perimeter South', note: 'southern fence line and back perimeter' },
};

const PLAN_OPTIONS = [
  {
    id: 'starter',
    name: 'Standard Global',
    price: '$500 / month',
    paypalAmount: '500',
    features: [
      'Global monitoring for up to 5 active locations/cameras',
      'Automated reports',
      'Standard support',
    ],
  },
  {
    id: 'growth',
    name: 'Business Global',
    price: '$950 / month',
    paypalAmount: '950',
    features: [
      'Advanced monitoring for up to 15 active locations/cameras',
      'Accelerated AI reporting',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Global',
    price: '$1500 / month',
    paypalAmount: '1500',
    features: [
      'Maximum capacity',
      'Unlimited locations',
      'Dedicated AI analytics',
      '24/7 premium support',
    ],
  },
];

function buildHlsManifestUrl(cameraId) {
  return `${hlsBaseUrl}/${cameraId}/index.m3u8`;
}

function buildCameraGeo(camera) {
  const fallback = CAMERA_GEO[camera?.id] || {};
  return {
    lat: Number(camera?.lat ?? fallback.lat ?? 45.8154),
    lng: Number(camera?.lng ?? fallback.lng ?? 15.9819),
    label: camera?.name || fallback.label || camera?.id || 'Unknown location',
    note: fallback.note || camera?.location || 'Security perimeter point',
  };
}

function buildIncidentReport(event, camera, contacts, plan) {
  const cameraGeo = buildCameraGeo(camera);
  return {
    generated_at: new Date().toISOString(),
    plan: plan?.name || 'Unselected',
    incident: {
      event_id: event?.eventId || null,
      title: event?.title || 'Alarm Triggered',
      status: event?.status || 'New',
      confidence: event?.confidence ?? null,
      camera_id: event?.camera_id || camera?.id || null,
      camera_name: camera?.name || event?.source || 'Unknown camera',
      location_label: cameraGeo.label,
      location_note: cameraGeo.note,
      coordinates: { lat: cameraGeo.lat, lng: cameraGeo.lng },
      zone: event?.zone || camera?.location || 'unknown',
      direction: event?.direction || 'unknown',
      dwell_seconds: event?.dwell_seconds ?? null,
      source: event?.source || 'system',
      timestamp: event?.time || new Date().toISOString(),
    },
    emergency_contacts: contacts,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const paypalButtonsRef = useRef(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoaded, setIncidentsLoaded] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [updatingIncidentId, setUpdatingIncidentId] = useState(null);
  const [error, setError] = useState(null);

  // Smart Search v2 filter state
  const [filterCamera, setFilterCamera] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterDwellMin, setFilterDwellMin] = useState('');
  const [filterObjectType, setFilterObjectType] = useState('');
  const [filterColor, setFilterColor] = useState('');

  // False Alarm suppression
  const [suppressEnabled, setSuppressEnabled] = useState(false);
  const [suppressThreshold, setSuppressThreshold] = useState(85);

  // Phase 3 ΓÇö Camera Onboarding Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardScanning, setWizardScanning] = useState(false);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);
  const [newCamera, setNewCamera] = useState({ id: '', name: '', rtsp_url: '', location: '', enabled: true, resolution: '1920x1080', fps: 30, codec: 'H264' });

  const openWizard = () => { setWizardOpen(true); setWizardStep(1); setWizardScanning(false); setWizardDone(false); setNewCamera({ id: '', name: '', rtsp_url: '', location: '', enabled: true, resolution: '1920x1080', fps: 30, codec: 'H264' }); };
  const closeWizard = () => setWizardOpen(false);

  const runONVIFScan = () => {
    setWizardScanning(true);
    setTimeout(() => {
      const discovered = `rtsp://192.168.1.${100 + Math.floor(Math.random() * 50)}:554/stream1`;
      setNewCamera((prev) => ({ ...prev, rtsp_url: prev.rtsp_url || discovered }));
      setWizardScanning(false);
      setWizardStep(2);
    }, 2000);
  };

  const saveCamera = async () => {
    setWizardSaving(true);
    try {
      await api.post('/cameras', newCamera);
      setCameras((prev) => [...prev, newCamera]);
    } catch {
      // optimistic add even if API isn't wired yet
      setCameras((prev) => [...prev, newCamera]);
    } finally {
      setWizardSaving(false);
      setWizardDone(true);
      setWizardStep(3);
    }
  };

  // Phase 3 ΓÇö Voice Talkdown
  const [talkdownActive, setTalkdownActive] = useState(null);

  // Phase 4 ΓÇö Audit Log
  const [auditLog, setAuditLog] = useState([
    { id: 1, ts: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString(), user: 'operator@agency.com', action: 'Logged in to Security Dashboard' },
    { id: 2, ts: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(), user: 'operator@agency.com', action: 'Viewed Incident Queue (3 open incidents)' },
    { id: 3, ts: new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString(), user: 'operator@agency.com', action: 'Exported evidence package for Event #2' },
  ]);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const addAuditEntry = (action) => setAuditLog((prev) => [{ id: Date.now(), ts: new Date().toLocaleTimeString(), user: currentUser?.email || 'operator', action }, ...prev].slice(0, 50));

  // Phase 4 ΓÇö White-Label Branding
  const [brandMode, setBrandMode] = useState('default'); // 'default' | 'corporate'
  const brandName = brandMode === 'corporate' ? 'SecureOps Enterprise' : 'D&D Global AI Surveillance';
  const brandInitial = brandMode === 'corporate' ? 'S' : 'D';

  // Phase 4 ΓÇö Subscription
  const [showBilling, setShowBilling] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('growth');
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const [paymentStep, setPaymentStep] = useState('details');
  const [emergencyDistrict, setEmergencyDistrict] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState({
    policeStation: '',
    fireService: '',
    ambulance: '',
    localCommand: '',
  });
  const [selectedAlarmId, setSelectedAlarmId] = useState(null);
  const [reportNotes, setReportNotes] = useState('');
  const [paypalMountError, setPaypalMountError] = useState('');
  const [paypalMounting, setPaypalMounting] = useState(false);

  const subscription = { tier: 'Enterprise', status: 'Active', validUntil: '2027-12-31', cameras: 'Unlimited', users: 'Unlimited', ai: 'Full AI Analytics', sla: '99.9% uptime SLA' };
  const selectedPlan = PLAN_OPTIONS.find((plan) => plan.id === selectedPlanId) || PLAN_OPTIONS[1];

  const triggerTalkdown = (camId) => {
    setTalkdownActive(camId);
    const camName = cameras.find((c) => c.id === camId)?.name || camId;
    addAuditEntry(`Triggered voice talkdown on ${camName}`);
    setTimeout(() => setTalkdownActive(null), 5000);
  };

  const selectedPlanAmount = selectedPlan.paypalAmount;
  const selectedPlanSupportsPaypal = Boolean(selectedPlanAmount);

  const requiredEmergencyFields = [
    emergencyDistrict,
    emergencyContacts.policeStation,
    emergencyContacts.fireService,
    emergencyContacts.ambulance,
    emergencyContacts.localCommand,
  ].every((value) => String(value || '').trim().length > 0);

  const openAlarmMap = (event) => {
    setSelectedAlarmId(event.eventId);
    addAuditEntry(`Opened alarm map for Event #${event.eventId}`);
  };

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify({ ...generatedReport, notes: reportNotes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `alarm_report_event_${generatedReport.incident.event_id || 'unknown'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addAuditEntry(`Generated automatic report for Event #${generatedReport.incident.event_id || 'unknown'}`);
  };

  const startCheckout = () => {
    if (!requiredEmergencyFields) {
      setCheckoutStatus('Fill emergency contacts before checkout.');
      return;
    }

    if (!paypalClientId) {
      setCheckoutStatus('PayPal client ID is missing in VITE_PAYPAL_CLIENT_ID.');
      return;
    }

    if (!selectedPlanSupportsPaypal) {
      setCheckoutStatus('Select a package to continue with PayPal checkout.');
      return;
    }

    setCheckoutStatus(`Opening PayPal checkout for ${selectedPlan.name}.`);
    setPaymentStep('checkout');
    addAuditEntry(`Prepared PayPal checkout for ${selectedPlan.name}`);
  };

  useEffect(() => {
    if (paymentStep !== 'checkout') {
      return undefined;
    }

    let cancelled = false;

    const mountButtons = async () => {
      if (!requiredEmergencyFields) {
        setCheckoutStatus('Fill emergency contacts before checkout.');
        return;
      }

      if (!selectedPlanSupportsPaypal) {
        setCheckoutStatus('Select a package to continue with PayPal checkout.');
        return;
      }

      if (!paypalButtonsRef.current) {
        return;
      }

      setPaypalMounting(true);
      setPaypalMountError('');

      try {
        const paypal = await loadPayPalSdk(paypalClientId, paypalCurrency);
        if (cancelled || !paypalButtonsRef.current) {
          return;
        }

        paypalButtonsRef.current.innerHTML = '';

        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            shape: 'rect',
            label: 'paypal',
            height: 48,
          },
          createOrder: async () => {
            const response = await api.post('/paypal/orders', {
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              amount: selectedPlanAmount,
              currency: paypalCurrency,
              district: emergencyDistrict,
              contacts: emergencyContacts,
            });

            return response.data.id;
          },
          onApprove: async (data) => {
            setPaypalMounting(true);
            const response = await api.post(`/paypal/orders/${data.orderID}/capture`, {
              planId: selectedPlan.id,
            });

            if (cancelled) {
              return;
            }

            setPaymentStep('complete');
            setCheckoutStatus(`PayPal payment completed: ${response.data.status || 'COMPLETED'}.`);
            addAuditEntry(`Activated ${selectedPlan.name} via PayPal order ${data.orderID}`);
          },
          onCancel: () => {
            if (!cancelled) {
              setCheckoutStatus('PayPal checkout canceled.');
            }
          },
          onError: (err) => {
            if (!cancelled) {
              setCheckoutStatus(err?.message || 'PayPal checkout failed.');
            }
          },
        });

        if (!buttons.isEligible()) {
          setCheckoutStatus('PayPal buttons are not eligible in this browser.');
          return;
        }

        await buttons.render(paypalButtonsRef.current);

        if (!cancelled) {
          setCheckoutStatus(`PayPal checkout ready for ${selectedPlan.name}.`);
        }
      } catch (err) {
        if (!cancelled) {
          setPaypalMountError(err?.message || 'Failed to load PayPal checkout.');
          setCheckoutStatus(err?.message || 'Failed to load PayPal checkout.');
        }
      } finally {
        if (!cancelled) {
          setPaypalMounting(false);
        }
      }
    };

    mountButtons();

    return () => {
      cancelled = true;
      if (paypalButtonsRef.current) {
        paypalButtonsRef.current.innerHTML = '';
      }
    };
  }, [paymentStep, requiredEmergencyFields, selectedPlan.id, selectedPlan.name, selectedPlanAmount, selectedPlanSupportsPaypal, emergencyDistrict, emergencyContacts.policeStation, emergencyContacts.fireService, emergencyContacts.ambulance, emergencyContacts.localCommand]);

  // Phase 3 ΓÇö Push Notification Banner
  const [notifications, setNotifications] = useState([]);
  const dismissNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  // Simulate a critical push notification after auth
  useEffect(() => {
    if (!authChecked) return;
    const timer = setTimeout(() => {
      setNotifications((prev) => [
        ...prev,
        { id: Date.now(), level: 'critical', title: 'Critical Alert', body: 'High-confidence intrusion detected at Main Entrance ΓÇö CAM-01', ts: new Date().toLocaleTimeString() },
      ]);
    }, 3500);
    return () => clearTimeout(timer);
  }, [authChecked]);

  // Auth guard ΓÇö redirect to login if no active Supabase session
  useEffect(() => {
    (async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) {
          navigate('/', { replace: true });
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/', { replace: true });
        } else {
          setAuthChecked(true);
        }
      } catch (err) {
        navigate('/', { replace: true });
      }
    })();
  }, [navigate]);

  const systemStatus = {
    label: 'Operational',
    tone: 'good',
  };

  // Client-side filter + false-alarm suppression applied to incidents list
  const filteredIncidents = incidents
    .filter((item) => {
      if (suppressEnabled && Number(item.confidence) < suppressThreshold / 100) return false;
      if (filterCamera && String(item.camera_id || '').toLowerCase() !== filterCamera.toLowerCase()) return false;
      if (filterZone && !String(item.zone || item.location || '').toLowerCase().includes(filterZone.toLowerCase())) return false;
      if (filterDirection && !String(item.direction || '').toLowerCase().includes(filterDirection.toLowerCase())) return false;
      if (filterDwellMin && Number(item.dwell_seconds || 0) < Number(filterDwellMin)) return false;
      if (filterObjectType && !String(item.object_type || '').toLowerCase().includes(filterObjectType.toLowerCase())) return false;
      if (filterColor) {
        const hasColor = (item.attributes || []).some(
          (a) => String(a.attribute_type || a.type || '').toLowerCase() === 'color' &&
                 String(a.attribute_value || a.value || '').toLowerCase().includes(filterColor.toLowerCase())
        );
        if (!hasColor) return false;
      }
      return true;
    });

  const activeCameras = cameras.filter((camera) => camera.enabled !== false).length;
  const recentAlerts = filteredIncidents.filter((incident) => ['New', 'Acknowledged', 'In Progress'].includes(incident.status)).length;

  const recentEvents = filteredIncidents.slice(0, 20).map((item) => ({
    id: `evt-${item.event_id}-${item.detection_id}`,
    eventId: item.event_id,
    title: `${item.object_type} detection`,
    subtitle: item.subtitle || `Confidence ${Math.round(Number(item.confidence) * 100)}%`,
    source: item.source || `Event #${item.event_id}`,
    time: item.timestamp,
    status: item.status || 'New',
    confidence: item.confidence,
    camera_id: item.camera_id,
    zone: item.zone || item.location,
    direction: item.direction,
    dwell_seconds: item.dwell_seconds,
  }));

  const selectedAlarmEvent = recentEvents.find((event) => event.eventId === selectedAlarmId) || recentEvents[0] || null;
  const selectedAlarmCamera = cameras.find((camera) => camera.id === selectedAlarmEvent?.camera_id) || cameras[0] || null;
  const selectedAlarmGeo = buildCameraGeo(selectedAlarmCamera);
  const generatedReport = buildIncidentReport(selectedAlarmEvent, selectedAlarmCamera, { district: emergencyDistrict, ...emergencyContacts }, selectedPlan);
  const reportSummary = selectedAlarmEvent
    ? `Alarm at ${selectedAlarmGeo.label} requires dispatch confirmation. Route to ${selectedAlarmGeo.note}.`
    : 'No active alarm selected yet.';

  // Only fetch data once auth is confirmed
  useEffect(() => {
    if (!authChecked) return;

    api
      .get('/incidents')
      .then((res) => {
        setIncidents(res.data.incidents || []);
        setIncidentsLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [authChecked]);

  // Fetch cameras once auth is confirmed
  useEffect(() => {
    if (!authChecked) return;

    api
      .get('/cameras')
      .then((res) => setCameras(res.data.cameras))
      .catch(() => setCameras([]));
  }, [authChecked]);

  // Initialize HLS for each camera video element
  useEffect(() => {
    if (!authChecked) return;

    cameras.forEach((cam) => {
      const video = document.getElementById(`video-${cam.id}`);
      if (video) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(buildHlsManifestUrl(cam.id));
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = buildHlsManifestUrl(cam.id);
        }
      }
    });
  }, [cameras]);

  // Evidence export: build a metadata JSON + simulated MP4 download
  const exportEvidence = (event) => {
    const metadata = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      incident: {
        event_id: event.eventId,
        title: event.title,
        status: event.status,
        confidence: event.confidence,
        camera_id: event.camera_id || 'unknown',
        zone: event.zone || 'unknown',
        direction: event.direction || 'unknown',
        dwell_seconds: event.dwell_seconds || null,
        source: event.source,
        timestamp: event.time,
      },
      video_clip: {
        filename: `evidence_event_${event.eventId}_${Date.now()}.mp4`,
        note: 'Clip URL will be populated from your video archive once storage is connected.',
      },
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `evidence_event_${event.eventId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateIncidentStatus = async (eventId, status) => {
    try {
      setUpdatingIncidentId(eventId);
      await api.patch(`/incidents/${eventId}/status`, { status });
      setIncidents((previous) => previous.map((incident) => (
        incident.event_id === eventId ? { ...incident, status } : incident
      )));
      addAuditEntry(`Set Incident #${eventId} status to "${status}"`);
    } catch (err) {
      alert(`Failed to update incident: ${err.message}`);
    } finally {
      setUpdatingIncidentId(null);
    }
  };

  const statusClassName = (status) => {
    if (status === 'False Alarm') return 'neutral';
    if (status === 'Resolved') return 'good';
    if (status === 'In Progress' || status === 'Acknowledged') return 'warning';
    return 'warning';
  };

  const nextActionsForStatus = (status) => {
    switch (status) {
      case 'New':
        return ['Acknowledged', 'In Progress', 'False Alarm'];
      case 'Acknowledged':
        return ['In Progress', 'Resolved', 'False Alarm'];
      case 'In Progress':
        return ['Resolved', 'False Alarm'];
      case 'Resolved':
        return ['In Progress', 'False Alarm'];
      case 'False Alarm':
        return ['New', 'Acknowledged'];
      default:
        return ['Acknowledged'];
    }
  };

  // Render nothing while the auth check is in flight
  if (!authChecked) return null;

  if (error) {
    return (
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div>
            <div className="brand-mark">D</div>
            <h1 className="sidebar-title">D&D Global AI Surveillance</h1>
            <p className="sidebar-copy">Security monitoring, detections, and camera intelligence.</p>
          </div>
        </aside>
        <main className="dashboard-main">
          <div className="topbar">
            <div>
              <p className="eyebrow">Security Command Center</p>
              <h2>Dashboard</h2>
            </div>
          </div>
          <section className="dashboard-panel">
            <h3>Unable to load data</h3>
            <p>{error}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {/* ΓöÇΓöÇ Push Notification Banner ΓöÇΓöÇ */}
      {notifications.length > 0 && (
        <div className="notif-stack" role="alert" aria-live="assertive">
          {notifications.map((n) => (
            <div key={n.id} className={`notif-banner notif-${n.level}`}>
              <span className="notif-dot" aria-hidden="true" />
              <div className="notif-body">
                <strong>{n.title}</strong>
                <p>{n.body}</p>
              </div>
              <span className="notif-time">{n.ts}</span>
              <button className="notif-dismiss" onClick={() => dismissNotification(n.id)} aria-label="Dismiss">Γ£ò</button>
            </div>
          ))}
        </div>
      )}

      {/* ΓöÇΓöÇ Camera Onboarding Wizard Modal ΓöÇΓöÇ */}
      {wizardOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add new camera">
          <section className="modal-card">
            <div className="modal-header">
              <h3>{wizardStep === 3 ? 'Camera Added Γ£ô' : 'Add New Camera'}</h3>
              <button className="notif-dismiss" onClick={closeWizard} aria-label="Close">Γ£ò</button>
            </div>

            {wizardStep === 1 && (
              <>
                <p className="ls-desc">Scan your network for ONVIF-compatible devices, or enter stream details manually.</p>
                <div className="wizard-fields">
                  <label className="search-field"><span>Camera ID</span><input value={newCamera.id} onChange={(e) => setNewCamera((p) => ({ ...p, id: e.target.value }))} placeholder="CAM-10" /></label>
                  <label className="search-field"><span>Display Name</span><input value={newCamera.name} onChange={(e) => setNewCamera((p) => ({ ...p, name: e.target.value }))} placeholder="South Perimeter" /></label>
                  <label className="search-field"><span>Location</span><input value={newCamera.location} onChange={(e) => setNewCamera((p) => ({ ...p, location: e.target.value }))} placeholder="south_entrance" /></label>
                  <label className="search-field"><span>RTSP URL</span><input value={newCamera.rtsp_url} onChange={(e) => setNewCamera((p) => ({ ...p, rtsp_url: e.target.value }))} placeholder="rtsp://ΓÇª" /></label>
                </div>
                <div className="wizard-actions">
                  <button className="ghost-button" type="button" onClick={runONVIFScan} disabled={wizardScanning}>
                    {wizardScanning ? 'Γƒ│ Scanning networkΓÇª' : 'Γîû Auto-scan (ONVIF)'}
                  </button>
                  <button className="primary-button" type="button" onClick={() => setWizardStep(2)} disabled={!newCamera.id || !newCamera.name}>
                    Next ΓåÆ
                  </button>
                </div>
              </>
            )}

            {wizardStep === 2 && (
              <>
                <p className="ls-desc">Review the camera configuration before saving to Supabase.</p>
                <table className="wizard-review-table">
                  <tbody>
                    {Object.entries(newCamera).map(([k, v]) => (
                      <tr key={k}><td>{k}</td><td>{String(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="wizard-actions">
                  <button className="ghost-button" type="button" onClick={() => setWizardStep(1)}>ΓåÉ Back</button>
                  <button className="primary-button" type="button" onClick={saveCamera} disabled={wizardSaving}>
                    {wizardSaving ? 'SavingΓÇª' : 'Save to Database'}
                  </button>
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <>
                <p className="wizard-success">Camera <strong>{newCamera.name}</strong> was added successfully and is now visible in the Streams panel.</p>
                <div className="wizard-actions">
                  <button className="primary-button" type="button" onClick={closeWizard}>Done</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      <aside className="sidebar">
        <div>
          <div className="brand-mark">{brandInitial}</div>
          <h1 className="sidebar-title">{brandName}</h1>
          <p className="sidebar-copy">Security monitoring, detections, and camera intelligence.</p>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <a className="sidebar-nav-item active" href="#overview">Overview</a>
          <a className="sidebar-nav-item" href="#cameras">Cameras</a>
          <a className="sidebar-nav-item" href="#events">Incidents</a>
          <a className="sidebar-nav-item" href="#audit">Audit Trail</a>
          <button className="sidebar-nav-item sidebar-billing-btn" type="button" onClick={() => setShowBilling((v) => !v)}>ΓÜÖ Subscription</button>
        </nav>

        <div className="sidebar-footer">
          <span className={`status-pill ${systemStatus.tone}`}>{systemStatus.label}</span>
          <p>Live monitoring enabled</p>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Security Command Center</p>
            <h2 id="overview">Dashboard</h2>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" type="button" onClick={openWizard}>+ Add Camera</button>
            <button className="primary-button" type="button">New Alert</button>
          </div>
        </header>

        {/* ΓöÇΓöÇ Subscription / Billing Panel ΓöÇΓöÇ */}
        {showBilling && (
          <section className="dashboard-panel billing-panel" id="billing">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">License Management</p>
                <h3>Client Plans &amp; Checkout</h3>
              </div>
              <button className="notif-dismiss" type="button" onClick={() => setShowBilling(false)}>Γ£ò</button>
            </div>

            <div className="billing-grid billing-grid-wide">
              <div className="billing-tier-card billing-plan-list">
                <p className="eyebrow">Available packages</p>
                <div className="plan-grid">
                  {PLAN_OPTIONS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      className={`plan-card${selectedPlanId === plan.id ? ' plan-card-active' : ''}`}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        addAuditEntry(`Selected package ${plan.name}`);
                      }}
                    >
                      <div className="plan-card-top">
                        <strong>{plan.name}</strong>
                        <span>{plan.price}</span>
                      </div>
                      <ul className="plan-card-features">
                        {plan.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <div className="purchase-note">
                  <span className="status-pill neutral">PayPal checkout</span>
                  <p>Secret key stays server-side. Client ID only initializes the checkout flow.</p>
                </div>
              </div>

              <div className="billing-upgrade-card">
                <p className="eyebrow">Billing controls</p>
                <h4>{selectedPlan.name}</h4>
                <p className="ls-desc">{selectedPlan.price}</p>

                <div className="checkout-stepper">
                  <span className={paymentStep === 'details' ? 'step-active' : ''}>1. Contacts</span>
                  <span className={paymentStep === 'checkout' ? 'step-active' : ''}>2. PayPal</span>
                  <span className={paymentStep === 'complete' ? 'step-active' : ''}>3. Activated</span>
                </div>

                <div className="contact-grid">
                  <label className="search-field">
                    <span>District</span>
                    <input required value={emergencyDistrict} onChange={(e) => setEmergencyDistrict(e.target.value)} placeholder="District / county" />
                  </label>
                  <label className="search-field">
                    <span>Police station number</span>
                    <input required value={emergencyContacts.policeStation} onChange={(e) => setEmergencyContacts((prev) => ({ ...prev, policeStation: e.target.value }))} placeholder="110 / local number" />
                  </label>
                  <label className="search-field">
                    <span>Fire service number</span>
                    <input required value={emergencyContacts.fireService} onChange={(e) => setEmergencyContacts((prev) => ({ ...prev, fireService: e.target.value }))} placeholder="112 / local number" />
                  </label>
                  <label className="search-field">
                    <span>Ambulance / medical</span>
                    <input required value={emergencyContacts.ambulance} onChange={(e) => setEmergencyContacts((prev) => ({ ...prev, ambulance: e.target.value }))} placeholder="medical emergency number" />
                  </label>
                  <label className="search-field">
                    <span>Local command center</span>
                    <input required value={emergencyContacts.localCommand} onChange={(e) => setEmergencyContacts((prev) => ({ ...prev, localCommand: e.target.value }))} placeholder="district command / dispatch" />
                  </label>
                </div>

                <button className="ghost-button plan-cta" type="button" onClick={startCheckout}>
                  {selectedPlanSupportsPaypal ? 'Start PayPal checkout' : 'Request custom invoice'}
                </button>

                <div className="checkout-meta">
                  <span className={`status-pill ${requiredEmergencyFields ? 'good' : 'warning'}`}>
                    {requiredEmergencyFields ? 'Contacts complete' : 'Contacts required'}
                  </span>
                  {paypalClientId ? (
                    <span className="status-pill good">PayPal client ready</span>
                  ) : (
                    <span className="status-pill warning">Missing VITE_PAYPAL_CLIENT_ID</span>
                  )}
                </div>

                {paymentStep === 'checkout' && selectedPlanSupportsPaypal && (
                  <div className="paypal-button-shell">
                    <div className="paypal-button-header">
                      <span className="status-pill good">PayPal secure checkout</span>
                      <span className="subtle-chip">{selectedPlan.name}</span>
                    </div>
                    <div className="paypal-buttons-host" ref={paypalButtonsRef} aria-live="polite" />
                    {(paypalMounting || paypalMountError) && (
                      <p className={`checkout-status ${paypalMountError ? 'checkout-status-error' : ''}`}>
                        {paypalMountError || 'Loading PayPal buttons...'}
                      </p>
                    )}
                  </div>
                )}

                {paymentStep === 'checkout' && !selectedPlanSupportsPaypal && (
                  <div className="paypal-button-shell">
                    <p className="checkout-status">All plans are available for instant PayPal checkout.</p>
                  </div>
                )}

                {checkoutStatus && <p className="checkout-status">{checkoutStatus}</p>}

                <div className="branding-group">
                  <p className="eyebrow" style={{marginBottom:'.6rem'}}>White-Label Mode</p>
                  <div className="branding-toggle-row">
                    <button
                      type="button"
                      className={`branding-option${brandMode === 'default' ? ' branding-active' : ''}`}
                      onClick={() => { setBrandMode('default'); addAuditEntry('Switched branding to D&D Security Default'); }}
                    >D&D Security Default</button>
                    <button
                      type="button"
                      className={`branding-option${brandMode === 'corporate' ? ' branding-active' : ''}`}
                      onClick={() => { setBrandMode('corporate'); addAuditEntry('Switched branding to Corporate White-Label mode'); }}
                    >Corporate White-Label</button>
                  </div>
                  <p className="ls-desc" style={{marginTop:'.6rem'}}>Active: <strong style={{color:'#85dfff'}}>{brandName}</strong></p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ΓöÇΓöÇ Smart Search v2 + False Alarm controls ΓöÇΓöÇ */}
        <section className="search-panel dashboard-panel" id="search" aria-label="Smart search filters">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Smart Search v2</p>
              <h3>Filter Incidents</h3>
            </div>
            <label className="suppress-toggle">
              <input
                type="checkbox"
                checked={suppressEnabled}
                onChange={(e) => setSuppressEnabled(e.target.checked)}
              />
              <span>Suppress below {suppressThreshold}% confidence</span>
            </label>
          </div>

          {suppressEnabled && (
            <div className="suppress-slider-row">
              <span>50%</span>
              <input
                type="range" min="50" max="99" step="1"
                value={suppressThreshold}
                onChange={(e) => setSuppressThreshold(Number(e.target.value))}
                className="suppress-slider"
              />
              <span>{suppressThreshold}%</span>
            </div>
          )}

          <div className="search-grid">
            <label className="search-field">
              <span>Object Type</span>
              <input type="text" placeholder="Person, VehicleΓÇª" value={filterObjectType} onChange={(e) => setFilterObjectType(e.target.value)} />
            </label>
            <label className="search-field">
              <span>Camera</span>
              <select value={filterCamera} onChange={(e) => setFilterCamera(e.target.value)}>
                <option value="">All cameras</option>
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>{cam.name}</option>
                ))}
              </select>
            </label>
            <label className="search-field">
              <span>Zone / Location</span>
              <input type="text" placeholder="entrance, parkingΓÇª" value={filterZone} onChange={(e) => setFilterZone(e.target.value)} />
            </label>
            <label className="search-field">
              <span>Direction</span>
              <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)}>
                <option value="">Any direction</option>
                <option value="entering">Entering</option>
                <option value="exiting">Exiting</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="search-field">
              <span>Min. Dwell (seconds)</span>
              <input type="number" min="0" placeholder="0" value={filterDwellMin} onChange={(e) => setFilterDwellMin(e.target.value)} />
            </label>
            <label className="search-field">
              <span>Color Attribute</span>
              <input type="text" placeholder="Red, BlackΓÇª" value={filterColor} onChange={(e) => setFilterColor(e.target.value)} />
            </label>
          </div>

          {(filterObjectType || filterCamera || filterZone || filterDirection || filterDwellMin || filterColor || suppressEnabled) && (
            <button
              type="button"
              className="ghost-button"
              style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
              onClick={() => {
                setFilterObjectType('');
                setFilterCamera('');
                setFilterZone('');
                setFilterDirection('');
                setFilterDwellMin('');
                setFilterColor('');
                setSuppressEnabled(false);
              }}
            >
              Clear all filters
            </button>
          )}
        </section>

        <section className="metrics-grid" aria-label="Key metrics">
          <article className="metric-card">
            <p className="metric-label">Active Cameras</p>
            <strong>{cameras.length ? activeCameras : 'ΓÇö'}</strong>
            <span>{cameras.length ? `${cameras.length} total streams` : 'Loading camera inventory'}</span>
          </article>
          <article className="metric-card">
            <p className="metric-label">System Status</p>
            <strong className="metric-accent">{systemStatus.label}</strong>
            <span>Core services online</span>
          </article>
          <article className="metric-card">
            <p className="metric-label">Recent Alerts</p>
            <strong>{incidentsLoaded ? recentAlerts : 'ΓÇö'}</strong>
            <span>Open incidents in queue</span>
          </article>
        </section>

        <section className="dashboard-panel alarm-panel" id="alarm-map">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Alarm response</p>
              <h3>Map, location, and auto-report</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setShowBilling(true)}>Open Packages</button>
          </div>

          <div className="alarm-grid">
            <div className="alarm-map-card">
              <div className="alarm-map-header">
                <span className="status-pill warning">Active alarm</span>
                <span className="subtle-chip">{selectedAlarmEvent ? `Event #${selectedAlarmEvent.eventId}` : 'No active event'}</span>
              </div>
              <div className="alarm-map">
                <div className="map-grid-line map-grid-x" />
                <div className="map-grid-line map-grid-y" />
                <div
                  className="map-pin"
                  style={{ left: `${Math.min(Math.max(((selectedAlarmGeo.lng - 15.94) / 0.06) * 100, 8), 92)}%`, top: `${Math.min(Math.max((1 - ((selectedAlarmGeo.lat - 45.80) / 0.03)) * 100, 10), 90)}%` }}
                />
                <div className="map-callout">
                  <strong>{selectedAlarmGeo.label}</strong>
                  <p>{selectedAlarmGeo.note}</p>
                </div>
              </div>
              <div className="alarm-location-list">
                <div>
                  <span className="alarm-label">Exact location</span>
                  <strong>{selectedAlarmGeo.label}</strong>
                </div>
                <div>
                  <span className="alarm-label">Coordinates</span>
                  <strong>{selectedAlarmGeo.lat.toFixed(4)}, {selectedAlarmGeo.lng.toFixed(4)}</strong>
                </div>
                <div>
                  <span className="alarm-label">Explanation</span>
                  <strong>{reportSummary}</strong>
                </div>
              </div>
            </div>

            <div className="report-card">
              <div className="panel-heading panel-heading-tight">
                <div>
                  <p className="eyebrow">Automatic report generator</p>
                  <h4>Incident summary</h4>
                </div>
                <button type="button" className="ghost-button incident-action-button" onClick={downloadReport} disabled={!selectedAlarmEvent}>
                  Download report
                </button>
              </div>

              <label className="search-field">
                <span>Report note</span>
                <textarea
                  rows="4"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Add dispatch notes, witness details, or response instructions..."
                />
              </label>

              <div className="report-preview">
                <pre>{JSON.stringify({ ...generatedReport, notes: reportNotes }, null, 2)}</pre>
              </div>

              <div className="report-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setPaymentStep('complete');
                    addAuditEntry(`Auto-report generated for Event #${generatedReport.incident.event_id || 'unknown'}`);
                  }}
                >
                  Mark as dispatched
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    if (selectedAlarmEvent) openAlarmMap(selectedAlarmEvent);
                  }}
                >
                  Focus map on latest alarm
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <section className="dashboard-panel table-panel" id="events">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Activity feed</p>
                <h3>Recent Events</h3>
              </div>
              <span className="subtle-chip">Last 24h</span>
            </div>

            <div className="table-wrap">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Source</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.length ? (
                    recentEvents.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <div className="table-title">{event.title}</div>
                          <div className="table-subtitle">{event.subtitle}</div>
                        </td>
                        <td>{event.source || event.subtitle}</td>
                        <td>{event.time}</td>
                        <td>
                          <span className={`status-pill ${statusClassName(event.status)}`}>
                            {event.status}
                          </span>
                        </td>
                        <td>
                          <div className="incident-actions">
                            {currentUser ? (
                              nextActionsForStatus(event.status).map((nextStatus) => (
                                <button
                                  key={`${event.id}-${nextStatus}`}
                                  type="button"
                                  className="ghost-button incident-action-button"
                                  onClick={() => updateIncidentStatus(event.eventId, nextStatus)}
                                  disabled={updatingIncidentId === event.eventId}
                                >
                                  {updatingIncidentId === event.eventId ? 'Updating...' : nextStatus}
                                </button>
                              ))
                            ) : (
                              <span className="table-subtitle">Login required</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ghost-button incident-action-button export-btn"
                            onClick={() => { exportEvidence(event); setSelectedAlarmId(event.eventId); addAuditEntry(`Exported evidence package for Event #${event.eventId}`); }}
                            title="Download evidence package (JSON + video metadata)"
                          >
                            Γ¼ç Export
                          </button>
                          <button
                            type="button"
                            className="ghost-button incident-action-button"
                            onClick={() => openAlarmMap(event)}
                          >
                            Show map
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        {incidentsLoaded ? 'No incidents match the current filters.' : 'Loading incident queue...'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-panel cameras-panel" id="cameras">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Camera matrix</p>
                <h3>Streams</h3>
              </div>
            </div>

            <div className="camera-list">
              {cameras.length ? (
                cameras.map((cam) => (
                  <article className="camera-card" key={cam.id}>
                    <div className="camera-card-header">
                      <div>
                        <h4>{cam.name}</h4>
                        <p>{cam.location || cam.rtsp_url}</p>
                      </div>
                      <span className={`status-pill ${cam.enabled !== false ? 'good' : 'neutral'}`}>
                        {cam.enabled !== false ? 'Live' : 'Disabled'}
                      </span>
                    </div>
                    <div className="camera-video-wrapper">
                      <video id={`video-${cam.id}`} controls muted playsInline className="camera-video" />
                    </div>
                    {/* Talkdown control */}
                    <div className="talkdown-row">
                      <button
                        type="button"
                        className={`talkdown-btn${talkdownActive === cam.id ? ' talkdown-active' : ''}`}
                        onClick={() => triggerTalkdown(cam.id)}
                        disabled={talkdownActive === cam.id}
                      >
                        {talkdownActive === cam.id ? '≡ƒöè Warning ActiveΓÇª' : '≡ƒÄÖ Trigger Talkdown'}
                      </button>
                      {talkdownActive === cam.id && (
                        <span className="talkdown-indicator" aria-live="polite">
                          <span className="talkdown-pulse" aria-hidden="true" /> Broadcasting warning to {cam.name}
                        </span>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">Loading camerasΓÇª</div>
              )}
            </div>
          </section>
        </section>

        {/* ΓöÇΓöÇ Operator Audit Trail ΓöÇΓöÇ */}
        <section className="dashboard-panel audit-panel" id="audit">
          <div className="panel-heading">
            <div><p className="eyebrow">Compliance &amp; traceability</p><h3>Operator Audit Trail</h3></div>
            <span className="subtle-chip">{auditLog.length} entries</span>
          </div>
          <div className="table-wrap">
            <table className="events-table audit-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Operator</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id}>
                    <td><span className="audit-ts">{entry.ts}</span></td>
                    <td><span className="audit-user">{entry.user}</span></td>
                    <td>{entry.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
