import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { membersTable } from "./members";

export const monthsTable = pgTable("months", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  sortKey: text("sort_key").notNull().unique(),
  potWinnerMemberId: integer("pot_winner_member_id").references(
    () => membersTable.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMonthSchema = createInsertSchema(monthsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMonth = z.infer<typeof insertMonthSchema>;
export type Month = typeof monthsTable.$inferSelect;
