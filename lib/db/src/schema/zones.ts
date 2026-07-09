import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const zonesTable = pgTable("zones", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  workersPresent: integer("workers_present").notNull().default(0),
  activeWorkPermits: integer("active_work_permits").notNull().default(0),
});

export const insertZoneSchema = createInsertSchema(zonesTable);
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zonesTable.$inferSelect;
