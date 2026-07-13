import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, engineReadingsTable, enginesTable } from "@workspace/db";
import { GetEngineParams, GetEngineResponse, ListEnginesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function toSummary(engine: typeof enginesTable.$inferSelect) {
  return {
    id: engine.id,
    name: engine.name,
    datasetUnit: engine.datasetUnit,
    currentCycle: engine.currentCycleIndex,
    totalCycles: engine.totalCycles,
    predictedRul: engine.predictedRul,
    status: engine.status,
    updatedAt: engine.updatedAt.toISOString(),
  };
}

router.get("/engines", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(enginesTable)
    .orderBy(asc(enginesTable.datasetUnit));

  res.json(ListEnginesResponse.parse(rows.map(toSummary)));
});

router.get("/engines/:id", async (req, res): Promise<void> => {
  const params = GetEngineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [engine] = await db
    .select()
    .from(enginesTable)
    .where(eq(enginesTable.id, params.data.id));

  if (!engine) {
    res.status(404).json({ error: "Engine not found" });
    return;
  }

  const history = await db
    .select()
    .from(engineReadingsTable)
    .where(eq(engineReadingsTable.engineId, params.data.id))
    .orderBy(desc(engineReadingsTable.timestamp))
    .limit(50);

  const result = {
    ...toSummary(engine),
    history: history
      .slice()
      .reverse()
      .map((h) => ({
        cycle: h.cycle,
        predictedRul: h.predictedRul,
        timestamp: h.timestamp.toISOString(),
      })),
  };

  res.json(GetEngineResponse.parse(result));
});

export default router;
