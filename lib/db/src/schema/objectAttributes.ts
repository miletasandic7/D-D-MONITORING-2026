import { pgTable, serial, integer, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { aiDetectionsTable } from "./aiDetections";

export const objectAttributesTable = pgTable("object_attributes", {
  id: serial("id").primaryKey(),
  detectionId: integer("detection_id").notNull().references(() => aiDetectionsTable.id, { onDelete: "cascade" }),
  attributeType: text("attribute_type").notNull(),
  attributeValue: text("attribute_value").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertObjectAttributeSchema = createInsertSchema(objectAttributesTable).omit({ id: true, createdAt: true });
export type InsertObjectAttribute = z.infer<typeof insertObjectAttributeSchema>;
export type ObjectAttribute = typeof objectAttributesTable.$inferSelect;
