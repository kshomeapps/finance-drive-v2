import { Router } from "express";
import { randomUUID } from "crypto";
import { eq, desc, and, like, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { transactions } from "../db/schema.js";
import { insertTransactionSchema } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router: import("express").Router = Router();

function bookFilter(bookId: string | null | undefined) {
  if (!bookId) return isNull(transactions.bookId);
  return eq(transactions.bookId, bookId);
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const { month, type, category, bookId, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(transactions.userId, req.userId!), bookFilter(bookId || null)];
  if (month) conditions.push(like(transactions.date, `${month}%`));
  if (type) conditions.push(eq(transactions.type, type as "income" | "expense"));
  if (category) conditions.push(eq(transactions.category, category));

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(transactions).where(and(...conditions));
  const total = countResult.count;

  const rows = await db.select().from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date))
    .limit(limitNum)
    .offset(offset);

  res.json({
    data: rows.map(r => ({ ...r, createdAt: (r as any).createdAt?.toISOString?.() || (r as any).createdAt })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = insertTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(", ") });
    return;
  }
  const [row] = await db.insert(transactions).values({
    id: randomUUID(),
    userId: req.userId!,
    ...parsed.data,
  }).returning();
  res.status(201).json({ ...row, createdAt: (row as any).createdAt?.toISOString?.() || (row as any).createdAt });
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const updateData: Record<string, unknown> = {};
  ["bookId", "date", "type", "amount", "category", "description"].forEach((k) => {
    if (req.body[k] !== undefined) updateData[k] = req.body[k];
  });

  const [row] = await db.update(transactions)
    .set(updateData)
    .where(and(eq(transactions.id, req.params.id), eq(transactions.userId, req.userId!)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json({ ...row, createdAt: (row as any).createdAt?.toISOString?.() || (row as any).createdAt });
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const [row] = await db.delete(transactions)
    .where(and(eq(transactions.id, req.params.id), eq(transactions.userId, req.userId!)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
