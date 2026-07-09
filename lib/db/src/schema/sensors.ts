import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { zonesTable } from "./zones";

export const sensorsTable = pgTable("sensors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sensorType: text("sensor_type").notNull(),
  zoneId: text("zone_id")
    .notNull()
    .references(() => zonesTable.id),
  unit: text("unit").notNull(),
});

export const insertSensorSchema = createInsertSchema(sensorsTable);
export type InsertSensor = z.infer<typeof insertSensorSchema>;
export type Sensor = typeof sensorsTable.$inferSelect;

export const sensorReadingsTable = pgTable("sensor_readings", {
  id: text("id").primaryKey(),
  sensorId: text("sensor_id")
    .notNull()
    .references(() => sensorsTable.id),
  value: doublePrecision("value").notNull(),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSensorReadingSchema = createInsertSchema(
  sensorReadingsTable,
).omit({ id: true });
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type SensorReadingRow = typeof sensorReadingsTable.$inferSelect;
