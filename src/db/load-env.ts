/**
 * Side-effect module: loads .env.local for standalone Node scripts (seed,
 * drizzle-kit migrations run via tsx). Next.js loads .env.local automatically,
 * so this is only needed for CLI scripts.
 *
 * Import this FIRST — before any module that reads process.env at load time:
 *   import "./load-env";
 *   import { db } from "./index";
 */
import { config } from "dotenv";

config({ path: ".env.local" });
