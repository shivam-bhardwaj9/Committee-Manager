---
name: Orval/Zod date-only field coercion vs Drizzle date columns
description: Why API responses with format:date fields need re-stringifying before res.json, and why upserts on a unique pair need onConflictDoUpdate.
---

Orval generates Zod response schemas using `z.coerce.date()` for any OpenAPI `format: date` (or date-time) field. If a route does `res.json(SomeResponse.parse(row))` directly, a date-only DB value (stored as a plain `YYYY-MM-DD` string in Postgres via Drizzle's `date` column type) gets coerced to a JS `Date` and then JSON-serializes as a full UTC timestamp — silently breaking the date-only wire contract and risking a day-shift in other timezones.

**Why:** caught in code review after building a full CRUD app (members/months/payments) where every date-bearing response needed this fix.

**How to apply:** after `SomeResponse.parse(row)`, re-stringify any date-only field back to `toISOString().slice(0, 10)` before sending. Also: when an endpoint upserts a row keyed on a unique-constraint pair (e.g. memberId+monthId), use Drizzle's `.onConflictDoUpdate({ target: [...], set: {...} })` instead of a read-then-insert-or-update — the read-then-write pattern races under concurrent requests even though the DB has the unique constraint.
