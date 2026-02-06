import crypto from "crypto";
import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";
import { sendPayoutReleasedEmail } from "../email";
import { dispatchWebhook } from "../webhooks";

const router = express.Router();

router.get("/v1/payouts", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const payouts = await prisma.payout.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(payouts);
}));

router.post("/v1/payouts", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const schema = z.object({
    affiliateId: z.string().min(8),
    amount: z.number().positive(),
    currency: z.string().min(3).max(3),
    holdDays: z.number().min(0).max(30).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const holdDays = parsed.data.holdDays ?? 7;
  const holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
  const payout = await prisma.payout.create({
    data: { affiliateId: parsed.data.affiliateId, amount: parsed.data.amount, currency: parsed.data.currency, status: "on_hold", holdUntil },
  });
  await logAudit(prisma, { action: "payout_created", entity: "payout", entityId: payout.id });
  res.status(201).json(payout);
}));

router.post("/v1/payouts/:id/approve", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) {
    return res.status(404).json({ error: "Payout not found" });
  }
  if (payout.status !== "on_hold") {
    return res.status(400).json({ error: `Cannot approve payout in status: ${payout.status}` });
  }
  if (payout.holdUntil && payout.holdUntil > new Date()) {
    return res.status(400).json({ error: "Hold period has not expired", holdUntil: payout.holdUntil });
  }
  const updated = await prisma.payout.update({ where: { id: payoutId }, data: { status: "approved" } });
  await prisma.affiliateStats.upsert({
    where: { affiliateId: payout.affiliateId },
    update: { totalEarnings: { increment: payout.amount } },
    create: { affiliateId: payout.affiliateId, totalEarnings: payout.amount },
  });
  await logAudit(prisma, { action: "payout_approved", entity: "payout", entityId: payoutId });
  res.json(updated);
}));

router.post("/v1/payouts/:id/hold", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const updated = await prisma.payout.update({ where: { id: payoutId }, data: { status: "on_hold" } });
  await logAudit(prisma, { action: "payout_held", entity: "payout", entityId: payoutId });
  res.json(updated);
}));

router.post("/v1/payouts/:id/release", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) {
    return res.status(404).json({ error: "Payout not found" });
  }
  if (payout.status !== "approved") {
    return res.status(400).json({ error: `Cannot release payout in status: ${payout.status}` });
  }
  const updated = await prisma.payout.update({ where: { id: payoutId }, data: { status: "released" } });
  sendPayoutReleasedEmail("affiliate@vibeaff.com", payout.amount, payout.currency).catch(() => {});
  await logAudit(prisma, { action: "payout_released", entity: "payout", entityId: payoutId });

  // Find merchantId via a conversion linked to this payout
  const conv = await prisma.conversion.findFirst({ where: { payoutId }, include: { program: { select: { merchantId: true } } } });
  if (conv?.program?.merchantId) {
    dispatchWebhook(prisma, conv.program.merchantId, "payout.released", {
      payoutId, affiliateId: payout.affiliateId, amount: payout.amount, currency: payout.currency,
    }).catch(() => {});
  }

  res.json(updated);
}));

router.post("/v1/payouts/:id/reject", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const updated = await prisma.payout.update({ where: { id: payoutId }, data: { status: "rejected" } });
  await logAudit(prisma, { action: "payout_rejected", entity: "payout", entityId: payoutId });
  res.json(updated);
}));

router.post("/v1/payouts/:id/crypto-release", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) {
    return res.status(404).json({ error: "Payout not found" });
  }
  if (payout.status !== "approved") {
    return res.status(400).json({ error: `Cannot release payout in status: ${payout.status}` });
  }

  const affiliate = await prisma.affiliate.findUnique({ where: { id: payout.affiliateId } });
  if (!affiliate?.walletAddress) {
    return res.status(400).json({ error: "Affiliate has no wallet address configured" });
  }

  const updated = await prisma.payout.update({ where: { id: payoutId }, data: { status: "released" } });

  await prisma.affiliateStats.upsert({
    where: { affiliateId: payout.affiliateId },
    update: { totalEarnings: { increment: payout.amount } },
    create: { affiliateId: payout.affiliateId, totalEarnings: payout.amount },
  });

  await logAudit(prisma, {
    action: "crypto_payout_released",
    entity: "payout",
    entityId: payoutId,
    details: JSON.stringify({ walletAddress: affiliate.walletAddress, amount: payout.amount, currency: payout.currency }),
  });

  res.json({
    ...updated,
    crypto: {
      walletAddress: affiliate.walletAddress,
      txHash: `0x${crypto.randomBytes(16).toString("hex")}...stub`,
      message: "Connect CRYPTO_PROVIDER to enable real on-chain transfers",
    },
  });
}));

export default router;
