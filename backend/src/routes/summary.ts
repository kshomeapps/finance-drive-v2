import { Router } from "express";
import { and, eq, like, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { transactions } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

function bookFilter(bookId: string | null | undefined) {
  if (!bookId) return isNull(transactions.bookId);
  return eq(transactions.bookId, bookId);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const { month, bookId } = req.query as Record<string, string>;
  const targetMonth = month || currentMonth();

  const rows = await db.select().from(transactions).where(and(
    eq(transactions.userId, req.userId!),
    bookFilter(bookId || null),
    like(transactions.date, `${targetMonth}%`),
  ));

  const income = rows.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  res.json({
    month: targetMonth,
    totalIncome: round2(income),
    totalExpense: round2(expense),
    balance: round2(income - expense),
    transactionCount: rows.length,
  });
});

router.get("/monthly", authMiddleware, async (req: AuthRequest, res) => {
  const { bookId } = req.query as Record<string, string>;
  const rows = await db.select().from(transactions).where(and(
    eq(transactions.userId, req.userId!),
    bookFilter(bookId || null),
  ));

  const map: Record<string, { income: number; expense: number }> = {};
  for (const row of rows) {
    const m = row.date.slice(0, 7);
    if (!map[m]) map[m] = { income: 0, expense: 0 };
    map[m][row.type] += row.amount;
  }

  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  res.json(months.map(m => ({
    month: m,
    totalIncome: round2(map[m]?.income || 0),
    totalExpense: round2(map[m]?.expense || 0),
    balance: round2((map[m]?.income || 0) - (map[m]?.expense || 0)),
  })));
});

router.get("/categories", authMiddleware, async (req: AuthRequest, res) => {
  const { month, bookId } = req.query as Record<string, string>;
  const conditions = [eq(transactions.userId, req.userId!), bookFilter(bookId || null)];
  if (month) conditions.push(like(transactions.date, `${month}%`));

  const rows = await db.select().from(transactions).where(and(...conditions));
  const map: Record<string, { type: string; total: number; count: number }> = {};

  for (const row of rows) {
    const key = `${row.category}__${row.type}`;
    if (!map[key]) map[key] = { type: row.type, total: 0, count: 0 };
    map[key].total += row.amount;
    map[key].count += 1;
  }

  const result = Object.entries(map).map(([key, val]) => ({
    category: key.split("__")[0],
    type: val.type,
    total: round2(val.total),
    count: val.count,
  })).sort((a, b) => b.total - a.total);

  res.json(result);
});

export default router;
