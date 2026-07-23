import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PAGE_CSS = `
  .users-page { padding: 2rem; color: #e5eef7; }
  .users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .users-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #dff5ff; }
  .add-btn { background: linear-gradient(135deg,#00d4ff,#8c4dff); border: none; color: white; padding: .75rem 1.5rem; border-radius: 12px; font-family: 'Orbitron', sans-serif; font-size: .9rem; cursor: pointer; transition: all .3s; }
  .add-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,212,255,.4); }
  .users-grid { display: grid; gap: 1rem; }
  .user-card { background: rgba(10,18,38,.85); border: 1px solid rgba(87,140,255,.18); border-radius: 16px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  .user-info { display: flex; align-items: center; gap: 1rem; }
  .user-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg,#00d4ff,#8c4dff); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
  .user-details h3 { color: #dff7ff; margin-bottom: .25rem; }
  .user-details p { color: #8ab0c9; font-size: .85rem; }
  .user-badge { padding: .3rem .8rem; border-radius: 20px; font-size: .75rem; text-transform: uppercase; letter-spacing: .05em; }
  .badge-admin { background: rgba(140,77,255,.2); color: #c580ff; border: 1px solid rgba(140,77,255,.4); }
  .badge-operator { background: rgba(0,212,255,.15); color: #00d4ff; border: 1px solid rgba(0,212,255,.3); }
  .badge-invited { background: rgba(255,165,0,.15); color: #ffa500; border: 1px solid rgba(255,165,0,.3); }
  .badge-active { background: rgba(0,212,80,.15); color: #00d450; border: 1px solid rgba(0,212,80,.3); }
  .empty-state { text-align: center; padding: 3rem; color: #8ab0c9; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal-content { background: rgba(10,18,38,.95); border: 1px solid rgba(87,140,255,.3); border-radius: 20px; padding: 2rem; width: 100%; max-width: 450px; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .modal-header h2 { font-family: 'Orbitron', sans-serif; font-size: 1.3rem; color: #dff5ff; margin: 0; }
  .modal-close { background: none; border: none; color: #8ab0c9; font-size: 1.5rem; cursor: pointer; padding: .25rem; }
  .modal-close:hover { color: #fff; }
  .form-group { margin-bottom: 1.5rem; }
  .form-group label { display: block; color: #8ab0c9; font-size: .85rem; margin-bottom: .5rem; }
  .form-group input, .form-group select { width: 100%; padding: .75rem 1rem; background: rgba(0,0,0,.3); border: 1px solid rgba(87,140,255,.3); border-radius: 10px; color: #e5eef7; font-size: 1rem; }
  .form-group input:focus, .form-group select:focus { outline: none; border-color: #00d4ff; }
  .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; }
  .btn-cancel { background: rgba(87,140,255,.2); border: 1px solid rgba(87,140,255,.4); color: #8ab0c9; padding: .75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: .9rem; }
  .btn-cancel:hover { background: rgba(87,140,255,.3); }
  .btn-invite { background: linear-gradient(135deg,#00d4ff,#8c4dff); border: none; color: white; padding: .75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: .9rem; font-family: 'Orbitron', sans-serif; }
  .btn-invite:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,212,255,.4); }
  .btn-invite:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .error-msg { color: #ff6b6b; font-size: .85rem; margin-top: 1rem; text-align: center; }
  .success-msg { color: #00d450; font-size: .9rem; margin-top: 1rem; text-align: center; padding: .75rem; background: rgba(0,212,80,.1); border-radius: 10px; }
  .instructions { background: rgba(0,0,0,.3); padding: 1rem; border-radius: 10px; margin-top: 1rem; font-size: .85rem; color: #8ab0c9; }
  .instructions ol { margin: .5rem 0 0 1.5rem; padding: 0; }
  .instructions li { margin-bottom: .5rem; }
`;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('operator');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

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

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowInstructions(false);
    setInviting(true);

    try {
      const res = await api.post('/users', { email, user_type: userType });

      if (res.data.success) {
        setSuccess(res.data.message || `Invitation sent to ${email}!`);
        setEmail('');
        setShowModal(false);
        fetchUsers(); // Refresh the list
      } else {
        setError(res.data.error || 'Failed to send invitation');
        
        // Check if we need instructions
        if (res.data.instructions) {
          setShowInstructions(true);
        }
      }
    } catch (err) {
      console.error('Invitation error:', err);
      
      if (err.response?.data?.instructions) {
        setError(err.response.data.error || 'Failed to send invitation');
        setShowInstructions(true);
      } else if (err.response?.status === 401) {
        setError('You must be logged in as Admin to invite users.');
      } else {
        const errData = err.response?.data;
        setError(
          typeof errData === 'string' ? errData : 
          errData?.error || errData?.message || err.message || 'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="users-page">
        <div className="users-header">
          <h1 className="users-title">User Management</h1>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Operator
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found.</p>
            <p>Click "Add Operator" to invite team members.</p>
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
                    <h3>{user.display_name || user.name || user.email}</h3>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <span className={`user-badge badge-${user.user_type === 'org_admin' ? 'admin' : 'operator'}`}>
                    {user.user_type?.replace('_', ' ') || 'operator'}
                  </span>
                  <span className={`user-badge badge-${user.status === 'invited' ? 'invited' : 'active'}`}>
                    {user.status || 'active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Operator Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Operator</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                  <option value="operator">Operator</option>
                  <option value="org_admin">Admin</option>
                </select>
              </div>

              {error && <p className="error-msg">{String(error)}</p>}
              {success && <p className="success-msg">{success}</p>}

              {showInstructions && (
                <div className="instructions">
                  <strong>How to enable user invitations:</strong>
                  <ol>
                    <li>Go to Supabase Dashboard → Project Settings → API</li>
                    <li>Find the "service_role" secret key</li>
                    <li>Add it as SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables</li>
                    <li>Redeploy your application</li>
                  </ol>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-invite" disabled={inviting}>
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
