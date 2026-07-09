import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, hazardsTable, timelineEventsTable } from "@workspace/db";
import { ListActivityQueryParams, ListActivityResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const query = ListActivityQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 50;

  const rows = await db
    .select({ event: timelineEventsTable, hazardTitle: hazardsTable.title })
    .from(timelineEventsTable)
    .innerJoin(hazardsTable, eq(timelineEventsTable.hazardId, hazardsTable.id))
    .orderBy(desc(timelineEventsTable.timestamp))
    .limit(limit);

  const result = rows.map((row) => ({
    id: row.event.id,
    hazardId: row.event.hazardId,
    hazardTitle: row.hazardTitle,
    eventType: row.event.eventType,
    description: row.event.description,
    timestamp: row.event.timestamp.toISOString(),
  }));

  res.json(ListActivityResponse.parse(result));
});

export default router;
