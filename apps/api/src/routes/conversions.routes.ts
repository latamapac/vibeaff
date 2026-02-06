import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paginationParams } from "../shared";
import { authMiddleware } from "../auth";
import { checkConversionVelocity, checkSelfReferral, computeFraudScore } from "../fraud";
import { resolveCommission } from "../commission";
import { logAudit } from "../audit";
import { sendConversionFlaggedEmail } from "../email";
import { dispatchWebhook } from "../webhooks";
import { processReferralBonus } from "./referrals.routes";

const router = express.Router();

const conversionSchema = z.object({
  programId: z.string().min(8),
  affiliateId: z.string().min(8),
  clickId: z.string().optional(),
  orderId: z.string().min(3),
  orderTotal: z.number().positive(),
  currency: z.string().min(3).max(3),
});

router.get("/v1/conversions", authMiddleware, asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const conversions = await prisma.conversion.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(conversions);
}));

router.post("/v1/conversions", authMiddleware, asyncHandler(async (req, res) => {
  const parsed = conversionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "";
  const ua = req.headers["user-agent"] ?? "";

  const velocityCheck = await checkConversionVelocity(prisma, parsed.data.affiliateId);

  let selfReferralOk = true;
  let conversionDelaySeconds = 999;
  if (parsed.data.clickId) {
    const click = await prisma.click.findUnique({ where: { id: parsed.data.clickId } });
    if (click) {
      const selfCheck = checkSelfReferral(parsed.data.affiliateId, click.ipAddress, ip);
      selfReferralOk = selfCheck.ok;
      conversionDelaySeconds = Math.floor((Date.now() - click.createdAt.getTime()) / 1000);
    }
  }

  const fraudScore = computeFraudScore({ velocityOk: velocityCheck.ok, selfReferralOk, conversionDelaySeconds });
  const status = fraudScore >= 50 ? "flagged" : "pending_verification";

  const program = await prisma.program.findUnique({
    where: { id: parsed.data.programId },
    include: { merchant: { select: { defaultCommissionPct: true } } },
  });
  const fallbackPct = program?.merchant?.defaultCommissionPct ?? 0;
  const { commissionPct, commissionAmount } = await resolveCommission(
    prisma, parsed.data.programId, parsed.data.affiliateId, parsed.data.orderTotal, fallbackPct,
  );

  const conversion = await prisma.conversion.create({
    data: { ...parsed.data, commissionPct, commissionAmount, ipAddress: ip, userAgent: ua, status },
  });

  if (status !== "flagged") {
    await prisma.affiliateStats.upsert({
      where: { affiliateId: parsed.data.affiliateId },
      update: { totalConversions: { increment: 1 } },
      create: { affiliateId: parsed.data.affiliateId, totalConversions: 1 },
    });

    if (commissionAmount > 0) {
      const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const payout = await prisma.payout.create({
        data: { affiliateId: parsed.data.affiliateId, amount: commissionAmount, currency: parsed.data.currency, status: "on_hold", holdUntil },
      });
      await prisma.conversion.update({ where: { id: conversion.id }, data: { payoutId: payout.id } });
      await logAudit(prisma, { action: "payout_auto_created", entity: "payout", entityId: payout.id, details: JSON.stringify({ conversionId: conversion.id, commissionAmount }) });
    }
  }

  if (status === "flagged") {
    const reason = !velocityCheck.ok ? "Velocity threshold exceeded" : !selfReferralOk ? "Possible self-referral detected" : "High fraud score";
    sendConversionFlaggedEmail("admin@vibeaff.com", conversion.id, reason).catch(() => {});
  }

  // Process referral bonus for the affiliate's referrer
  if (status !== "flagged" && commissionAmount > 0) {
    processReferralBonus(parsed.data.affiliateId, commissionAmount, parsed.data.currency).catch(() => {});
  }

  await logAudit(prisma, {
    action: "conversion_created",
    entity: "conversion",
    entityId: conversion.id,
    details: JSON.stringify({ fraudScore, status, commissionPct, commissionAmount }),
    ipAddress: ip,
  });

  // Dispatch webhook events
  const merchantId = program?.merchantId;
  if (merchantId) {
    dispatchWebhook(prisma, merchantId, "conversion.created", {
      conversionId: conversion.id, orderId: parsed.data.orderId, orderTotal: parsed.data.orderTotal,
      currency: parsed.data.currency, commissionPct, commissionAmount, status,
    }).catch(() => {});

    if (status === "flagged") {
      dispatchWebhook(prisma, merchantId, "conversion.flagged", {
        conversionId: conversion.id, orderId: parsed.data.orderId, fraudScore,
      }).catch(() => {});
    }
  }

  res.status(202).json({ ...conversion, fraudScore, commissionPct, commissionAmount });
}));

export default router;
