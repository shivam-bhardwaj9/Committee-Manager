import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { committeeSettingsTable, db } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(committeeSettingsTable).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(committeeSettingsTable)
    .values({ committeeName: "Our Committee", monthlyAmount: "0" })
    .returning();

  return created;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(GetSettingsResponse.parse(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();

  const [updated] = await db
    .update(committeeSettingsTable)
    .set(parsed.data)
    .where(eq(committeeSettingsTable.id, settings.id))
    .returning();

  res.json(UpdateSettingsResponse.parse(updated));
});

export default router;
