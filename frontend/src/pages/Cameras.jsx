import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PAGE_CSS = `
  .cameras-page { padding: 2rem; color: #e5eef7; }
  .cameras-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .cameras-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .add-cam-btn { background: linear-gradient(135deg,#00d4ff,#8c4dff); color: #03101c; border: none; padding: .8rem 1.5rem; border-radius: 10px; font-family: 'Orbitron', sans-serif; font-size: .8rem; text-transform: uppercase; letter-spacing: .1em; cursor: pointer; }
  .cameras-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
  .camera-card { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; overflow: hidden; transition: all .2s; }
  .camera-card:hover { border-color: rgba(0,212,255,.5); transform: translateY(-4px); }
  .camera-preview { height: 180px; background: #000; display: flex; align-items: center; justify-content: center; position: relative; }
  .camera-placeholder { font-size: 3rem; color: #6a8aaa; }
  .camera-status { position: absolute; top: .75rem; right: .75rem; padding: .25rem .6rem; border-radius: 10px; font-size: .7rem; font-weight: bold; }
  .status-online { background: rgba(0,212,80,.8); color: white; }
  .status-offline { background: rgba(255,80,80,.8); color: white; }
  .camera-info { padding: 1rem; }
  .camera-info h4 { color: #dff7ff; margin-bottom: .5rem; display: flex; align-items: center; gap: .5rem; }
  .camera-meta { display: flex; flex-wrap: wrap; gap: .75rem; color: #8ab0c9; font-size: .8rem; }
  .camera-meta span { display: flex; align-items: center; gap: .25rem; }
  .camera-actions { display: flex; gap: .5rem; padding: 1rem; padding-top: 0; }
  .cam-btn { flex: 1; padding: .6rem; border: none; border-radius: 8px; font-size: .8rem; cursor: pointer; transition: all .2s; }
  .cam-btn-primary { background: linear-gradient(135deg,#00d4ff,#8c4dff); color: #03101c; font-weight: bold; }
  .cam-btn-secondary { background: rgba(87,125,196,.2); color: #8ab0c9; }
  .cam-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .empty-cameras { text-align: center; padding: 4rem; background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; }
  .empty-cameras h3 { color: #dff7ff; margin-bottom: 1rem; }
  .empty-cameras p { color: #8ab0c9; margin-bottom: 1.5rem; }
  .demo-section { background: rgba(0,212,255,.05); border: 2px solid rgba(0,212,255,.2); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; }
  .demo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .demo-title { color: #00d4ff; font-family: 'Orbitron', sans-serif; font-size: 1rem; display: flex; align-items: center; gap: .5rem; }
  .demo-badge { background: rgba(0,212,80,.2); color: #00d450; padding: .25rem .75rem; border-radius: 20px; font-size: .75rem; font-weight: bold; }
  .demo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .demo-card { background: rgba(10,18,38,.95); border: 1px solid rgba(87,140,255,.18); border-radius: 12px; overflow: hidden; transition: all .2s; }
  .demo-card:hover { border-color: rgba(0,212,255,.5); }
  .demo-preview { position: relative; height: 160px; background: #000; }
  .demo-preview iframe { width: 100%; height: 100%; border: none; }
  .demo-live { position: absolute; top: .5rem; left: .5rem; background: rgba(255,50,50,.9); color: white; padding: .2rem .5rem; border-radius: 4px; font-size: .65rem; font-weight: bold; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }
  .demo-info { padding: .75rem; }
  .demo-info h5 { color: #dff7ff; font-size: .9rem; margin-bottom: .25rem; }
  .demo-info p { color: #6a8aaa; font-size: .75rem; display: flex; align-items: center; gap: .25rem; }
  .webcam-stream { width: 100%; height: 100%; object-fit: cover; }
`;

