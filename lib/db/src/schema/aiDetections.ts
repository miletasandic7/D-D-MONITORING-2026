import { pgTable, serial, integer, text, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { eventsTable } from "./events";

export const aiDetectionsTable = pgTable("ai_detections", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  objectType: text("object_type").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  boundingBox: jsonb("bounding_box"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiDetectionSchema = createInsertSchema(aiDetectionsTable).omit({ id: true, createdAt: true });
export type InsertAiDetection = z.infer<typeof insertAiDetectionSchema>;
export type AiDetection = typeof aiDetectionsTable.$inferSelect;
