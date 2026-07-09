import { Router, type IRouter } from "express";
import { paymentsTable } from "@workspace/db";
import { db } from "@workspace/db";
import {
  ListPaymentsResponse,
  UpsertPaymentBody,
  UpsertPaymentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// datePaid comes out of Zod as a coerced JS Date (or null/undefined); DB
// column is date-only, and responses must stay date-only on the wire too.
function toDateOnlyResponse<T extends { datePaid?: Date | null }>(
  payment: T,
) {
  return {
    ...payment,
    datePaid: payment.datePaid ? payment.datePaid.toISOString().slice(0, 10) : null,
  };
}

router.get("/payments", async (_req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable);
  res.json(ListPaymentsResponse.parse(payments).map(toDateOnlyResponse));
});

router.post("/payments/upsert", async (req, res): Promise<void> => {
  const parsed = UpsertPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { memberId, monthId, isPaid, amountPaid, datePaid } = parsed.data;
  const datePaidStr = datePaid ? datePaid.toISOString().slice(0, 10) : null;

  // Atomic upsert keyed on the (memberId, monthId) unique constraint --
  // avoids the read-then-write race where two concurrent requests for the
  // same cell could both see "no existing row" and collide on insert.
  const [result] = await db
    .insert(paymentsTable)
    .values({
      memberId,
      monthId,
      isPaid,
      amountPaid,
      datePaid: datePaidStr,
    })
    .onConflictDoUpdate({
      target: [paymentsTable.memberId, paymentsTable.monthId],
      set: { isPaid, amountPaid, datePaid: datePaidStr },
    })
    .returning();

  res.json(toDateOnlyResponse(UpsertPaymentResponse.parse(result)));
});

export default router;
