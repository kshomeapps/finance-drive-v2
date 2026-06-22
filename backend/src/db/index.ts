import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { Pool } from "pg";
import { config } from "../config.js";
import * as schema from "./schema.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (config.isPostgres) {
  const pool = new Pool({ connectionString: config.databaseUrl });
  db = drizzle(pool, { schema });
  console.log("[DB] Connected to PostgreSQL");
} else {
  const filePath = config.databaseUrl.replace("sqlite://", "");
  const sqlite = new Database(filePath);
  sqlite.pragma("journal_mode = WAL");
  db = drizzleSqlite(sqlite, { schema });
  console.log("[DB] Connected to SQLite (", filePath, ")");
}

export { db };
