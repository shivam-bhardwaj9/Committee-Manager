import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Hosted Postgres providers (Neon, Render, etc.) require verified SSL;
// Replit's built-in Postgres does not use SSL. Rather than guessing from the
// hostname (fragile — breaks for Docker/internal dev hosts), require an
// explicit opt-in via DB_SSL_MODE:
//   - unset / "disable" (default): no SSL — correct for Replit's built-in DB
//   - "require": verified TLS (certificate validation on) — use for Neon,
//     Render, or any other hosted provider
//   - "no-verify": TLS without certificate validation — only for providers
//     with self-signed certs that can't be verified; avoid unless necessary
const sslMode = process.env.DB_SSL_MODE ?? "disable";

let ssl: pg.PoolConfig["ssl"];
switch (sslMode) {
  case "disable":
    ssl = undefined;
    break;
  case "require":
    ssl = { rejectUnauthorized: true };
    break;
  case "no-verify":
    ssl = { rejectUnauthorized: false };
    break;
  default:
    throw new Error(
      `Invalid DB_SSL_MODE "${sslMode}". Expected "disable", "require", or "no-verify".`,
    );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
