import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma, asyncHandler } from "../shared";
import { hashPassword, comparePassword, signToken, authMiddleware } from "../auth";
import { logAudit } from "../audit";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later" },
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "partner", "affiliate"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/v1/auth/register", authLimiter, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash, role: parsed.data.role ?? "affiliate" },
  });
  const token = signToken({ userId: user.id, email: user.email, role: user.role as "admin" | "partner" | "affiliate" });
  await logAudit(prisma, { userId: user.id, action: "register", entity: "user", entityId: user.id });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
}));

router.post("/v1/auth/login", authLimiter, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role as "admin" | "partner" | "affiliate" });
  await logAudit(prisma, { userId: user.id, action: "login", entity: "user", entityId: user.id });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}));

router.get("/v1/auth/me", authMiddleware, (req, res) => {
  const user = (req as express.Request & { user: { userId: string; email: string; role: string } }).user;
  res.json(user);
});

export default router;
