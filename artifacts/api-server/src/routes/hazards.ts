import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  contributingFactorsTable,
  db,
  hazardsTable,
  recommendedActionsTable,
  timelineEventsTable,
  zonesTable,
} from "@workspace/db";
import {
  GetHazardParams,
  GetHazardResponse,
  GetHazardTimelineParams,
  GetHazardTimelineResponse,
  ListHazardsQueryParams,
  ListHazardsResponse,
  UpdateHazardStatusBody,
  UpdateHazardStatusParams,
  UpdateHazardStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toSummary(
  hazard: typeof hazardsTable.$inferSelect,
  zoneName: string,
) {
  return {
    id: hazard.id,
    title: hazard.title,
    scenarioType: hazard.scenarioType,
    riskLevel: hazard.riskLevel,
    confidenceScore: hazard.confidenceScore,
    priorityScore: hazard.priorityScore,
    status: hazard.status,
    zoneId: hazard.zoneId,
    zoneName,
    detectedAt: hazard.detectedAt.toISOString(),
    workersNearby: hazard.workersNearby,
    activeWorkPermit: hazard.activeWorkPermit,
  };
}

router.get("/hazards", async (req, res): Promise<void> => {
  const query = ListHazardsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) {
    conditions.push(eq(hazardsTable.status, query.data.status));
  }
  if (query.data.riskLevel) {
    conditions.push(eq(hazardsTable.riskLevel, query.data.riskLevel));
  }

  const rows = await db
    .select({ hazard: hazardsTable, zoneName: zonesTable.name })
    .from(hazardsTable)
    .innerJoin(zonesTable, eq(hazardsTable.zoneId, zonesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(hazardsTable.priorityScore));

  const result = rows.map((row) => toSummary(row.hazard, row.zoneName));

  res.json(ListHazardsResponse.parse(result));
});

router.get("/hazards/:id", async (req, res): Promise<void> => {
  const params = GetHazardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ hazard: hazardsTable, zoneName: zonesTable.name })
    .from(hazardsTable)
    .innerJoin(zonesTable, eq(hazardsTable.zoneId, zonesTable.id))
    .where(eq(hazardsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Hazard not found" });
    return;
  }

  const contributingFactors = await db
    .select()
    .from(contributingFactorsTable)
    .where(eq(contributingFactorsTable.hazardId, params.data.id));

  const recommendedActions = await db
    .select()
    .from(recommendedActionsTable)
    .where(eq(recommendedActionsTable.hazardId, params.data.id));

  const result = {
    ...toSummary(row.hazard, row.zoneName),
    description: row.hazard.description,
    contributingFactors: contributingFactors.map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      weight: f.weight,
    })),
    recommendedActions: recommendedActions.map((a) => ({
      id: a.id,
      action: a.action,
      rationale: a.rationale,
      priority: a.priority,
    })),
    explainability: {
      contributingSensors: row.hazard.contributingSensors,
      reasoningSteps: row.hazard.reasoningSteps,
      riskRationale: row.hazard.riskRationale,
      priorityRationale: row.hazard.priorityRationale,
      confidenceRationale: row.hazard.confidenceRationale,
    },
  };

  res.json(GetHazardResponse.parse(result));
});

router.patch("/hazards/:id/status", async (req, res): Promise<void> => {
  const params = UpdateHazardStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateHazardStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(hazardsTable)
    .set({ status: body.data.status })
    .where(eq(hazardsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Hazard not found" });
    return;
  }

  await db.insert(timelineEventsTable).values({
    id: `evt-${updated.id}-${Date.now()}`,
    hazardId: updated.id,
    eventType: "status_changed",
    description: `Status changed to ${body.data.status}`,
  });

  const [zone] = await db
    .select()
    .from(zonesTable)
    .where(eq(zonesTable.id, updated.zoneId));

  const contributingFactors = await db
    .select()
    .from(contributingFactorsTable)
    .where(eq(contributingFactorsTable.hazardId, updated.id));

  const recommendedActions = await db
    .select()
    .from(recommendedActionsTable)
    .where(eq(recommendedActionsTable.hazardId, updated.id));

  const result = {
    ...toSummary(updated, zone?.name ?? ""),
    description: updated.description,
    contributingFactors: contributingFactors.map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      weight: f.weight,
    })),
    recommendedActions: recommendedActions.map((a) => ({
      id: a.id,
      action: a.action,
      rationale: a.rationale,
      priority: a.priority,
    })),
    explainability: {
      contributingSensors: updated.contributingSensors,
      reasoningSteps: updated.reasoningSteps,
      riskRationale: updated.riskRationale,
      priorityRationale: updated.priorityRationale,
      confidenceRationale: updated.confidenceRationale,
    },
  };

  res.json(UpdateHazardStatusResponse.parse(result));
});

router.get("/hazards/:id/timeline", async (req, res): Promise<void> => {
  const params = GetHazardTimelineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [hazard] = await db
    .select()
    .from(hazardsTable)
    .where(eq(hazardsTable.id, params.data.id));

  if (!hazard) {
    res.status(404).json({ error: "Hazard not found" });
    return;
  }

  const events = await db
    .select()
    .from(timelineEventsTable)
    .where(eq(timelineEventsTable.hazardId, params.data.id))
    .orderBy(asc(timelineEventsTable.timestamp));

  const result = events.map((event) => ({
    id: event.id,
    hazardId: event.hazardId,
    hazardTitle: hazard.title,
    eventType: event.eventType,
    description: event.description,
    timestamp: event.timestamp.toISOString(),
  }));

  res.json(GetHazardTimelineResponse.parse(result));
});

export default router;
