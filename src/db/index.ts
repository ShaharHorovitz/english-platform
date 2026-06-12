import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy it from Supabase → Connect (see README).",
  );
}

// `prepare: false` is required for Supabase's pooler. Cache the client on
// globalThis so Next.js dev HMR reuses ONE pool instead of spawning a new one
// per reload (which exhausts the pooler's client limit). `max` caps the pool.
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(connectionString, { prepare: false, max: 5, idle_timeout: 20 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, {
  schema: { ...schema, ...relations },
});
