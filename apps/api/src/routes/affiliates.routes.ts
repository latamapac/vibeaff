import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware } from "../auth";

const router = express.Router();

const affiliateSchema = z.object({
  displayName: z.string().min(2),
  payoutMethod: z.enum(["fiat", "crypto"]),
  walletAddress: z.string().optional(),
});

router.get("/v1/affiliates", authMiddleware, asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const affiliates = await prisma.affiliate.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(affiliates);
}));

router.post("/v1/affiliates", authMiddleware, asyncHandler(async (req, res) => {
  const parsed = affiliateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const affiliate = await prisma.affiliate.create({ data: parsed.data });
  await prisma.affiliateStats.create({ data: { affiliateId: affiliate.id } });
  res.status(201).json(affiliate);
}));

// --- Gamification ---

router.get("/v1/leaderboard", authMiddleware, asyncHandler(async (_req, res) => {
  const stats = await prisma.affiliateStats.findMany({
    orderBy: { totalEarnings: "desc" },
    take: 50,
    include: { affiliate: { select: { displayName: true } } },
  });
  const leaderboard = stats.map((s, idx) => ({
    rank: idx + 1,
    affiliateId: s.affiliateId,
    displayName: s.affiliate.displayName,
    totalEarnings: s.totalEarnings,
    totalConversions: s.totalConversions,
    tier: s.tier,
    badges: s.badges,
  }));
  res.json(leaderboard);
}));

router.get("/v1/affiliates/:id/stats", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  let stats = await prisma.affiliateStats.findUnique({ where: { affiliateId } });
  if (!stats) {
    stats = await prisma.affiliateStats.create({ data: { affiliateId } });
  }

  let tier = "bronze";
  if (stats.totalEarnings >= 50000) tier = "diamond";
  else if (stats.totalEarnings >= 20000) tier = "platinum";
  else if (stats.totalEarnings >= 10000) tier = "gold";
  else if (stats.totalEarnings >= 2000) tier = "silver";

  const badges: string[] = [...stats.badges];
  if (stats.totalConversions >= 1 && !badges.includes("first_conversion")) badges.push("first_conversion");
  if (stats.totalConversions >= 100 && !badges.includes("century")) badges.push("century");
  if (stats.totalEarnings >= 1000 && !badges.includes("earner_1k")) badges.push("earner_1k");
  if (stats.streak >= 7 && !badges.includes("weekly_streak")) badges.push("weekly_streak");
  if (stats.streak >= 30 && !badges.includes("monthly_streak")) badges.push("monthly_streak");

  if (tier !== stats.tier || badges.length !== stats.badges.length) {
    stats = await prisma.affiliateStats.update({
      where: { affiliateId },
      data: { tier, badges },
    });
  }

  res.json(stats);
}));

// --- Affiliate Dashboard (aggregated) ---

router.get("/v1/affiliates/:id/dashboard", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  let stats = await prisma.affiliateStats.findUnique({ where: { affiliateId } });
  if (!stats) {
    stats = await prisma.affiliateStats.create({ data: { affiliateId } });
  }

  let tier = "bronze";
  if (stats.totalEarnings >= 50000) tier = "diamond";
  else if (stats.totalEarnings >= 20000) tier = "platinum";
  else if (stats.totalEarnings >= 10000) tier = "gold";
  else if (stats.totalEarnings >= 2000) tier = "silver";

  const pendingPayouts = await prisma.payout.findMany({
    where: { affiliateId, status: { in: ["on_hold", "approved"] } },
  });

  const conversionRate = stats.totalClicks > 0
    ? (stats.totalConversions / stats.totalClicks) * 100
    : 0;

  res.json({
    totalEarnings: stats.totalEarnings,
    totalClicks: stats.totalClicks,
    totalConversions: stats.totalConversions,
    tier,
    streak: stats.streak,
    badges: stats.badges,
    conversionRate: Math.round(conversionRate * 10) / 10,
    pendingPayouts: pendingPayouts.length,
    pendingAmount: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
  });
}));

// --- Affiliate-scoped conversions ---

router.get("/v1/affiliates/:id/conversions", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  const pg = paginationParams(req);
  const conversions = await prisma.conversion.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" },
    ...pg,
  });
  res.json(conversions);
}));

// --- Affiliate-scoped payouts ---

router.get("/v1/affiliates/:id/payouts", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  const pg = paginationParams(req);
  const payouts = await prisma.payout.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" },
    ...pg,
  });
  res.json(payouts);
}));

// --- Affiliate-scoped links ---

router.get("/v1/affiliates/:id/links", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  const pg = paginationParams(req);
  const links = await prisma.link.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" },
    ...pg,
  });
  res.json(links);
}));

// --- Affiliate-scoped programs (via links) ---

router.get("/v1/affiliates/:id/programs", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  const links = await prisma.link.findMany({
    where: { affiliateId },
    select: { programId: true },
    distinct: ["programId"],
  });
  const programIds = links.map((l) => l.programId);
  const programs = await prisma.program.findMany({
    where: { id: { in: programIds } },
    include: { merchant: { select: { name: true, defaultCommissionPct: true, website: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(programs);
}));

// --- Affiliate profile (get single) ---

router.get("/v1/affiliates/:id", authMiddleware, asyncHandler(async (req, res) => {
  const affiliate = await prisma.affiliate.findUnique({ where: { id: paramId(req) } });
  if (!affiliate) {
    return res.status(404).json({ error: "Affiliate not found" });
  }
  res.json(affiliate);
}));

// --- Affiliate profile update ---

router.patch("/v1/affiliates/:id", authMiddleware, asyncHandler(async (req, res) => {
  const updateSchema = z.object({
    displayName: z.string().min(2).optional(),
    payoutMethod: z.enum(["fiat", "crypto"]).optional(),
    walletAddress: z.string().nullable().optional(),
  });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const affiliate = await prisma.affiliate.update({
    where: { id: paramId(req) },
    data: parsed.data,
  });
  res.json(affiliate);
}));

export default router;
