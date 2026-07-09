import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, hazardsTable, zonesTable } from "@workspace/db";
import { ListZonesResponse } from "@workspace/api-zod";
import { highestRisk } from "../lib/risk";

const router: IRouter = Router();

router.get("/zones", async (_req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);
  const activeHazards = await db
    .select()
    .from(hazardsTable)
    .where(eq(hazardsTable.status, "active"));

  const result = zones.map((zone) => {
    const zoneHazards = activeHazards.filter((h) => h.zoneId === zone.id);
    return {
      id: zone.id,
      name: zone.name,
      riskLevel: highestRisk(zoneHazards.map((h) => h.riskLevel)),
      activeHazardCount: zoneHazards.length,
      workersPresent: zone.workersPresent,
      activeWorkPermits: zone.activeWorkPermits,
    };
  });

  res.json(ListZonesResponse.parse(result));
});

export default router;
