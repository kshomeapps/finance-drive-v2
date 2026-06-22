import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "sqlite://./data.sqlite";
const isPostgres = dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres");

if (process.env.NODE_ENV === "production" && !isPostgres) {
  console.error("ERROR: Production environment must use PostgreSQL. SQLite is ephemeral on most cloud platforms.");
  process.exit(1);
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres
    ? { url: dbUrl }
    : { url: dbUrl },
});
