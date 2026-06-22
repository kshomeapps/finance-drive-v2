import { Router } from "express";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { books } from "../db/schema.js";
import { insertBookSchema } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router: import("express").Router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const rows = await db.select().from(books).where(eq(books.userId, req.userId!));
  res.json(rows.map(r => ({ ...r, createdAt: (r as any).createdAt?.toISOString?.() || (r as any).createdAt })));
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = insertBookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(", ") });
    return;
  }
  const [row] = await db.insert(books).values({
    id: randomUUID(),
    userId: req.userId!,
    name: parsed.data.name,
    emoji: parsed.data.emoji,
  }).returning();
  res.status(201).json({ ...row, createdAt: (row as any).createdAt?.toISOString?.() || (row as any).createdAt });
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const [row] = await db.update(books)
    .set({ name: req.body.name, emoji: req.body.emoji })
    .where(and(eq(books.id, req.params.id), eq(books.userId, req.userId!)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.json({ ...row, createdAt: (row as any).createdAt?.toISOString?.() || (row as any).createdAt });
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const [row] = await db.delete(books)
    .where(and(eq(books.id, req.params.id), eq(books.userId, req.userId!)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
