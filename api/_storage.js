const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Object storage for snapshots and recordings (Phase 3).
 *
 * Uses the plain S3 API, which every realistic option speaks:
 * AWS S3, Cloudflare R2, Backblaze B2, MinIO (self-hosted), and
 * Vercel Blob's S3-compatible endpoint. Swapping providers is a
 * config change (STORAGE_ENDPOINT/STORAGE_* env vars), not a code
 * change.
 *
 * Required env vars:
 *   STORAGE_ENDPOINT     - e.g. https://<account>.r2.cloudflarestorage.com
 *                          (omit for real AWS S3; required for R2/MinIO/etc.)
 *   STORAGE_REGION       - e.g. auto (R2), us-east-1 (S3/MinIO)
 *   STORAGE_BUCKET       - bucket name
 *   STORAGE_ACCESS_KEY_ID
 *   STORAGE_SECRET_ACCESS_KEY
 *   STORAGE_PUBLIC_BASE_URL - public/CDN URL prefix used to build the
 *                             storage_url saved in the DB (e.g. a
 *                             CloudFront/R2 public bucket URL)
 */

function isConfigured() {
  return Boolean(
    process.env.STORAGE_BUCKET &&
    process.env.STORAGE_ACCESS_KEY_ID &&
    process.env.STORAGE_SECRET_ACCESS_KEY,
  );
}

function getClient() {
  return new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    region: process.env.STORAGE_REGION || 'us-east-1',
    forcePathStyle: Boolean(process.env.STORAGE_ENDPOINT), // needed for R2/MinIO, not real AWS
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Uploads a buffer to object storage under the given key and returns
 * the public URL to store in the DB (snapshots.storage_url /
 * recordings.storage_url).
 */
async function uploadObject({ key, body, contentType }) {
  if (!isConfigured()) {
    const err = new Error('Object storage is not configured. Set STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY.');
    err.statusCode = 503;
    throw err;
  }

  const client = getClient();
  await client.send(new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  const base = process.env.STORAGE_PUBLIC_BASE_URL || `${process.env.STORAGE_ENDPOINT}/${process.env.STORAGE_BUCKET}`;
  return `${base.replace(/\/$/, '')}/${key}`;
}

module.exports = { isConfigured, uploadObject };
