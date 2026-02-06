import crypto from "crypto";
import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";

const router = express.Router();

const promoCodeSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  programId: z.string().min(8),
  affiliateId: z.string().min(8).nullable().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  currency: z.string().min(3).max(3).nullable().optional(),
  minOrderTotal: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const promoUpdateSchema = z.object({
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  status: z.enum(["active", "paused", "expired", "exhausted"]).optional(),
});

// --- CRUD ---

router.get("/v1/promo-codes", authMiddleware, asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const programId = req.query.programId as string | undefined;
  const where = programId ? { programId } : {};
  const codes = await prisma.promoCode.findMany({
    where,
    include: {
      program: { select: { name: true } },
      affiliate: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    ...pg,
  });
  res.json(codes);
}));

router.post("/v1/promo-codes", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const parsed = promoCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.expiresAt) data.expiresAt = new Date(parsed.data.expiresAt);

  const code = await prisma.promoCode.create({ data: data as Parameters<typeof prisma.promoCode.create>[0]["data"] });
  await logAudit(prisma, { action: "promo_code_created", entity: "promo_code", entityId: code.id });
  res.status(201).json(code);
}));

router.patch("/v1/promo-codes/:id", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const parsed = promoUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.expiresAt) data.expiresAt = new Date(parsed.data.expiresAt);

  const code = await prisma.promoCode.update({
    where: { id: paramId(req) },
    data: data as Parameters<typeof prisma.promoCode.update>[0]["data"],
  });
  res.json(code);
}));

router.delete("/v1/promo-codes/:id", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  await prisma.promoCode.delete({ where: { id: paramId(req) } });
  res.status(204).send();
}));

// --- Lookup by code ---

router.get("/v1/promo-codes/:code", authMiddleware, asyncHandler(async (req, res) => {
  const codeStr = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const code = await prisma.promoCode.findUnique({
    where: { code: codeStr.toUpperCase() },
    include: { program: { select: { name: true } } },
  });
  if (!code) {
    return res.status(404).json({ error: "Promo code not found" });
  }
  res.json(code);
}));

// --- Validate at checkout ---

router.post("/v1/promo-codes/validate", asyncHandler(async (req, res) => {
  const schema = z.object({
    code: z.string().min(1),
    orderTotal: z.number().positive(),
    merchantId: z.string().min(8).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code: parsed.data.code.toUpperCase() },
    include: { program: { select: { merchantId: true } } },
  });

  if (!promo) {
    return res.status(404).json({ valid: false, error: "Code not found" });
  }
  if (promo.status !== "active") {
    return res.json({ valid: false, error: `Code is ${promo.status}` });
  }
  if (promo.startsAt && promo.startsAt > new Date()) {
    return res.json({ valid: false, error: "Code not yet active" });
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return res.json({ valid: false, error: "Code has expired" });
  }
  if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    return res.json({ valid: false, error: "Code usage limit reached" });
  }
  if (promo.minOrderTotal && parsed.data.orderTotal < promo.minOrderTotal) {
    return res.json({ valid: false, error: `Minimum order total: $${promo.minOrderTotal}` });
  }
  if (parsed.data.merchantId && promo.program.merchantId !== parsed.data.merchantId) {
    return res.json({ valid: false, error: "Code not valid for this merchant" });
  }

  const discount = promo.discountType === "percentage"
    ? Math.round(parsed.data.orderTotal * (promo.discountValue / 100) * 100) / 100
    : Math.min(promo.discountValue, parsed.data.orderTotal);

  res.json({
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount: discount,
    finalTotal: Math.round((parsed.data.orderTotal - discount) * 100) / 100,
  });
}));

// --- Bulk create ---

router.post("/v1/promo-codes/bulk", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const schema = z.object({
    prefix: z.string().min(2).max(10).toUpperCase(),
    count: z.number().int().min(1).max(500),
    programId: z.string().min(8),
    affiliateId: z.string().min(8).nullable().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive(),
    maxUses: z.number().int().positive().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const codes: string[] = [];
  for (let i = 0; i < parsed.data.count; i++) {
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${parsed.data.prefix}_${suffix}`);
  }

  const data = codes.map((code) => ({
    code,
    programId: parsed.data.programId,
    affiliateId: parsed.data.affiliateId ?? null,
    discountType: parsed.data.discountType,
    discountValue: parsed.data.discountValue,
    maxUses: parsed.data.maxUses ?? null,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  }));

  const result = await prisma.promoCode.createMany({ data });
  await logAudit(prisma, {
    action: "promo_codes_bulk_created",
    entity: "promo_code",
    details: JSON.stringify({ count: result.count, prefix: parsed.data.prefix }),
  });
  res.status(201).json({ created: result.count, codes });
}));

// --- Affiliate's promo codes ---

router.get("/v1/affiliates/:id/promo-codes", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  const pg = paginationParams(req);
  const codes = await prisma.promoCode.findMany({
    where: { affiliateId },
    include: { program: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    ...pg,
  });
  res.json(codes);
}));

export default router;
