#!/usr/bin/env node
/**
 * Local development server for the /api/* serverless functions.
 *
 * Vercel maps files under api/ to routes automatically (index.js ->
 * folder root, [param].js -> dynamic segment). This script replicates
 * that mapping with a plain Node http server, so `npm run dev` gives a
 * real local API without requiring the Vercel CLI or an account login.
 * (`vercel dev` is still the closest thing to the real production
 * environment and is documented as a second option in the README --
 * this script is for fast iteration without that dependency.)
 *
 * frontend/vite.config.js proxies /api requests to this server's port,
 * so running `npm run dev` here + `cd frontend && npm run dev` in
 * another terminal gives a fully working local stack.
 */

try { require('dotenv').config(); } catch { /* optional */ }

const http = require('http');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

const PORT = process.env.API_DEV_PORT || 3001;
const API_DIR = path.join(__dirname, 'api');

// Build a route table: [{ segments: ['cameras'], filePath, isDynamic }]
// by walking api/ recursively. Supports:
//   api/cameras.js                    -> /api/cameras
//   api/incidents/index.js            -> /api/incidents
//   api/incidents/[eventId]/status.js -> /api/incidents/:eventId/status
//   api/camera-views/[viewId].js      -> /api/camera-views/:viewId
function buildRoutes(dir, prefix = []) {
  let routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue; // _auth.js, _storage.js etc. are helpers, not routes
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const segment = entry.name.startsWith('[') && entry.name.endsWith(']')
        ? `:${entry.name.slice(1, -1)}`
        : entry.name;
      routes = routes.concat(buildRoutes(fullPath, [...prefix, segment]));
    } else if (entry.name.endsWith('.js')) {
      const base = entry.name.replace(/\.js$/, '');
      let segments = prefix;
      if (base !== 'index') {
        const segment = base.startsWith('[') && base.endsWith(']') ? `:${base.slice(1, -1)}` : base;
        segments = [...prefix, segment];
      }
      routes.push({ segments, filePath: fullPath });
    }
  }
  return routes;
}

const routes = buildRoutes(API_DIR);
console.log(`[dev-server] discovered ${routes.length} API route(s):`);
routes.forEach((r) => console.log(`  /api/${r.segments.join('/')}  ->  ${path.relative(__dirname, r.filePath)}`));

function matchRoute(pathSegments) {
  for (const route of routes) {
    if (route.segments.length !== pathSegments.length) continue;
    const params = {};
    let matched = true;
    for (let i = 0; i < route.segments.length; i += 1) {
      const routeSeg = route.segments[i];
      if (routeSeg.startsWith(':')) {
        params[routeSeg.slice(1)] = decodeURIComponent(pathSegments[i]);
      } else if (routeSeg !== pathSegments[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) { resolve({}); return; }
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); } // non-JSON body, leave empty like Vercel would for a bad content-type
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (!url.pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not an /api route' }));
    return;
  }

  const pathSegments = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
  const match = matchRoute(pathSegments);
  if (!match) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: `No API route matches ${url.pathname}` }));
    return;
  }

  const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : {};
  const query = { ...Object.fromEntries(url.searchParams), ...match.params };

  // Minimal req/res shim matching what Vercel's Node runtime gives a
  // handler: req.query, req.body, req.headers; res.status().json()/.end().
  req.query = query;
  req.body = body;
  res.status = function status(code) { this.statusCode = code; return this; };
  res.json = function json(payload) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(payload));
    return this;
  };

  try {
    delete require.cache[require.resolve(match.route.filePath)]; // pick up edits without restarting
    const handler = require(match.route.filePath);
    await handler(req, res);
  } catch (err) {
    console.error(`[dev-server] unhandled error in ${match.route.filePath}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

server.listen(PORT, () => {
  console.log(`[dev-server] API listening on http://localhost:${PORT}/api/*`);
  console.log(`[dev-server] health check: http://localhost:${PORT}/api/health`);
});
