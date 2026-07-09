import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { zonesTable } from "./zones";

export const hazardsTable = pgTable("hazards", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  scenarioType: text("scenario_type").notNull(),
  riskLevel: text("risk_level").notNull(),
  confidenceScore: doublePrecision("confidence_score").notNull(),
  priorityScore: doublePrecision("priority_score").notNull(),
  status: text("status").notNull().default("active"),
  zoneId: text("zone_id")
    .notNull()
    .references(() => zonesTable.id),
  description: text("description").notNull(),
  workersNearby: integer("workers_nearby").notNull().default(0),
  activeWorkPermit: boolean("active_work_permit").notNull().default(false),
  detectedAt: timestamp("detected_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  contributingSensors: text("contributing_sensors").array().notNull(),
  reasoningSteps: text("reasoning_steps").array().notNull(),
  riskRationale: text("risk_rationale").notNull(),
  priorityRationale: text("priority_rationale").notNull(),
  confidenceRationale: text("confidence_rationale").notNull(),
});

export const insertHazardSchema = createInsertSchema(hazardsTable);
export type InsertHazard = z.infer<typeof insertHazardSchema>;
export type HazardRow = typeof hazardsTable.$inferSelect;

export const contributingFactorsTable = pgTable("contributing_factors", {
  id: text("id").primaryKey(),
  hazardId: text("hazard_id")
    .notNull()
    .references(() => hazardsTable.id),
  label: text("label").notNull(),
  description: text("description").notNull(),
  weight: doublePrecision("weight").notNull(),
});

export const insertContributingFactorSchema = createInsertSchema(
  contributingFactorsTable,
);
export type InsertContributingFactor = z.infer<
  typeof insertContributingFactorSchema
>;
export type ContributingFactorRow =
  typeof contributingFactorsTable.$inferSelect;

export const recommendedActionsTable = pgTable("recommended_actions", {
  id: text("id").primaryKey(),
  hazardId: text("hazard_id")
    .notNull()
    .references(() => hazardsTable.id),
  action: text("action").notNull(),
  rationale: text("rationale").notNull(),
  priority: text("priority").notNull(),
});

export const insertRecommendedActionSchema = createInsertSchema(
  recommendedActionsTable,
);
export type InsertRecommendedAction = z.infer<
  typeof insertRecommendedActionSchema
>;
export type RecommendedActionRow = typeof recommendedActionsTable.$inferSelect;

export const timelineEventsTable = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  hazardId: text("hazard_id")
    .notNull()
    .references(() => hazardsTable.id),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTimelineEventSchema =
  createInsertSchema(timelineEventsTable);
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEventRow = typeof timelineEventsTable.$inferSelect;
