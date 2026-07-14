import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { SearchAttributesQueryParams, SearchAttributesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search/attributes", async (req, res): Promise<void> => {
  const parsed = SearchAttributesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.message });
    return;
  }

  const { object_type, color, equipment, camera_id, min_confidence, start_date, end_date } = parsed.data;
  const minConfidence = Number(min_confidence ?? "0.5");
  const minConf = Number.isFinite(minConfidence) ? minConfidence : 0.5;

  const clauses = [sql`a.confidence >= ${minConf}`];
  if (object_type) clauses.push(sql`LOWER(a.object_type) LIKE ${`%${object_type.toLowerCase()}%`}`);
  if (camera_id) clauses.push(sql`e.camera_id = ${camera_id}`);
  if (start_date) clauses.push(sql`a.timestamp >= ${start_date}`);
  if (end_date) clauses.push(sql`a.timestamp <= ${end_date}`);

  const having: ReturnType<typeof sql>[] = [];
  if (color) {
    having.push(sql`bool_or(LOWER(b.attribute_type) = 'color' AND LOWER(b.attribute_value) LIKE ${`%${color.toLowerCase()}%`})`);
  }
  if (equipment) {
    having.push(
      sql`bool_or(LOWER(b.attribute_type) = 'equipment' AND LOWER(b.attribute_value) LIKE ${`%${equipment.toLowerCase()}%`})`,
    );
  }

  const whereClause = sql.join(clauses, sql` AND `);
  const havingClause = having.length ? sql`HAVING ${sql.join(having, sql` AND `)}` : sql``;

  const query = sql<{
    id: number;
    event_id: number;
    object_type: string;
    confidence: number;
    timestamp: string;
    camera_id: string | null;
    attributes: Array<{ attribute_type: string; attribute_value: string; confidence: number }> | null;
  }>`
    SELECT a.id, a.event_id, a.object_type, a.confidence, a.timestamp, e.camera_id,
           jsonb_agg(jsonb_build_object(
             'attribute_type', b.attribute_type,
             'attribute_value', b.attribute_value,
             'confidence', b.confidence
           )) FILTER (WHERE b.id IS NOT NULL) AS attributes
    FROM ai_detections a
    JOIN events e ON a.event_id = e.id
    LEFT JOIN object_attributes b ON a.id = b.detection_id
    WHERE ${whereClause}
    GROUP BY a.id, a.event_id, a.object_type, a.confidence, a.timestamp, e.camera_id
    ${havingClause}
    ORDER BY a.timestamp DESC
    LIMIT 200
  `;

  const rowsResult = await db.execute(query);
  const rows = rowsResult.rows;

  const results = rows.map((row) => ({
    id: Number(row.id),
    event_id: Number(row.event_id),
    object_type: String(row.object_type),
    confidence: Number(row.confidence),
    status: "New",
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp),
    camera_id: row.camera_id as string | null,
    attributes: row.attributes ?? [],
  }));

  res.json(SearchAttributesResponse.parse({ success: true, count: results.length, results, incidents: results }));
});

export default router;
