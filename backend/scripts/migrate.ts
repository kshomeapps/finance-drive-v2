/**
 * Manual database migration script.
 * DO NOT run auto-migration in production (risk of race conditions).
 * Usage: pnpm db:migrate
 */
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { db } from "../src/db/index.js";
import Database from "better-sqlite3";

const isPostgres = process.env.DATABASE_URL?.startsWith("postgresql");

async function main() {
  console.log("🔄 Running database migrations...");
  try {
    if (isPostgres) {
      await migratePg(db as any, { migrationsFolder: "./drizzle" });
    } else {
      migrateSqlite(db as any, { migrationsFolder: "./drizzle" });
    }
    console.log("✅ Migrations completed successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

main();
