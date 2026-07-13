/**
 * Replays real NASA C-MAPSS FD001 turbofan run-to-failure trajectories cycle
 * by cycle to simulate a live telemetry feed for the demo engine fleet,
 * running each new cycle's sensor vector through the trained RUL regressor
 * (see ml/train_turbofan_rul_model.py).
 */
import { eq } from "drizzle-orm";
import { db, engineReadingsTable, enginesTable } from "@workspace/db";
import { predictRul, turbofanDemoTrajectories } from "@workspace/ml-models";
import { logger } from "./logger";

const TICK_INTERVAL_MS = 10_000;

async function tickEngine(engine: typeof enginesTable.$inferSelect): Promise<void> {
  const traj = turbofanDemoTrajectories[String(engine.datasetUnit) as keyof typeof turbofanDemoTrajectories];
  if (!traj) return;

  // Advance one cycle; loop back to the start once the recorded trajectory
  // is exhausted so the demo keeps running indefinitely.
  const nextIndex = (engine.currentCycleIndex + 1) % traj.cycles.length;
  const features = traj.features[nextIndex];
  if (!features) return;

  const { predictedRul } = predictRul([...features]);
  const status =
    predictedRul > 80 ? "nominal" : predictedRul > 40 ? "watch" : predictedRul > 10 ? "critical" : "retired";

  await db
    .update(enginesTable)
    .set({
      currentCycleIndex: nextIndex,
      predictedRul,
      status,
      updatedAt: new Date(),
    })
    .where(eq(enginesTable.id, engine.id));

  await db.insert(engineReadingsTable).values({
    id: `eng-rdg-${engine.id}-${Date.now()}`,
    engineId: engine.id,
    cycle: traj.cycles[nextIndex] ?? nextIndex,
    predictedRul,
  });
}

export function startEngineSimulation(): void {
  const run = async () => {
    try {
      const engines = await db.select().from(enginesTable);
      for (const engine of engines) {
        await tickEngine(engine);
      }
    } catch (err) {
      logger.error({ err }, "Engine RUL simulation tick failed");
    }
  };

  void run();
  setInterval(run, TICK_INTERVAL_MS);
}
