# Media server (RTSP → HLS) for D&D Monitoring

## Why this exists

The dashboard's video player (`hls.js`) expects each camera's live feed as
an HLS stream at:

```
{VITE_HLS_BASE_URL}/{cameraId}/index.m3u8
```

Browsers cannot play RTSP directly — there is no RTSP support in any
browser's `<video>` element, so the app must never try to set a camera's
raw `rtsp://...` URL as a video `src`. Something has to convert each
camera's RTSP feed into HLS (or WebRTC) first.

**Vercel cannot do this.** Vercel serverless functions are stateless and
short-lived; they cannot hold open a 24/7 connection to an RTSP camera and
continuously transcode it. This conversion must run on a separate,
always-on host — a small VPS, Fly.io/Railway app, a machine on your local
network, or an existing NVR that already exposes RTSP/HLS.

This folder gives you a ready-to-run version of that piece, using
[MediaMTX](https://github.com/bluenviron/mediamtx) (open source, single
binary/Docker image, pulls RTSP from your cameras and re-serves HLS).

## Setup

1. Edit `mediamtx.yml`: under `paths:`, add one entry per camera. The key
   (e.g. `CAM-01`) **must match** the `id` of that camera in the `cameras`
   table, because that's the id the frontend uses to build the manifest
   URL. Set `source:` to that camera's real RTSP URL.
2. Run it:
   ```bash
   docker compose up -d
   ```
3. Verify HLS is being served:
   ```bash
   curl -I http://<host>:8888/CAM-01/index.m3u8
   ```
   You should get `HTTP/1.1 200 OK`.
4. Put it behind HTTPS (e.g. Caddy, nginx, or your VPS provider's load
   balancer) — a dashboard served over `https://` cannot load video from
   a plain `http://` server; browsers block "mixed content".
5. Set on the frontend (Vercel project env vars):
   ```
   VITE_HLS_BASE_URL=https://your-media-server-domain
   ```
6. Add that domain to the CSP in `vercel.json` (`media-src` and
   `connect-src`), replacing the placeholder domains that are there now.

## Testing without a real camera

You can simulate a camera locally with `ffmpeg`, which is useful for
confirming the whole pipeline (RTSP publish → MediaMTX → HLS → hls.js)
works before wiring up real hardware:

```bash
# Terminal 1: start MediaMTX
docker compose up

# Terminal 2: simulate a camera named CAM-01 publishing a test pattern
ffmpeg -re -f lavfi -i "testsrc=size=640x480:rate=25" \
  -f lavfi -i "sine=frequency=1000" \
  -c:v libx264 -preset veryfast -tune zerolatency -g 50 -c:a aac \
  -f rtsp -rtsp_transport tcp rtsp://localhost:8554/CAM-01

# Terminal 3: confirm HLS output exists
curl http://localhost:8888/CAM-01/index.m3u8
```

This exact sequence was used to verify the fix in this repository before
committing — see the main README for details.

## Related: event-triggered recording (Phase 3)

`workers/recording-worker.js` is a second persistent process (also NOT
Vercel-hostable) that listens for new events in Postgres and records a
short segment straight from each camera's RTSP source via ffmpeg,
uploading it to object storage. Run it on the same host as MediaMTX, or
anywhere with network access to both the cameras and the database:

```bash
node workers/recording-worker.js
```

`workers/retention-job.js` deletes recordings past their per-camera
retention window; run it on a schedule (cron, systemd timer, etc.):

```bash
node workers/retention-job.js
```

Both require `DATABASE_URL` and the `STORAGE_*` object storage env vars
documented in `.env.example`.

## Related: multi-node registry (Phase 5)

For more than one MediaMTX instance (e.g. one per region), register
each node once via `POST /api/media-nodes` (platform_admin only) --
this returns a `heartbeat_secret`, shown only at creation time. Run
`workers/media-node-heartbeat.js` alongside that MediaMTX instance so
the registry knows it's alive:

```bash
API_BASE_URL=https://your-vercel-domain/api \
MEDIA_NODE_ID=<id from the create response> \
MEDIA_NODE_HEARTBEAT_SECRET=<secret from the create response> \
node workers/media-node-heartbeat.js
```

New cameras are automatically assigned to the least-loaded online node
(optionally matching a preferred region); a node with no heartbeat in
the last `MEDIA_NODE_HEARTBEAT_FRESHNESS_SECONDS` is treated as
offline and skipped, so a crashed node just stops receiving new
cameras rather than needing manual failover.
