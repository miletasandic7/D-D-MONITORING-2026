import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, camerasTable } from "@workspace/db";
import {
  ScanCamerasResponse,
  ListCamerasResponse,
  UpsertCameraBody,
  UpsertCameraResponse,
  DeleteCameraQueryParams,
  DeleteCameraResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// No ONVIF hardware is reachable from this environment; mirrors the source
// app's best-effort auto-discovery endpoint, which the frontend treats as
// optional and silently ignores on failure.
router.get("/cameras/scan", (_req, res): void => {
  res.json(ScanCamerasResponse.parse({ success: false, rtsp_url: null }));
});

router.get("/cameras", async (_req, res): Promise<void> => {
  const cameras = await db.select().from(camerasTable).orderBy(camerasTable.id);
  res.json(
    ListCamerasResponse.parse({
      success: true,
      count: cameras.length,
      cameras: cameras.map((camera) => ({
        id: camera.id,
        name: camera.name,
        rtsp_url: camera.rtspUrl,
        location: camera.location,
        lat: camera.lat,
        lng: camera.lng,
        enabled: camera.enabled,
        resolution: camera.resolution,
        fps: camera.fps,
        codec: camera.codec,
      })),
    }),
  );
});

router.post("/cameras", async (req, res): Promise<void> => {
  const parsed = UpsertCameraBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  const { id, name, rtsp_url, location, lat, lng, enabled, resolution, fps, codec } = parsed.data;

  await db
    .insert(camerasTable)
    .values({
      id,
      name,
      rtspUrl: rtsp_url,
      location,
      lat,
      lng,
      enabled,
      resolution,
      fps,
      codec,
    })
    .onConflictDoUpdate({
      target: camerasTable.id,
      set: {
        name,
        rtspUrl: rtsp_url,
        location,
        lat,
        lng,
        enabled,
        resolution,
        fps,
        codec,
      },
    });

  res.status(201).json(UpsertCameraResponse.parse({ success: true, message: "Camera saved" }));
});

router.delete("/cameras", async (req, res): Promise<void> => {
  const parsed = DeleteCameraQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  await db.delete(camerasTable).where(eq(camerasTable.id, parsed.data.id));
  res.status(200).json(DeleteCameraResponse.parse({ success: true, message: "Camera deleted" }));
});

export default router;
