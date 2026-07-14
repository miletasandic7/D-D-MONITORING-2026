import { pgTable, text, doublePrecision, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const camerasTable = pgTable("cameras", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rtspUrl: text("rtsp_url"),
  location: text("location"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  enabled: boolean("enabled").notNull().default(true),
  resolution: text("resolution"),
  fps: integer("fps"),
  codec: text("codec"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCameraSchema = createInsertSchema(camerasTable).omit({ createdAt: true, updatedAt: true });
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof camerasTable.$inferSelect;
