import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  sensorReadingsTable,
  sensorsTable,
  zonesTable,
} from "@workspace/db";
import {
  GetSensorHistoryParams,
  GetSensorHistoryResponse,
  ListSensorsQueryParams,
  ListSensorsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sensors", async (req, res): Promise<void> => {
  const query = ListSensorsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.zoneId) {
    conditions.push(eq(sensorsTable.zoneId, query.data.zoneId));
  }
  if (query.data.sensorType) {
    conditions.push(eq(sensorsTable.sensorType, query.data.sensorType));
  }

  const rows = await db
    .select({
      id: sensorsTable.id,
      name: sensorsTable.name,
      sensorType: sensorsTable.sensorType,
      zoneId: sensorsTable.zoneId,
      zoneName: zonesTable.name,
      unit: sensorsTable.unit,
    })
    .from(sensorsTable)
    .innerJoin(zonesTable, eq(sensorsTable.zoneId, zonesTable.id))
    .where(conditions.length ? and(...conditions) : undefined);

  const result = [];
  for (const sensor of rows) {
    const [latest] = await db
      .select()
      .from(sensorReadingsTable)
      .where(eq(sensorReadingsTable.sensorId, sensor.id))
      .orderBy(desc(sensorReadingsTable.timestamp))
      .limit(1);

    result.push({
      ...sensor,
      latestValue: latest?.value ?? 0,
      status: latest?.status ?? "normal",
      updatedAt: (latest?.timestamp ?? new Date()).toISOString(),
    });
  }

  res.json(ListSensorsResponse.parse(result));
});

router.get("/sensors/:id/history", async (req, res): Promise<void> => {
  const params = GetSensorHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sensor] = await db
    .select()
    .from(sensorsTable)
    .where(eq(sensorsTable.id, params.data.id));

  if (!sensor) {
    res.status(404).json({ error: "Sensor not found" });
    return;
  }

  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.sensorId, params.data.id))
    .orderBy(asc(sensorReadingsTable.timestamp));

  res.json(GetSensorHistoryResponse.parse(readings));
});

export default router;
