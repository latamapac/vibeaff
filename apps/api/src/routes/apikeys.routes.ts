import crypto from "crypto";
import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";

const router = express.Router();

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `vba_${crypto.randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

// --- List keys for a merchant ---

router.get("/v1/api-keys", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const merchantId = req.query.merchantId as string | undefined;
  const where: Record<string, unknown> = {};
  if (merchantId) where.merchantId = merchantId;

  const keys = await prisma.apiKey.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, merchantId: true, name: true, prefix: true, lastUsedAt: true, status: true, createdAt: true },
  });
  res.json(keys);
}));

// --- Create key ---

router.post("/v1/api-keys", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const schema = z.object({
    merchantId: z.string().min(8),
    name: z.string().min(1).max(100),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { raw, prefix, hash } = generateApiKey();

  const key = await prisma.apiKey.create({
    data: { merchantId: parsed.data.merchantId, name: parsed.data.name, prefix, keyHash: hash, status: "active" },
  });

  await logAudit(prisma, { action: "api_key_created", entity: "api_key", entityId: key.id });

  // Return raw key ONLY on creation (cannot be retrieved again)
  res.status(201).json({ ...key, rawKey: raw });
}));

// --- Revoke key ---

router.post("/v1/api-keys/:id/revoke", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  const key = await prisma.apiKey.update({ where: { id }, data: { status: "revoked" } });
  await logAudit(prisma, { action: "api_key_revoked", entity: "api_key", entityId: id });
  res.json(key);
}));

// --- Delete key ---

router.delete("/v1/api-keys/:id", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  await prisma.apiKey.delete({ where: { id } });
  await logAudit(prisma, { action: "api_key_deleted", entity: "api_key", entityId: id });
  res.json({ deleted: true });
}));

// --- S2S Postback endpoint (authenticated via X-API-Key header) ---

router.post("/v1/postback", asyncHandler(async (req, res) => {
  const rawKey = req.headers["x-api-key"] as string | undefined;
  if (!rawKey) {
    return res.status(401).json({ error: "Missing X-API-Key header" });
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const apiKey = await prisma.apiKey.findFirst({ where: { keyHash, status: "active" } });
  if (!apiKey) {
    return res.status(401).json({ error: "Invalid or revoked API key" });
  }

  // Touch lastUsedAt
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  const schema = z.object({
    click_id: z.string().optional(),
    promo_code: z.string().optional(),
    order_id: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().min(3).max(3).default("USD"),
    program_id: z.string().optional(),
  });

  // Accept both body and query params
  const input = { ...req.query, ...req.body };
  // Coerce amount from query string
  if (typeof input.amount === "string") input.amount = parseFloat(input.amount);

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { click_id, promo_code, order_id, amount, currency, program_id } = parsed.data;

  // Resolve attribution: click_id -> link -> affiliate + program
  let affiliateId: string | null = null;
  let programId = program_id ?? null;
  let clickId = click_id ?? null;
  let promoCodeId: string | null = null;

  if (clickId) {
    const click = await prisma.click.findUnique({
      where: { id: clickId },
      include: { link: { select: { affiliateId: true, programId: true } } },
    });
    if (click?.link) {
      affiliateId = click.link.affiliateId;
      if (!programId) programId = click.link.programId;
    }
  }

  // If promo code provided, use for attribution (fallback or override)
  if (promo_code) {
    const code = await prisma.promoCode.findUnique({ where: { code: promo_code } });
    if (code && code.status === "active") {
      promoCodeId = code.id;
      if (code.affiliateId && !affiliateId) affiliateId = code.affiliateId;
      if (!programId) programId = code.programId;

      // Increment usage
      await prisma.promoCode.update({ where: { id: code.id }, data: { currentUses: { increment: 1 } } });
    }
  }

  if (!affiliateId || !programId) {
    return res.status(400).json({ error: "Cannot resolve attribution. Provide a valid click_id or promo_code." });
  }

  // Look up merchant commission
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { merchant: { select: { id: true, defaultCommissionPct: true } } },
  });

  if (!program) {
    return res.status(404).json({ error: "Program not found" });
  }

  // Verify key belongs to the same merchant
  if (apiKey.merchantId !== program.merchantId) {
    return res.status(403).json({ error: "API key does not belong to this program's merchant" });
  }

  const { resolveCommission } = await import("../commission");
  const fallbackPct = program.merchant?.defaultCommissionPct ?? 0;
  const { commissionPct, commissionAmount } = await resolveCommission(prisma, programId, affiliateId, amount, fallbackPct);

  const conversion = await prisma.conversion.create({
    data: {
      programId,
      affiliateId,
      clickId,
      promoCodeId,
      orderId: order_id,
      orderTotal: amount,
      currency,
      commissionPct,
      commissionAmount,
      status: "pending_verification",
      ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "",
      userAgent: req.headers["user-agent"] ?? "S2S",
    },
  });

  // Auto-create payout
  if (commissionAmount > 0) {
    const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const payout = await prisma.payout.create({
      data: { affiliateId, amount: commissionAmount, currency, status: "on_hold", holdUntil },
    });
    await prisma.conversion.update({ where: { id: conversion.id }, data: { payoutId: payout.id } });
  }

  // Update stats
  await prisma.affiliateStats.upsert({
    where: { affiliateId },
    update: { totalConversions: { increment: 1 } },
    create: { affiliateId, totalConversions: 1 },
  });

  // Dispatch webhook
  const { dispatchWebhook } = await import("../webhooks");
  dispatchWebhook(prisma, program.merchantId, "conversion.created", {
    conversionId: conversion.id, orderId: order_id, orderTotal: amount,
    currency, commissionPct, commissionAmount, source: "s2s_postback",
  }).catch(() => {});

  res.status(201).json({
    conversionId: conversion.id,
    orderId: order_id,
    commissionPct,
    commissionAmount,
    status: conversion.status,
  });
}));

export default router;
