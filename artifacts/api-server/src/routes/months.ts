import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, monthsTable } from "@workspace/db";
import {
  CreateMonthBody,
  CreateMonthResponse,
  DeleteMonthParams,
  ListMonthsResponse,
  UpdateMonthBody,
  UpdateMonthParams,
  UpdateMonthResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/months", async (_req, res): Promise<void> => {
  const months = await db
    .select()
    .from(monthsTable)
    .orderBy(monthsTable.sortKey);
  res.json(ListMonthsResponse.parse(months));
});

router.post("/months", async (req, res): Promise<void> => {
  const parsed = CreateMonthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(monthsTable)
    .where(eq(monthsTable.sortKey, parsed.data.sortKey));

  if (existing) {
    res.status(201).json(CreateMonthResponse.parse(existing));
    return;
  }

  const [month] = await db
    .insert(monthsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(CreateMonthResponse.parse(month));
});

router.patch("/months/:id", async (req, res): Promise<void> => {
  const params = UpdateMonthParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMonthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [month] = await db
    .update(monthsTable)
    .set(parsed.data)
    .where(eq(monthsTable.id, params.data.id))
    .returning();

  if (!month) {
    res.status(404).json({ error: "Month not found" });
    return;
  }

  res.json(UpdateMonthResponse.parse(month));
});

router.delete("/months/:id", async (req, res): Promise<void> => {
  const params = DeleteMonthParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [month] = await db
    .delete(monthsTable)
    .where(eq(monthsTable.id, params.data.id))
    .returning();

  if (!month) {
    res.status(404).json({ error: "Month not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
