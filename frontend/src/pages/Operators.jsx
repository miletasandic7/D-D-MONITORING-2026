import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSupabaseClient } from '../services/supabaseClient';

const PAGE_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Space+Grotesk:wght@400;500;600&display=swap');
  .op-shell{min-height:100vh;font-family:'Space Grotesk',sans-serif;color:#e5eef7;background:radial-gradient(circle at 16% 18%,rgba(0,212,255,.12),transparent 24%),radial-gradient(circle at 82% 14%,rgba(140,77,255,.1),transparent 22%),linear-gradient(180deg,#050b16 0%,#040914 60%,#030710 100%);display:flex;}
  .op-shell::before{content:'';position:fixed;inset:0;background:linear-gradient(rgba(87,125,196,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(87,125,196,.04) 1px,transparent 1px);background-size:68px 68px;opacity:.15;pointer-events:none;z-index:0;}
  .op-sidebar{position:relative;z-index:1;width:220px;min-height:100vh;background:rgba(4,8,22,.92);border-right:1px solid rgba(87,125,196,.12);padding:2rem 1.25rem;display:flex;flex-direction:column;gap:2rem;flex-shrink:0;}
  .op-brand{display:flex;align-items:center;gap:.75rem;}
  .op-brand-mark{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(0,203,255,.45);display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:900;color:#00d4ff;}
  .op-brand-name{font-family:'Orbitron',sans-serif;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#dff5ff;line-height:1.3;}
  .op-nav{display:flex;flex-direction:column;gap:.25rem;}
  .op-nav-link{display:block;padding:.55rem .85rem;border-radius:10px;font-size:.85rem;color:#8ab0c9;cursor:pointer;border:none;background:none;text-align:left;font-family:inherit;transition:background 150ms,color 150ms;width:100%;}
  .op-nav-link:hover{background:rgba(87,125,196,.12);color:#dff7ff;}
  .op-nav-link.active{background:rgba(0,212,255,.08);color:#00d4ff;border:1px solid rgba(0,212,255,.18);}
  .op-main{position:relative;z-index:1;flex:1;padding:2.5rem 2.5rem 4rem;overflow-y:auto;}
  .op-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;}
  .op-eyebrow{font-size:.7rem;letter-spacing:.3em;text-transform:uppercase;color:#8ee8ff;margin-bottom:.25rem;}
  .op-title{font-family:'Orbitron',sans-serif;font-size:1.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#dff5ff;}
  .op-badge{display:inline-flex;align-items:center;gap:.4rem;padding:.2rem .65rem;border-radius:999px;font-size:.7rem;letter-spacing:.08em;background:rgba(140,77,255,.15);border:1px solid rgba(140,77,255,.35);color:#c580ff;}
  .op-panel{background:rgba(10,18,38,.85);border:1px solid rgba(87,140,255,.18);border-radius:18px;padding:1.75rem 1.75rem;margin-bottom:1.5rem;}
  .op-panel-title{font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#dff7ff;margin-bottom:1.25rem;}
  .op-form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.25rem;}
  .op-field{display:grid;gap:.35rem;}
  .op-field span{font-size:.68rem;text-transform:uppercase;letter-spacing:.16em;color:#8ccfff;}
  .op-field input,.op-field select{width:100%;border-radius:10px;border:1px solid rgba(109,162,255,.22);background:rgba(4,10,28,.86);color:#ecf7ff;padding:.7rem .9rem;outline:none;font-family:inherit;font-size:.9rem;transition:border-color 180ms;}
  .op-field input:focus,.op-field select:focus{border-color:rgba(80,208,255,.65);box-shadow:0 0 0 1px rgba(67,206,255,.14);}
  .op-field select option{background:#050b16;}
  .op-btn{padding:.7rem 1.5rem;border:0;border-radius:10px;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:.75rem;text-transform:uppercase;letter-spacing:.14em;transition:transform 160ms,filter 160ms;}
  .op-btn-primary{color:#03101c;background:linear-gradient(135deg,#00d4ff 0%,#8c4dff 52%,#ff55cc 100%);box-shadow:0 4px 18px rgba(0,212,255,.18);}
  .op-btn-primary:hover{transform:translateY(-2px);filter:brightness(1.1);}
  .op-btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;}
  .op-btn-ghost{color:#8ab0c9;background:rgba(87,125,196,.1);border:1px solid rgba(87,125,196,.22);}
  .op-btn-ghost:hover{border-color:rgba(80,208,255,.4);color:#dff7ff;}
  .op-btn-danger{color:#ff7676;background:rgba(255,80,80,.07);border:1px solid rgba(255,80,80,.22);}
  .op-btn-danger:hover{background:rgba(255,80,80,.14);border-color:rgba(255,80,80,.4);}
  .op-error{color:#ff7676;font-size:.82rem;margin-top:.5rem;}
  .op-success{color:#4fffb0;font-size:.82rem;margin-top:.5rem;}
  .op-table-wrap{overflow-x:auto;}
  .op-table{width:100%;border-collapse:collapse;font-size:.875rem;}
  .op-table th{text-align:left;padding:.6rem 1rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.14em;color:#8ee8ff;border-bottom:1px solid rgba(87,125,196,.18);font-weight:600;}
  .op-table td{padding:.8rem 1rem;border-bottom:1px solid rgba(87,125,196,.08);color:#c8dff5;vertical-align:middle;}
  .op-table tbody tr:hover{background:rgba(87,125,196,.05);}
  .op-table .empty{text-align:center;color:#6a8aaa;padding:2rem;}
  .role-badge{display:inline-block;padding:.18rem .6rem;border-radius:999px;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;font-weight:600;}
  .role-admin{background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.3);color:#00d4ff;}
  .role-operator{background:rgba(140,77,255,.12);border:1px solid rgba(140,77,255,.3);color:#c580ff;}
  .op-logout{margin-top:auto;padding-top:1rem;border-top:1px solid rgba(87,125,196,.12);}
  @media(max-width:700px){.op-sidebar{display:none;}.op-main{padding:1.5rem 1rem 3rem;}}
`;

export default function Operators() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', name: '', role: 'operator' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Auth guard
  useEffect(() => {
    (async () => {
      try {
        const supabase = await getSupabaseClient();
        if (!supabase) { navigate('/', { replace: true }); return; }
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) { navigate('/', { replace: true }); return; }
        const stored = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (stored?.role !== 'admin') { navigate('/dashboard', { replace: true }); return; }
        setCurrentUser(stored);
        setAuthChecked(true);
      } catch { navigate('/', { replace: true }); }
    })();
  }, [navigate]);

  const authHeaders = () => ({
    'x-operator-role': currentUser?.role || '',
    'x-operator-email': currentUser?.email || '',
  });

  useEffect(() => {
    if (!authChecked) return;
    api.get('/operators', { headers: authHeaders() })
      .then(res => setOperators(res.data.operators || []))
      .catch(() => setOperators([]))
      .finally(() => setLoading(false));
  }, [authChecked]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.name.trim()) { setFormError('Email and name are required.'); return; }
    setSaving(true); setFormError(''); setFormSuccess('');
    try {
      const res = await api.post('/operators', form, { headers: authHeaders() });
      setOperators(prev => [res.data.operator, ...prev]);
      setForm({ email: '', name: '', role: 'operator' });
      setFormSuccess(`Operator "${res.data.operator.name}" added successfully.`);
    } catch (err) {
      setFormError(err?.response?.data?.error || err.message || 'Failed to add operator.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove operator "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/operators/${id}`, { headers: authHeaders() });
      setOperators(prev => prev.filter(op => op.id !== id));
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete operator.');
    } finally { setDeletingId(null); }
  };

  const handleSignOut = async () => {
    const supabase = await getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    navigate('/', { replace: true });
  };

  if (!authChecked) return null;

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="op-shell">
        <aside className="op-sidebar">
          <div className="op-brand">
            <div className="op-brand-mark">D</div>
            <div className="op-brand-name">D&amp;D Global AI Surveillance</div>
          </div>
          <nav className="op-nav">
            <button className="op-nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="op-nav-link active">Team / Operators</button>
          </nav>
          <div className="op-logout">
            <button className="op-nav-link" onClick={handleSignOut}>Sign out</button>
          </div>
        </aside>

        <main className="op-main">
          <div className="op-topbar">
            <div>
              <p className="op-eyebrow">Admin Panel</p>
              <h1 className="op-title">Team &amp; Operators</h1>
            </div>
            <span className="op-badge">Admin only</span>
          </div>

          {/* Add Operator Form */}
          <div className="op-panel">
            <p className="op-panel-title">Add New Operator</p>
            <form onSubmit={handleAdd}>
              <div className="op-form-grid">
                <label className="op-field">
                  <span>Full Name</span>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Jane Smith"
                    required
                  />
                </label>
                <label className="op-field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="jane@company.com"
                    required
                  />
                </label>
                <label className="op-field">
                  <span>Role</span>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="operator">Operator — View cameras, map, dismiss alarms</option>
                    <option value="admin">Admin — Full access</option>
                  </select>
                </label>
              </div>
              {formError && <p className="op-error">{formError}</p>}
              {formSuccess && <p className="op-success">{formSuccess}</p>}
              <button className="op-btn op-btn-primary" type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Operator'}
              </button>
            </form>
          </div>

          {/* Operators Table */}
          <div className="op-panel">
            <p className="op-panel-title">Current Operators ({operators.length})</p>
            <div className="op-table-wrap">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="empty" colSpan="5">Loading operators...</td></tr>
                  ) : operators.length === 0 ? (
                    <tr><td className="empty" colSpan="5">No operators yet. Add one above.</td></tr>
                  ) : operators.map(op => (
                    <tr key={op.id}>
                      <td>{op.name}</td>
                      <td>{op.email}</td>
                      <td>
                        <span className={`role-badge ${op.role === 'admin' ? 'role-admin' : 'role-operator'}`}>
                          {op.role}
                        </span>
                      </td>
                      <td>{op.created_at ? new Date(op.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <button
                          className="op-btn op-btn-danger"
                          style={{ fontSize: '.72rem', padding: '.35rem .85rem' }}
                          onClick={() => handleDelete(op.id, op.name)}
                          disabled={deletingId === op.id}
                        >
                          {deletingId === op.id ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="op-panel" style={{ background: 'rgba(0,212,255,.04)', borderColor: 'rgba(0,212,255,.15)' }}>
            <p className="op-panel-title" style={{ color: '#8ee8ff', fontSize: '.78rem' }}>Role Permissions</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '.84rem', color: '#8ab0c9' }}>
              <div>
                <strong style={{ color: '#00d4ff', display: 'block', marginBottom: '.5rem' }}>Admin</strong>
                <div>✓ Full dashboard access</div>
                <div>✓ Manage operators</div>
                <div>✓ Edit settings</div>
                <div>✓ Delete data</div>
                <div>✓ View all reports</div>
              </div>
              <div>
                <strong style={{ color: '#c580ff', display: 'block', marginBottom: '.5rem' }}>Operator</strong>
                <div>✓ View live cameras</div>
                <div>✓ View live map</div>
                <div>✓ Dismiss alarms</div>
                <div>✗ Cannot edit settings</div>
                <div>✗ Cannot delete data</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
