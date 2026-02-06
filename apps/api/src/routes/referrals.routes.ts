import crypto from "crypto";
import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";

const router = express.Router();

// --- Generate referral code for an affiliate ---

router.post("/v1/affiliates/:id/referral-code", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
  if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

  if (affiliate.referralCode) {
    return res.json({ referralCode: affiliate.referralCode });
  }

  const code = `ref_${crypto.randomBytes(6).toString("hex")}`;
  const updated = await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { referralCode: code },
  });

  res.json({ referralCode: updated.referralCode });
}));

// --- Get referral info for an affiliate ---

router.get("/v1/affiliates/:id/referrals", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);

  const referrals = await prisma.affiliateReferral.findMany({
    where: { referrerId: affiliateId },
    include: { referred: { select: { id: true, displayName: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { referralCode: true },
  });

  const totalBonus = referrals.reduce((sum, r) => sum + r.totalBonusEarned, 0);

  res.json({
    referralCode: affiliate?.referralCode,
    totalReferrals: referrals.length,
    totalBonusEarned: totalBonus,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredId: r.referredId,
      referredName: r.referred.displayName,
      bonusPct: r.bonusPct,
      totalBonusEarned: r.totalBonusEarned,
      status: r.status,
      joinedAt: r.referred.createdAt,
    })),
  });
}));

// --- Register with referral code (called during affiliate signup) ---

router.post("/v1/referrals/register", authMiddleware, asyncHandler(async (req, res) => {
  const schema = z.object({
    affiliateId: z.string().min(8),
    referralCode: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { affiliateId, referralCode } = parsed.data;

  // Find referrer by code
  const referrer = await prisma.affiliate.findUnique({ where: { referralCode } });
  if (!referrer) return res.status(404).json({ error: "Invalid referral code" });
  if (referrer.id === affiliateId) return res.status(400).json({ error: "Cannot refer yourself" });

  // Check if already referred
  const existing = await prisma.affiliateReferral.findUnique({ where: { referredId: affiliateId } });
  if (existing) return res.status(409).json({ error: "Already referred by someone" });

  const referral = await prisma.affiliateReferral.create({
    data: {
      referrerId: referrer.id,
      referredId: affiliateId,
      bonusPct: 5,
    },
  });

  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { referredById: referrer.id },
  });

  await logAudit(prisma, {
    action: "referral_registered",
    entity: "affiliate_referral",
    entityId: referral.id,
    details: JSON.stringify({ referrerId: referrer.id, referredId: affiliateId }),
  });

  res.status(201).json(referral);
}));

// --- Admin: list all referrals ---

router.get("/v1/referrals", authMiddleware, requireRole("admin"), asyncHandler(async (_req, res) => {
  const referrals = await prisma.affiliateReferral.findMany({
    include: {
      referrer: { select: { displayName: true } },
      referred: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(referrals);
}));

// --- Admin: update bonus percentage ---

router.patch("/v1/referrals/:id", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  const schema = z.object({
    bonusPct: z.number().min(0).max(100).optional(),
    status: z.enum(["active", "paused"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const referral = await prisma.affiliateReferral.update({ where: { id }, data: parsed.data });
  res.json(referral);
}));

export default router;

/**
 * Process referral bonus when a conversion is created.
 * Call this from the conversion handler after commission is calculated.
 */
export async function processReferralBonus(
  affiliateId: string,
  commissionAmount: number,
  currency: string,
) {
  const referral = await prisma.affiliateReferral.findUnique({
    where: { referredId: affiliateId },
  });

  if (!referral || referral.status !== "active" || commissionAmount <= 0) return;

  const bonusAmount = commissionAmount * (referral.bonusPct / 100);
  if (bonusAmount < 0.01) return;

  // Create bonus payout for the referrer
  const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.payout.create({
    data: {
      affiliateId: referral.referrerId,
      amount: bonusAmount,
      currency,
      status: "on_hold",
      holdUntil,
    },
  });

  // Update total bonus earned
  await prisma.affiliateReferral.update({
    where: { id: referral.id },
    data: { totalBonusEarned: { increment: bonusAmount } },
  });

  // Update referrer stats
  await prisma.affiliateStats.upsert({
    where: { affiliateId: referral.referrerId },
    update: { totalEarnings: { increment: bonusAmount } },
    create: { affiliateId: referral.referrerId, totalEarnings: bonusAmount },
  });
}
