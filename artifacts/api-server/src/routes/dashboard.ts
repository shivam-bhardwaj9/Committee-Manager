import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  committeeSettingsTable,
  db,
  membersTable,
  monthsTable,
  paymentsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(committeeSettingsTable).limit(1);
  const monthlyAmount = settings ? Number(settings.monthlyAmount) : 0;

  const members = await db.select().from(membersTable);
  const months = await db
    .select()
    .from(monthsTable)
    .orderBy(monthsTable.sortKey);
  const payments = await db.select().from(paymentsTable);

  const currentMonth = months[months.length - 1] ?? null;

  let totalCollectedThisMonth = 0;
  let pendingMemberNames: string[] = [];

  if (currentMonth) {
    const paymentsForMonth = payments.filter(
      (p) => p.monthId === currentMonth.id,
    );
    const paidMemberIds = new Set(
      paymentsForMonth.filter((p) => p.isPaid).map((p) => p.memberId),
    );

    totalCollectedThisMonth = paymentsForMonth
      .filter((p) => p.isPaid)
      .reduce((sum, p) => sum + Number(p.amountPaid), 0);

    pendingMemberNames = members
      .filter((m) => !paidMemberIds.has(m.id))
      .map((m) => m.name);
  } else {
    pendingMemberNames = members.map((m) => m.name);
  }

  const pendingMemberCount = pendingMemberNames.length;
  const totalPendingAmountThisMonth = pendingMemberCount * monthlyAmount;

  const summary = {
    currentMonthLabel: currentMonth?.label ?? null,
    totalCollectedThisMonth: totalCollectedThisMonth.toFixed(2),
    totalPendingAmountThisMonth: totalPendingAmountThisMonth.toFixed(2),
    pendingMemberCount,
    pendingMemberNames,
    totalMembers: members.length,
    totalMonthsTracked: months.length,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
