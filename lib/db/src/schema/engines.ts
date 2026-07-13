import { doublePrecision, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Demo "engine fleet" for the Remaining Useful Life (RUL) feature, driven by
 * real NASA C-MAPSS FD001 turbofan degradation trajectories replayed cycle by
 * cycle (see scripts/src/seedEngines.ts and lib/engineSim.ts in api-server).
 */
export const enginesTable = pgTable("engines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  datasetUnit: integer("dataset_unit").notNull(),
  totalCycles: integer("total_cycles").notNull(),
  currentCycleIndex: integer("current_cycle_index").notNull().default(0),
  predictedRul: doublePrecision("predicted_rul").notNull(),
  trueFinalRul: doublePrecision("true_final_rul").notNull(),
  status: text("status").notNull().default("nominal"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertEngineSchema = createInsertSchema(enginesTable);
export type InsertEngine = z.infer<typeof insertEngineSchema>;
export type EngineRow = typeof enginesTable.$inferSelect;

export const engineReadingsTable = pgTable("engine_readings", {
  id: text("id").primaryKey(),
  engineId: text("engine_id")
    .notNull()
    .references(() => enginesTable.id),
  cycle: integer("cycle").notNull(),
  predictedRul: doublePrecision("predicted_rul").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertEngineReadingSchema = createInsertSchema(
  engineReadingsTable,
).omit({ id: true });
export type InsertEngineReading = z.infer<typeof insertEngineReadingSchema>;
export type EngineReadingRow = typeof engineReadingsTable.$inferSelect;
