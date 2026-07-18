import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PAGE_CSS = `
  .alerts-page { padding: 2rem; color: #e5eef7; }
  .alerts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .alerts-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .alert-stats { display: flex; gap: 1rem; }
  .stat-badge { padding: .5rem 1rem; border-radius: 20px; font-size: .85rem; font-weight: bold; }
  .stat-critical { background: rgba(255,80,80,.2); color: #ff5050; border: 1px solid rgba(255,80,80,.4); }
  .stat-warning { background: rgba(255,180,50,.2); color: #ffb432; border: 1px solid rgba(255,180,50,.4); }
  .stat-info { background: rgba(0,212,255,.15); color: #00d4ff; border: 1px solid rgba(0,212,255,.3); }
  .alerts-list { display: flex; flex-direction: column; gap: .75rem; }
  .alert-card { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 12px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: all .2s; }
  .alert-card:hover { border-color: rgba(0,212,255,.5); transform: translateX(4px); }
  .alert-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
  .alert-critical { background: rgba(255,80,80,.15); }
  .alert-warning { background: rgba(255,180,50,.15); }
  .alert-info { background: rgba(0,212,255,.15); }
  .alert-content { flex: 1; }
  .alert-content h4 { color: #dff7ff; margin-bottom: .2rem; font-size: .95rem; }
  .alert-content p { color: #8ab0c9; font-size: .8rem; }
  .alert-meta { display: flex; gap: 1rem; color: #6a8aaa; font-size: .75rem; margin-top: .3rem; }
  .alert-actions { display: flex; gap: .5rem; }
  .alert-btn { padding: .4rem .8rem; border-radius: 6px; font-size: .75rem; cursor: pointer; transition: all .2s; border: none; }
  .alert-btn-dismiss { background: rgba(87,125,196,.2); color: #8ab0c9; }
  .alert-btn-acknowledge { background: rgba(0,212,255,.2); color: #00d4ff; }
  .alert-btn:hover { filter: brightness(1.2); }
  .empty-alerts { text-align: center; padding: 4rem; background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; }
  .empty-alerts h3 { color: #dff7ff; margin-bottom: 1rem; }
  .empty-alerts p { color: #8ab0c9; }
`;

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/incidents');
      const allIncidents = res.data.incidents || [];
      // Convert incidents to alerts format
      const formattedAlerts = allIncidents.map(inc => ({
        id: inc.id,
        title: inc.title || 'Alert',
        message: inc.description || 'Security alert detected',
        severity: inc.severity || 'info',
        time: inc.created_at,
        camera: inc.camera_name,
        acknowledged: inc.status !== 'new'
      }));
      setAlerts(formattedAlerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getIcon = (severity) => {
    const icons = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
    return icons[severity] || icons.info;
  };

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
    info: alerts.filter(a => a.severity === 'info' && !a.acknowledged).length
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="alerts-page">
        <div className="alerts-header">
          <h1 className="alerts-title">🚨 Alerts & Notifications</h1>
          <div className="alert-stats">
            <span className="stat-badge stat-critical">{stats.critical} Critical</span>
            <span className="stat-badge stat-warning">{stats.warning} Warning</span>
            <span className="stat-badge stat-info">{stats.info} Info</span>
          </div>
        </div>

        {loading ? (
          <div className="empty-alerts"><p>Loading alerts...</p></div>
        ) : alerts.length === 0 ? (
          <div className="empty-alerts">
            <h3>No Active Alerts</h3>
            <p>All systems operating normally. Alerts will appear here when issues are detected.</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className="alert-card">
                <div className={`alert-icon alert-${alert.severity}`}>
                  {getIcon(alert.severity)}
                </div>
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  <div className="alert-meta">
                    <span>🕐 {alert.time ? new Date(alert.time).toLocaleString() : 'Unknown'}</span>
                    {alert.camera && <span>📷 {alert.camera}</span>}
                    {alert.acknowledged && <span style={{ color: '#00d450' }}>✓ Acknowledged</span>}
                  </div>
                </div>
                <div className="alert-actions">
                  {!alert.acknowledged && (
                    <button className="alert-btn alert-btn-acknowledge" onClick={() => acknowledgeAlert(alert.id)}>
                      Acknowledge
                    </button>
                  )}
                  <button className="alert-btn alert-btn-dismiss" onClick={() => dismissAlert(alert.id)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
