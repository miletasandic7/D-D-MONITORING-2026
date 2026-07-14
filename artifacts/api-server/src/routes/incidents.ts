import { Router, type IRouter } from "express";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, aiDetectionsTable, eventsTable, objectAttributesTable } from "@workspace/db";
import {
  ListIncidentsResponse,
  UpdateIncidentStatusParams,
  UpdateIncidentStatusBody,
  UpdateIncidentStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ALLOWED_STATUSES = ["New", "Acknowledged", "In Progress", "Resolved", "False Alarm"];

router.get("/incidents", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: aiDetectionsTable.id,
      eventId: aiDetectionsTable.eventId,
      objectType: aiDetectionsTable.objectType,
      confidence: aiDetectionsTable.confidence,
      status: sql<string>`coalesce(${aiDetectionsTable.boundingBox}->>'incident_status', 'New')`,
      timestamp: aiDetectionsTable.timestamp,
      cameraId: eventsTable.cameraId,
      severity: eventsTable.severity,
      sourceDescription: eventsTable.description,
    })
    .from(aiDetectionsTable)
    .innerJoin(eventsTable, eq(aiDetectionsTable.eventId, eventsTable.id))
    .where(eq(eventsTable.isDismissed, false))
    .orderBy(desc(aiDetectionsTable.timestamp))
    .limit(100);

  const detectionIds = rows.map((row) => row.id);
  const attributes = detectionIds.length
    ? await db
        .select()
        .from(objectAttributesTable)
        .where(inArray(objectAttributesTable.detectionId, detectionIds))
    : [];

  const results = rows.map((row) => ({
    id: row.id,
    event_id: row.eventId,
    object_type: row.objectType,
    confidence: row.confidence,
    status: row.status || "New",
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp),
    camera_id: row.cameraId,
    severity: row.severity,
    source_description: row.sourceDescription,
    attributes: attributes
      .filter((attribute) => attribute.detectionId === row.id)
      .map((attribute) => ({
        attribute_type: attribute.attributeType,
        attribute_value: attribute.attributeValue,
        confidence: attribute.confidence,
      })),
  }));

  res.status(200).json(
    ListIncidentsResponse.parse({
      success: true,
      count: results.length,
      results,
      incidents: results,
      statuses: ALLOWED_STATUSES,
    }),
  );
});

router.patch("/incidents/:eventId/status", async (req, res): Promise<void> => {
  const params = UpdateIncidentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ success: false, error: params.error.message });
    return;
  }

  const body = UpdateIncidentStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
    });
    return;
  }

  await db
    .update(aiDetectionsTable)
    .set({
      boundingBox: sql`jsonb_set(coalesce(${aiDetectionsTable.boundingBox}, '{}'), '{incident_status}', to_jsonb(${body.data.status}::text))`,
    })
    .where(eq(aiDetectionsTable.eventId, params.data.eventId));

  res.status(200).json(
    UpdateIncidentStatusResponse.parse({
      success: true,
      event_id: params.data.eventId,
      status: body.data.status,
    }),
  );
});

export default router;
