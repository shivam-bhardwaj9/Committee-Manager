import { numeric, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const committeeSettingsTable = pgTable("committee_settings", {
  id: serial("id").primaryKey(),
  committeeName: text("committee_name").notNull().default("Our Committee"),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
});

export const insertCommitteeSettingsSchema = createInsertSchema(
  committeeSettingsTable,
).omit({ id: true });
export type InsertCommitteeSettings = z.infer<
  typeof insertCommitteeSettingsSchema
>;
export type CommitteeSettingsRow = typeof committeeSettingsTable.$inferSelect;