// PUBLIC LIVE WEBCAMS FOR TESTING
const PUBLIC_WEBCAMS = [
  {
    id: 'pub-nyc',
    name: 'Times Square NYC',
    location: 'New York, USA',
    type: 'image',
    url: 'https://images.webcams.travel/preview/1203281713.jpg',
    link: 'https://www.nycwebcams.com'
  },
  {
    id: 'pub-vegas',
    name: 'Las Vegas Strip',
    location: 'Las Vegas, NV',
    type: 'image',
    url: 'https://www.travelwebcam.com/cams/live/lasvegas/img.jpg',
    link: 'https://www.lvstripwebcam.com'
  },
  {
    id: 'pub-tokyo',
    name: 'Shinjuku Tokyo',
    location: 'Tokyo, Japan',
    type: 'image',
    url: 'https://tokyo-g.jp/cdn/webcam.jpg',
    link: 'https://tokyo.webcams.travel'
  },
  {
    id: 'pub-london',
    name: 'London Eye',
    location: 'London, UK',
    type: 'image',
    url: 'https://london-webcam.net/live.jpg',
    link: 'https://www.londonwebcam.net'
  },
  {
    id: 'pub-dubai',
    name: 'Dubai Marina',
    location: 'Dubai, UAE',
    type: 'image',
    url: 'https://dubai-cam.com/live.jpg',
    link: 'https://www.dubaiwebcams.com'
  },
  {
    id: 'pub-paris',
    name: 'Eiffel Tower',
    location: 'Paris, France',
    type: 'image',
    url: 'https://pariswebcam.fr/eiffel.jpg',
    link: 'https://pariswebcams.com'
  }
];

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCamera, setNewCamera] = useState({
    name: '',
    stream_url: '',
    location: '',
    lat: '',
    lng: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const res = await api.get('/cameras');
      setCameras(res.data.cameras || []);
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCamera = async () => {
    if (!newCamera.name) {
      setError('Camera name is required');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const res = await api.post('/cameras', {
        name: newCamera.name,
        stream_url: newCamera.stream_url || null,
        location: newCamera.location || null,
        lat: newCamera.lat ? parseFloat(newCamera.lat) : null,
        lng: newCamera.lng ? parseFloat(newCamera.lng) : null
      });
      
      setCameras([...cameras, res.data.camera]);
      setShowAddForm(false);
      setNewCamera({ name: '', stream_url: '', location: '', lat: '', lng: '' });
    } catch (err) {
      console.error('Failed to add camera:', err);
      setError('Failed to add camera. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: cameras.length,
    online: cameras.filter(c => c.enabled !== false).length,
    offline: cameras.filter(c => c.enabled === false).length
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="cameras-page">
        <div className="cameras-header">
          <h1 className="cameras-title">📷 Camera Management</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#00d450', fontSize: '.9rem' }}>✓ {stats.online} Online</span>
            <span style={{ color: '#ff5050', fontSize: '.9rem' }}>✗ {stats.offline} Offline</span>
            <button className="add-cam-btn" onClick={() => setShowAddForm(true)}>+ Add Camera</button>
          </div>
        </div>

        {/* PUBLIC WEBCAMS SECTION */}
        <div className="demo-section">
          <div className="demo-header">
            <div className="demo-title">
              🌐 Live Public Webcams
              <span className="demo-badge">REAL STREAMS</span>
            </div>
            <span style={{ color: '#6a8aaa', fontSize: '.8rem' }}>Test your monitoring system with live feeds</span>
          </div>
          <div className="demo-grid">
            {PUBLIC_WEBCAMS.map(webcam => (
              <div key={webcam.id} className="demo-card">
                <div className="demo-preview">
                  {webcam.type === 'youtube' ? (
                    <iframe 
                      src={webcam.url} 
                      title={webcam.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img 
                      src={webcam.url} 
                      alt={webcam.name}
                      className="webcam-stream"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50" x="25">📷</text></svg>';
                      }}
                    />
                  )}
                  <span className="demo-live">🔴 LIVE</span>
                </div>
                <div className="demo-info">
                  <h5>📹 {webcam.name}</h5>
                  <p>📍 {webcam.location}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: '#6a8aaa', fontSize: '.75rem', marginTop: '1rem', textAlign: 'center' }}>
            💡 These are public webcam streams. To add your own cameras, use the "+ Add Camera" button above.
          </p>
        </div>

        {showAddForm && (
          <div style={{ background: 'rgba(10,18,38,.95)', border: '1px solid rgba(0,212,255,.3)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ color: '#dff7ff', marginBottom: '1.5rem' }}>Add New Camera</h3>
            {error && <p style={{ color: '#ff5050', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Camera Name *"
                value={newCamera.name}
                onChange={(e) => setNewCamera({...newCamera, name: e.target.value})}
                style={{ padding: '.8rem', background: 'rgba(87,125,196,.1)', border: '1px solid rgba(87,125,196,.3)', borderRadius: '8px', color: '#dff7ff' }}
              />
              <input
                type="text"
                placeholder="Location (e.g., Entrance, Parking)"
                value={newCamera.location}
                onChange={(e) => setNewCamera({...newCamera, location: e.target.value})}
                style={{ padding: '.8rem', background: 'rgba(87,125,196,.1)', border: '1px solid rgba(87,125,196,.3)', borderRadius: '8px', color: '#dff7ff' }}
              />
              <input
                type="text"
                placeholder="Stream URL (rtsp://...)"
                value={newCamera.stream_url}
                onChange={(e) => setNewCamera({...newCamera, stream_url: e.target.value})}
                style={{ padding: '.8rem', background: 'rgba(87,125,196,.1)', border: '1px solid rgba(87,125,196,.3)', borderRadius: '8px', color: '#dff7ff', gridColumn: '1 / -1' }}
              />
              <input
                type="number"
                placeholder="Latitude"
                value={newCamera.lat}
                onChange={(e) => setNewCamera({...newCamera, lat: e.target.value})}
                style={{ padding: '.8rem', background: 'rgba(87,125,196,.1)', border: '1px solid rgba(87,125,196,.3)', borderRadius: '8px', color: '#dff7ff' }}
              />
              <input
                type="number"
                placeholder="Longitude"
                value={newCamera.lng}
                onChange={(e) => setNewCamera({...newCamera, lng: e.target.value})}
                style={{ padding: '.8rem', background: 'rgba(87,125,196,.1)', border: '1px solid rgba(87,125,196,.3)', borderRadius: '8px', color: '#dff7ff' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="add-cam-btn" onClick={handleAddCamera} disabled={saving}>
                {saving ? 'Adding...' : 'Add Camera'}
              </button>
              <button 
                className="cam-btn cam-btn-secondary" 
                style={{ padding: '.8rem 1.5rem' }}
                onClick={() => { setShowAddForm(false); setError(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-cameras"><p>Loading cameras...</p></div>
        ) : cameras.length === 0 && !showAddForm ? (
          <div className="empty-cameras">
            <h3>No Cameras Configured</h3>
            <p>Add cameras to start monitoring your security zones.</p>
            <button className="add-cam-btn" style={{ marginTop: '1rem' }} onClick={() => setShowAddForm(true)}>+ Add First Camera</button>
          </div>
        ) : (
          <div className="cameras-grid">
            {cameras.map(camera => (
              <div key={camera.id} className="camera-card">
                <div className="camera-preview">
                  <div className="camera-placeholder">📹</div>
                  <span className={`camera-status ${camera.enabled !== false ? 'status-online' : 'status-offline'}`}>
                    {camera.enabled !== false ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="camera-info">
                  <h4>
                    <span>{camera.enabled !== false ? '🟢' : '🔴'}</span>
                    {camera.name}
                  </h4>
                  <div className="camera-meta">
                    <span>📍 {camera.location || 'No location'}</span>
                    {camera.fps && <span>⚡ {camera.fps} FPS</span>}
                    {camera.stream_url && <span>🔗 Stream active</span>}
                  </div>
                </div>
                <div className="camera-actions">
                  <button className="cam-btn cam-btn-secondary">Settings</button>
                  <button className="cam-btn cam-btn-primary">View Stream</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
