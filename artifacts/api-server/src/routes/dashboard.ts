import { Router, type IRouter } from "express";
import { avg, countDistinct, desc, eq, sql } from "drizzle-orm";
import {
  db,
  hazardsTable,
  sensorsTable,
  zonesTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const activeHazards = await db
    .select({ hazard: hazardsTable, zoneName: zonesTable.name })
    .from(hazardsTable)
    .innerJoin(zonesTable, eq(hazardsTable.zoneId, zonesTable.id))
    .where(eq(hazardsTable.status, "active"))
    .orderBy(desc(hazardsTable.priorityScore));

  const countByLevel = (level: string) =>
    activeHazards.filter((h) => h.hazard.riskLevel === level).length;

  const [zoneCountRow] = await db
    .select({ count: countDistinct(zonesTable.id) })
    .from(zonesTable);
  const [sensorCountRow] = await db
    .select({ count: countDistinct(sensorsTable.id) })
    .from(sensorsTable);
  const [workersRow] = await db
    .select({ total: sql<number>`coalesce(sum(${zonesTable.workersPresent}), 0)` })
    .from(zonesTable);

  const averageConfidence = activeHazards.length
    ? activeHazards.reduce((sum, h) => sum + h.hazard.confidenceScore, 0) /
      activeHazards.length
    : 0;

  const topHazards = activeHazards.slice(0, 5).map((h) => ({
    id: h.hazard.id,
    title: h.hazard.title,
    scenarioType: h.hazard.scenarioType,
    riskLevel: h.hazard.riskLevel,
    confidenceScore: h.hazard.confidenceScore,
    priorityScore: h.hazard.priorityScore,
    status: h.hazard.status,
    zoneId: h.hazard.zoneId,
    zoneName: h.zoneName,
    detectedAt: h.hazard.detectedAt.toISOString(),
    workersNearby: h.hazard.workersNearby,
    activeWorkPermit: h.hazard.activeWorkPermit,
  }));

  const result = {
    activeHazardCount: activeHazards.length,
    criticalCount: countByLevel("critical"),
    highCount: countByLevel("high"),
    mediumCount: countByLevel("medium"),
    lowCount: countByLevel("low"),
    averageConfidence,
    zonesMonitored: zoneCountRow?.count ?? 0,
    sensorsOnline: sensorCountRow?.count ?? 0,
    workersOnSite: Number(workersRow?.total ?? 0),
    topHazards,
  };

  res.json(GetDashboardSummaryResponse.parse(result));
});

export default router;
