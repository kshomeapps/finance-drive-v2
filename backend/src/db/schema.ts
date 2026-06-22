import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, real as pgReal, integer as pgInteger, timestamp as pgTimestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { config } from "../config.js";

// ============================================================================
// Schema factory: automatically switches between SQLite and PostgreSQL
// ============================================================================

const isPg = config.isPostgres;

// Users
export const users = isPg
  ? pgTable("users", {
      id: pgInteger("id").primaryKey().generatedAlwaysAsIdentity(),
      email: pgText("email").notNull().unique(),
      passwordHash: pgText("password_hash").notNull(),
      name: pgText("name").notNull(),
      createdAt: pgTimestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    })
  : sqliteTable("users", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      email: text("email").notNull().unique(),
      passwordHash: text("password_hash").notNull(),
      name: text("name").notNull(),
      createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    });

// Refresh Tokens (stored in DB for revocation support)
export const refreshTokens = isPg
  ? pgTable("refresh_tokens", {
      id: pgInteger("id").primaryKey().generatedAlwaysAsIdentity(),
      userId: pgInteger("user_id").notNull().references(() => (users as any).id),
      tokenHash: pgText("token_hash").notNull().unique(),
      expiresAt: pgTimestamp("expires_at", { withTimezone: true }).notNull(),
      createdAt: pgTimestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    })
  : sqliteTable("refresh_tokens", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: integer("user_id").notNull(),
      tokenHash: text("token_hash").notNull().unique(),
      expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
      createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    });

// Books
export const books = isPg
  ? pgTable("books", {
      id: pgText("id").primaryKey(),
      userId: pgInteger("user_id").notNull().references(() => (users as any).id),
      name: pgText("name").notNull(),
      emoji: pgText("emoji").notNull().default("📁"),
      createdAt: pgTimestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    })
  : sqliteTable("books", {
      id: text("id").primaryKey(),
      userId: integer("user_id").notNull(),
      name: text("name").notNull(),
      emoji: text("emoji").notNull().default("📁"),
      createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    });

// Transactions
export const transactions = isPg
  ? pgTable("transactions", {
      id: pgText("id").primaryKey(),
      userId: pgInteger("user_id").notNull().references(() => (users as any).id),
      bookId: pgText("book_id"),
      date: pgText("date").notNull(),
      type: pgText("type", { enum: ["income", "expense"] }).notNull(),
      amount: pgReal("amount").notNull(),
      category: pgText("category").notNull(),
      description: pgText("description").notNull().default(""),
      createdAt: pgTimestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    })
  : sqliteTable("transactions", {
      id: text("id").primaryKey(),
      userId: integer("user_id").notNull(),
      bookId: text("book_id"),
      date: text("date").notNull(),
      type: text("type", { enum: ["income", "expense"] }).notNull(),
      amount: real("amount").notNull(),
      category: text("category").notNull(),
      description: text("description").notNull().default(""),
      createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    });

// Zod schemas
export const insertUserSchema = createInsertSchema(users as any)
  .omit({ id: true, createdAt: true, passwordHash: true })
  .extend({ password: z.string().min(6, "Password must be at least 6 characters") });

export const insertBookSchema = createInsertSchema(books as any).omit({ createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions as any).omit({ createdAt: true });

export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
