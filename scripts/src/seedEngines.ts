import { db, engineReadingsTable, enginesTable } from "@workspace/db";
import { predictRul, turbofanDemoTrajectories } from "@workspace/ml-models";

async function main() {
  console.log("Seeding turbofan RUL engine fleet...");

  const engineNames = [
    "Engine 01 — Fan Assembly A",
    "Engine 02 — Fan Assembly B",
    "Engine 03 — Compressor Stage 1",
    "Engine 04 — Compressor Stage 2",
    "Engine 05 — Auxiliary Power Unit",
    "Engine 06 — Reserve Unit",
  ];

  const units = Object.keys(turbofanDemoTrajectories);
  const engines: (typeof enginesTable.$inferInsert)[] = [];
  const readingRows: (typeof engineReadingsTable.$inferInsert)[] = [];

  units.forEach((unit, idx) => {
    const traj = turbofanDemoTrajectories[unit as keyof typeof turbofanDemoTrajectories];
    const engineId = `eng-${unit}`;
    // Start each engine partway through its recorded trajectory so the fleet
    // shows a realistic mix of health states from the first screen load.
    const startIndex = Math.floor(traj.cycles.length * 0.4);
    const currentFeatures = traj.features[startIndex] ?? traj.features[0];
    const { predictedRul } = predictRul([...currentFeatures]);

    const status =
      predictedRul > 80 ? "nominal" : predictedRul > 40 ? "watch" : "critical";

    engines.push({
      id: engineId,
      name: engineNames[idx] ?? `Engine ${unit}`,
      datasetUnit: Number(unit),
      totalCycles: traj.cycles.length,
      currentCycleIndex: startIndex,
      predictedRul,
      trueFinalRul: traj.finalTrueRUL,
      status,
    });

    // Seed a short history leading up to the starting point so the detail
    // page has an initial trend line, not just a single point.
    const historyStart = Math.max(0, startIndex - 10);
    for (let i = historyStart; i <= startIndex; i++) {
      const feat = traj.features[i];
      if (!feat) continue;
      const { predictedRul: histRul } = predictRul([...feat]);
      readingRows.push({
        id: `eng-rdg-${engineId}-${i}`,
        engineId,
        cycle: traj.cycles[i] ?? i,
        predictedRul: histRul,
        timestamp: new Date(Date.now() - (startIndex - i) * 60_000),
      });
    }
  });

  await db.insert(enginesTable).values(engines).onConflictDoNothing();
  await db.insert(engineReadingsTable).values(readingRows).onConflictDoNothing();

  console.log(`Seeded ${engines.length} engines with ${readingRows.length} history points.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
