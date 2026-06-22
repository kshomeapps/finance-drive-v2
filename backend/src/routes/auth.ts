import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
import { insertUserSchema } from "../db/schema.js";
import { config } from "../config.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router: import("express").Router = Router();

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
  const isProd = config.isProduction;
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  });
}

function clearAuthCookies(res: any) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
}

router.post("/register", authLimiter, async (req, res) => {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(", ") });
    return;
  }

  const existing = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(String(parsed.data.password), 12);
  const [result] = await db.insert(users).values({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
  }).returning();

  const accessToken = jwt.sign({ userId: result.id }, config.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const rawRefresh = randomUUID();
  const refreshTokenHash = await bcrypt.hash(rawRefresh, 10);

  await db.insert(refreshTokens).values({
    userId: result.id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  setAuthCookies(res, accessToken, rawRefresh);
  res.json({ user: { id: result.id, email: result.email, name: result.name } });
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const accessToken = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const rawRefresh = randomUUID();
  const refreshTokenHash = await bcrypt.hash(rawRefresh, 10);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  setAuthCookies(res, accessToken, rawRefresh);
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

router.post("/refresh", async (req, res) => {
  const rawRefresh = req.cookies?.refreshToken;
  if (!rawRefresh) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  // Find all non-expired tokens for this user family (simplified: we scan recent tokens)
  const tokens = await db.select().from(refreshTokens)
    .where(gt(refreshTokens.expiresAt, new Date()))
    .limit(100);

  let matched: any = null;
  for (const t of tokens) {
    if (await bcrypt.compare(rawRefresh, t.tokenHash)) {
      matched = t;
      break;
    }
  }

  if (!matched) {
    clearAuthCookies(res);
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  // Rotate: delete old, issue new
  await db.delete(refreshTokens).where(eq(refreshTokens.id, matched.id));

  const accessToken = jwt.sign({ userId: matched.userId }, config.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const newRawRefresh = randomUUID();
  const newRefreshHash = await bcrypt.hash(newRawRefresh, 10);

  await db.insert(refreshTokens).values({
    userId: matched.userId,
    tokenHash: newRefreshHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  setAuthCookies(res, accessToken, newRawRefresh);
  res.json({ ok: true });
});

router.post("/logout", async (req, res) => {
  const rawRefresh = req.cookies?.refreshToken;
  if (rawRefresh) {
    const tokens = await db.select().from(refreshTokens).limit(200);
    for (const t of tokens) {
      if (await bcrypt.compare(rawRefresh, t.tokenHash)) {
        await db.delete(refreshTokens).where(eq(refreshTokens.id, t.id));
        break;
      }
    }
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});


router.put("/profile", async (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const [updated] = await db.update(users)
      .set({ name: name.trim() })
      .where(eq(users.id, decoded.userId))
      .returning();
    res.json({ id: updated.id, email: updated.email, name: updated.name });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.put("/password", async (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, decoded.userId));
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
