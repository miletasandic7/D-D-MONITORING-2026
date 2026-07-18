import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PAGE_CSS = `
  .users-page { padding: 2rem; color: #e5eef7; }
  .users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .users-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .users-grid { display: grid; gap: 1rem; }
  .user-card { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .user-info { display: flex; align-items: center; gap: 1rem; }
  .user-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg,#00d4ff,#8c4dff); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
  .user-details h3 { color: #dff7ff; margin-bottom: .25rem; }
  .user-details p { color: #8ab0c9; font-size: .85rem; }
  .user-badge { padding: .3rem .8rem; border-radius: 20px; font-size: .75rem; text-transform: uppercase; letter-spacing: .05em; }
  .badge-admin { background: rgba(140,77,255,.2); color: #c580ff; border: 1px solid rgba(140,77,255,.4); }
  .badge-operator { background: rgba(0,212,255,.15); color: #00d4ff; border: 1px solid rgba(0,212,255,.3); }
  .badge-active { background: rgba(0,212,80,.15); color: #00d450; border: 1px solid rgba(0,212,80,.3); }
  .empty-state { text-align: center; padding: 3rem; color: #8ab0c9; }
`;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="users-page">
        <div className="users-header">
          <h1 className="users-title">User Management</h1>
        </div>

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found.</p>
            <p>Users will appear here after they log in for the first time.</p>
          </div>
        ) : (
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="user-details">
                    <h3>{user.name || user.email}</h3>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <span className={`user-badge badge-${user.user_type === 'org_admin' ? 'admin' : 'operator'}`}>
                    {user.user_type?.replace('_', ' ') || 'operator'}
                  </span>
                  <span className="user-badge badge-active">
                    {user.status || 'active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
