# Committee Manager

A digital ledger for treasurers running a rotating savings committee (chit fund / BC / samiti): tracks members, monthly contributions, and pot winners.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/committee-manager run dev` — run the frontend (artifact preview path `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (used instead of the SQLite in the original spec, per project convention)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) generates `@workspace/api-client-react` (React Query hooks) and `@workspace/api-zod` (Zod schemas)
- Frontend: React + Vite, Tailwind, shadcn-style UI primitives
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract (settings, members, months, payments, dashboard)
- `lib/db/src/schema/` — Drizzle table definitions: `settings.ts`, `members.ts`, `months.ts`, `payments.ts`
- `artifacts/api-server/src/routes/` — Express route handlers, one file per resource
- `artifacts/committee-manager/src/pages/` — Dashboard, Ledger (payment grid), Members, Settings pages
- `artifacts/committee-manager/src/index.css` — warm paper/ledger theme tokens (Playfair Display + Space Mono)

## Architecture decisions

- Postgres/Drizzle substituted for the SQLite called out in the original spec, per house convention.
- `Payment` rows are unique per `(memberId, monthId)`; the upsert endpoint uses `onConflictDoUpdate` for atomicity instead of a read-then-write check.
- Zod response schemas coerce `format: date` fields to JS `Date` (via `z.coerce.date()`), but the DB stores date-only strings. Routes re-stringify to `YYYY-MM-DD` before sending the response so the wire contract stays date-only (see `toDateOnlyResponse` helpers in `members.ts`/`payments.ts`).
- Pot winner is modeled as `potWinnerMemberId` on `Month`, set via `PATCH /months/{id}`, not a separate table.
- "Current month" for the dashboard is simply the most recently tracked month (last by `sortKey`), not tied to the calendar date.
- Members missing 2+ of the most recent tracked months are flagged in the Ledger UI (red accent) so the treasurer notices at a glance.

## Product

- Dashboard: collected/pending totals for the current month, list of pending members, member/month counts.
- Ledger: payment grid (members × months), click a cell to mark paid/pending with amount + date; add new months; set pot winner per month.
- Members: CRUD roster (name, phone, date joined) with delete confirmation.
- Settings: committee name and default monthly contribution amount.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before touching routes/frontend that depend on the generated types.
- Date-only API fields need the `toDateOnlyResponse` treatment in routes — don't `res.json()` a raw Zod-parsed object that contains `Date` for a date-only field, or the wire format silently becomes a full timestamp.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
