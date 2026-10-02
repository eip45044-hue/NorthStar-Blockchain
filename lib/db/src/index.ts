import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let databaseUrl: URL;
try {
  databaseUrl = new URL(connectionString);
} catch {
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
}

if (databaseUrl.protocol !== "postgres:" && databaseUrl.protocol !== "postgresql:") {
  throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol.");
}

const neonSsl = databaseUrl.hostname.endsWith(".neon.tech") && !databaseUrl.searchParams.has("sslmode");
const poolMax = Number(process.env.PG_POOL_MAX ?? 10);
if (!Number.isInteger(poolMax) || poolMax < 1) {
  throw new Error("PG_POOL_MAX must be a positive integer.");
}

export const pool = new Pool({
  connectionString,
  max: poolMax,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
  ...(neonSsl ? { ssl: { rejectUnauthorized: true } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
