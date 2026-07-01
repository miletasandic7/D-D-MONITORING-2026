const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function getCamerasFromDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Cannot load cameras for video pipeline.');
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const { rows } = await pool.query(
      "SELECT id, name, rtsp_url FROM cameras WHERE enabled = TRUE AND rtsp_url IS NOT NULL AND rtsp_url <> '' ORDER BY id",
    );
    return rows;
  } finally {
    await pool.end();
  }
}

function startSingleStream(cam) {
  const outputDir = path.resolve(__dirname, '..', '..', 'public', 'hls', cam.id);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ffmpegArgs = [
    '-rtsp_transport', 'tcp',
    '-i', cam.rtsp_url,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
    path.join(outputDir, 'index.m3u8'),
  ];

  const ff = spawn(ffmpegPath, ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  ff.stdout.on('data', (data) => console.log(`[${cam.id}] ${data}`));
  ff.stderr.on('data', (data) => console.error(`[${cam.id}] ${data}`));

  ff.on('close', (code) => {
    console.log(`[${cam.id}] ffmpeg exited with code ${code}. Restarting in 5 s...`);
    setTimeout(() => startSingleStream(cam), 5000);
  });

  ff.on('error', (err) => {
    console.error(`[${cam.id}] ffmpeg spawn error: ${err.message}. Retrying in 10 s...`);
    setTimeout(() => startSingleStream(cam), 10000);
  });
}

(async () => {
  let cameras;
  try {
    cameras = await getCamerasFromDB();
    console.log(`Video pipeline: loaded ${cameras.length} camera(s) from database.`);
  } catch (err) {
    console.error('Fatal: failed to load cameras from database:', err.message);
    process.exit(1);
  }

  if (!cameras.length) {
    console.warn('No enabled cameras with RTSP URLs found. Video pipeline is idle.');
    return;
  }

  cameras.forEach(startSingleStream);
})();
