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

// `prepare: false` is required for Supabase's transaction-mode connection
// pooler, which does not support prepared statements.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, {
  schema: { ...schema, ...relations },
});
