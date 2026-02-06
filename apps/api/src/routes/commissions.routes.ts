import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";

const router = express.Router();

const ruleSchema = z.object({
  programId: z.string().min(8),
  affiliateId: z.string().min(8).nullable().optional(),
  type: z.enum(["percentage", "fixed", "tiered"]),
  value: z.number().nullable().optional(),
  tiers: z.any().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const ruleUpdateSchema = z.object({
  type: z.enum(["percentage", "fixed", "tiered"]).optional(),
  value: z.number().nullable().optional(),
  tiers: z.any().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// --- List commission rules ---

router.get("/v1/commission-rules", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const programId = req.query.programId as string | undefined;
  const where = programId ? { programId } : {};
  const rules = await prisma.commissionRule.findMany({
    where,
    include: {
      program: { select: { name: true } },
      affiliate: { select: { displayName: true } },
    },
    orderBy: [{ programId: "asc" }, { priority: "desc" }],
    ...pg,
  });
  res.json(rules);
}));

// --- Create commission rule ---

router.post("/v1/commission-rules", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const parsed = ruleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.expiresAt) data.expiresAt = new Date(parsed.data.expiresAt);

  const rule = await prisma.commissionRule.create({ data: data as Parameters<typeof prisma.commissionRule.create>[0]["data"] });
  await logAudit(prisma, { action: "commission_rule_created", entity: "commission_rule", entityId: rule.id });
  res.status(201).json(rule);
}));

// --- Update commission rule ---

router.patch("/v1/commission-rules/:id", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const parsed = ruleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.expiresAt) data.expiresAt = new Date(parsed.data.expiresAt);

  const rule = await prisma.commissionRule.update({
    where: { id: paramId(req) },
    data: data as Parameters<typeof prisma.commissionRule.update>[0]["data"],
  });
  await logAudit(prisma, { action: "commission_rule_updated", entity: "commission_rule", entityId: rule.id });
  res.json(rule);
}));

// --- Delete commission rule ---

router.delete("/v1/commission-rules/:id", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  await prisma.commissionRule.delete({ where: { id } });
  await logAudit(prisma, { action: "commission_rule_deleted", entity: "commission_rule", entityId: id });
  res.status(204).send();
}));

// --- Get rules for a specific program ---

router.get("/v1/programs/:id/commission-rules", authMiddleware, asyncHandler(async (req, res) => {
  const programId = paramId(req);
  const rules = await prisma.commissionRule.findMany({
    where: { programId },
    include: { affiliate: { select: { displayName: true } } },
    orderBy: { priority: "desc" },
  });
  res.json(rules);
}));

export default router;
