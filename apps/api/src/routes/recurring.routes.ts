import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { resolveCommission } from "../commission";
import { logAudit } from "../audit";
import { dispatchWebhook } from "../webhooks";

const router = express.Router();

/**
 * POST /v1/recurring - Record a recurring payment for an existing subscription.
 * Links back to the original conversion via subscriptionId.
 */
router.post("/v1/recurring", authMiddleware, asyncHandler(async (req, res) => {
  const schema = z.object({
    subscriptionId: z.string().min(1),
    orderId: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().min(3).max(3),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Find the original conversion for this subscription
  const original = await prisma.conversion.findFirst({
    where: { subscriptionId: parsed.data.subscriptionId, recurringIndex: 0 },
    include: { program: { include: { merchant: { select: { id: true, defaultCommissionPct: true } } } } },
  });

  if (!original) {
    return res.status(404).json({ error: "Original subscription conversion not found. Create initial conversion with subscriptionId first." });
  }

  // Count existing recurring payments
  const existingCount = await prisma.conversion.count({
    where: { subscriptionId: parsed.data.subscriptionId },
  });

  // Resolve commission (may use recurring-specific rules)
  const fallbackPct = original.program.merchant.defaultCommissionPct;
  const { commissionPct, commissionAmount } = await resolveCommission(
    prisma, original.programId, original.affiliateId, parsed.data.amount, fallbackPct,
  );

  const conversion = await prisma.conversion.create({
    data: {
      programId: original.programId,
      affiliateId: original.affiliateId,
      clickId: original.clickId,
      promoCodeId: original.promoCodeId,
      orderId: parsed.data.orderId,
      orderTotal: parsed.data.amount,
      currency: parsed.data.currency,
      commissionPct,
      commissionAmount,
      status: "pending_verification",
      isRecurring: true,
      recurringParentId: original.id,
      recurringIndex: existingCount,
      subscriptionId: parsed.data.subscriptionId,
    },
  });

  // Auto-create payout
  if (commissionAmount > 0) {
    const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const payout = await prisma.payout.create({
      data: { affiliateId: original.affiliateId, amount: commissionAmount, currency: parsed.data.currency, status: "on_hold", holdUntil },
    });
    await prisma.conversion.update({ where: { id: conversion.id }, data: { payoutId: payout.id } });
  }

  // Update stats
  await prisma.affiliateStats.upsert({
    where: { affiliateId: original.affiliateId },
    update: { totalConversions: { increment: 1 } },
    create: { affiliateId: original.affiliateId, totalConversions: 1 },
  });

  // Webhook
  dispatchWebhook(prisma, original.program.merchantId, "conversion.created", {
    conversionId: conversion.id, orderId: parsed.data.orderId, orderTotal: parsed.data.amount,
    currency: parsed.data.currency, commissionPct, commissionAmount, source: "recurring",
    subscriptionId: parsed.data.subscriptionId, recurringIndex: existingCount,
  }).catch(() => {});

  await logAudit(prisma, {
    action: "recurring_conversion_created",
    entity: "conversion",
    entityId: conversion.id,
    details: JSON.stringify({ subscriptionId: parsed.data.subscriptionId, recurringIndex: existingCount }),
  });

  res.status(201).json(conversion);
}));

// --- List recurring conversions for a subscription ---

router.get("/v1/recurring/:subscriptionId", authMiddleware, asyncHandler(async (req, res) => {
  const subscriptionId = req.params.subscriptionId as string;
  const conversions = await prisma.conversion.findMany({
    where: { subscriptionId },
    orderBy: { recurringIndex: "asc" },
  });
  res.json(conversions);
}));

// --- Subscription summary for admin ---

router.get("/v1/subscriptions", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const pg = paginationParams(req);

  const subscriptions = await prisma.conversion.groupBy({
    by: ["subscriptionId"],
    where: { subscriptionId: { not: null } },
    _count: true,
    _sum: { orderTotal: true, commissionAmount: true },
    orderBy: { _count: { subscriptionId: "desc" } },
    take: pg.take,
  });

  res.json(subscriptions.filter((s: { subscriptionId: string | null }) => s.subscriptionId).map((s) => ({
    subscriptionId: s.subscriptionId,
    payments: s._count,
    totalRevenue: s._sum.orderTotal ?? 0,
    totalCommission: s._sum.commissionAmount ?? 0,
  })));
}));

export default router;
