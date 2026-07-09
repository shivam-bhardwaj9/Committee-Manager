import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, membersTable } from "@workspace/db";
import {
  CreateMemberBody,
  CreateMemberResponse,
  DeleteMemberParams,
  GetMemberParams,
  GetMemberResponse,
  ListMembersResponse,
  UpdateMemberBody,
  UpdateMemberParams,
  UpdateMemberResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// The Zod response schemas coerce date-only fields to JS Date (z.coerce.date()),
// which then serializes as a full UTC timestamp via res.json/JSON.stringify.
// DB stores date-only strings (YYYY-MM-DD); re-stringify after parse so the
// wire contract stays date-only instead of drifting a day in other timezones.
function toDateOnlyResponse<T extends { dateJoined: Date }>(member: T) {
  return { ...member, dateJoined: member.dateJoined.toISOString().slice(0, 10) };
}

router.get("/members", async (_req, res): Promise<void> => {
  const members = await db
    .select()
    .from(membersTable)
    .orderBy(membersTable.name);
  res.json(
    ListMembersResponse.parse(members).map(toDateOnlyResponse),
  );
});

router.post("/members", async (req, res): Promise<void> => {
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .insert(membersTable)
    .values({
      ...parsed.data,
      dateJoined: parsed.data.dateJoined.toISOString().slice(0, 10),
    })
    .returning();

  res
    .status(201)
    .json(toDateOnlyResponse(CreateMemberResponse.parse(member)));
});

router.get("/members/:id", async (req, res): Promise<void> => {
  const params = GetMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.id, params.data.id));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.json(toDateOnlyResponse(GetMemberResponse.parse(member)));
});

router.patch("/members/:id", async (req, res): Promise<void> => {
  const params = UpdateMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .update(membersTable)
    .set({
      ...parsed.data,
      dateJoined: parsed.data.dateJoined
        ? parsed.data.dateJoined.toISOString().slice(0, 10)
        : undefined,
    })
    .where(eq(membersTable.id, params.data.id))
    .returning();

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.json(toDateOnlyResponse(UpdateMemberResponse.parse(member)));
});

router.delete("/members/:id", async (req, res): Promise<void> => {
  const params = DeleteMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [member] = await db
    .delete(membersTable)
    .where(eq(membersTable.id, params.data.id))
    .returning();

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
