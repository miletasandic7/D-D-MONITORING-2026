// api/operators.js — Operator management endpoints
// GET    /api/operators        → list all operators (admin only)
// POST   /api/operators        → create operator (admin only)
// DELETE /api/operators/:id    → delete operator (admin only)

import db from '../db/index.js';

function isAdmin(req) {
  // Read operator role from x-operator-role header or session
  const role = req.headers['x-operator-role'] || '';
  return role === 'admin';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  // Route: DELETE /api/operators/:id
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const id = req.url.split('/').pop();
    try {
      const result = await db.query('DELETE FROM operators WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Operator not found.' });
      return res.status(200).json({ success: true, deleted: id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Route: GET /api/operators
  if (req.method === 'GET') {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    try {
      const result = await db.query(
        'SELECT id, email, name, role, created_at, created_by FROM operators ORDER BY created_at DESC'
      );
      return res.status(200).json({ operators: result.rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Route: POST /api/operators
  if (req.method === 'POST') {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const { email, name, role = 'operator' } = req.body || {};
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required.' });
    }
    if (!['admin', 'operator'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or operator.' });
    }
    const createdBy = req.headers['x-operator-email'] || null;
    try {
      const result = await db.query(
        'INSERT INTO operators (email, name, role, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [email.toLowerCase().trim(), name.trim(), role, createdBy]
      );
      return res.status(201).json({ operator: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'An operator with this email already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
