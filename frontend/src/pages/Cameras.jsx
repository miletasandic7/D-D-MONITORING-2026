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
`;

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

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
            <button className="add-cam-btn">+ Add Camera</button>
          </div>
        </div>

        {loading ? (
          <div className="empty-cameras"><p>Loading cameras...</p></div>
        ) : cameras.length === 0 ? (
          <div className="empty-cameras">
            <h3>No Cameras Configured</h3>
            <p>Add cameras to start monitoring your security zones.</p>
            <button className="add-cam-btn" style={{ marginTop: '1rem' }}>+ Add First Camera</button>
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
