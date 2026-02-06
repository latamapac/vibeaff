import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";

const router = express.Router();

const merchantSchema = z.object({
  name: z.string().min(2),
  website: z.string().url(),
  defaultCommissionPct: z.number().min(0).max(100),
});

const programSchema = z.object({
  name: z.string().min(2),
  attributionWindowDays: z.number().min(1).max(90),
});

router.get("/v1/merchants", authMiddleware, asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const merchants = await prisma.merchant.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(merchants);
}));

router.post("/v1/merchants", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const parsed = merchantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const merchant = await prisma.merchant.create({ data: parsed.data });
  res.status(201).json(merchant);
}));

router.get("/v1/programs", authMiddleware, asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const programs = await prisma.program.findMany({
    include: { merchant: { select: { name: true, defaultCommissionPct: true, website: true } } },
    orderBy: { createdAt: "desc" },
    ...pg,
  });
  res.json(programs);
}));

router.post("/v1/merchants/:id/programs", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const parsed = programSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const merchantId = paramId(req);
  const program = await prisma.program.create({ data: { merchantId, ...parsed.data } });
  res.status(201).json(program);
}));

export default router;
