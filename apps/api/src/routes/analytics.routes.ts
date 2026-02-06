import express from "express";
import { prisma, asyncHandler } from "../shared";
import { authMiddleware, requireRole } from "../auth";

const router = express.Router();

// --- Daily stats rollup job (call via cron or admin trigger) ---

router.post("/v1/analytics/rollup", authMiddleware, requireRole("admin"), asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Aggregate clicks by program
  const clicks = await prisma.click.groupBy({
    by: ["linkId"],
    _count: true,
    where: { createdAt: { gte: yesterday, lt: today } },
  });

  // Resolve link -> program/affiliate mapping
  const linkIds = clicks.map((c) => c.linkId);
  const links = await prisma.link.findMany({
    where: { id: { in: linkIds } },
    select: { id: true, programId: true, affiliateId: true, program: { select: { merchantId: true } } },
  });
  const linkMap = new Map(links.map((l) => [l.id, l]));

  // Aggregate conversions
  const conversions = await prisma.conversion.groupBy({
    by: ["programId", "affiliateId"],
    _count: true,
    _sum: { orderTotal: true, commissionAmount: true },
    where: { createdAt: { gte: yesterday, lt: today }, status: { not: "flagged" } },
  });

  // Build stat buckets
  const buckets = new Map<string, { programId: string; affiliateId: string; merchantId: string; clicks: number; conversions: number; revenue: number; commission: number }>();

  const key = (p: string, a: string, m: string) => `${p}|${a}|${m}`;

  for (const c of clicks) {
    const link = linkMap.get(c.linkId);
    if (!link) continue;
    const k = key(link.programId, link.affiliateId, link.program.merchantId);
    const bucket = buckets.get(k) ?? { programId: link.programId, affiliateId: link.affiliateId, merchantId: link.program.merchantId, clicks: 0, conversions: 0, revenue: 0, commission: 0 };
    bucket.clicks += c._count;
    buckets.set(k, bucket);
  }

  for (const c of conversions) {
    const program = await prisma.program.findUnique({ where: { id: c.programId }, select: { merchantId: true } });
    const k = key(c.programId, c.affiliateId, program?.merchantId ?? "");
    const bucket = buckets.get(k) ?? { programId: c.programId, affiliateId: c.affiliateId, merchantId: program?.merchantId ?? "", clicks: 0, conversions: 0, revenue: 0, commission: 0 };
    bucket.conversions += c._count;
    bucket.revenue += c._sum.orderTotal ?? 0;
    bucket.commission += c._sum.commissionAmount ?? 0;
    buckets.set(k, bucket);
  }

  // Upsert daily stats
  let upserted = 0;
  for (const b of buckets.values()) {
    await prisma.dailyStats.upsert({
      where: {
        date_programId_affiliateId_merchantId: {
          date: yesterday,
          programId: b.programId,
          affiliateId: b.affiliateId,
          merchantId: b.merchantId,
        },
      },
      update: {
        clicks: b.clicks,
        conversions: b.conversions,
        revenue: b.revenue,
        commission: b.commission,
      },
      create: {
        date: yesterday,
        programId: b.programId,
        affiliateId: b.affiliateId,
        merchantId: b.merchantId,
        clicks: b.clicks,
        conversions: b.conversions,
        revenue: b.revenue,
        commission: b.commission,
      },
    });
    upserted++;
  }

  res.json({ date: yesterday.toISOString().split("T")[0], bucketsProcessed: upserted });
}));

// --- Query time-series data ---

router.get("/v1/analytics/timeseries", authMiddleware, asyncHandler(async (req, res) => {
  const { startDate, endDate, programId, affiliateId, merchantId, groupBy } = req.query as Record<string, string | undefined>;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    date: { gte: start, lte: end },
  };
  if (programId) where.programId = programId;
  if (affiliateId) where.affiliateId = affiliateId;
  if (merchantId) where.merchantId = merchantId;

  const stats = await prisma.dailyStats.findMany({
    where,
    orderBy: { date: "asc" },
  });

  // Group by period if requested
  if (groupBy === "week" || groupBy === "month") {
    const grouped = new Map<string, { date: string; clicks: number; conversions: number; revenue: number; commission: number }>();

    for (const s of stats) {
      const d = new Date(s.date);
      let periodKey: string;
      if (groupBy === "week") {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        periodKey = weekStart.toISOString().split("T")[0];
      } else {
        periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      }

      const existing = grouped.get(periodKey) ?? { date: periodKey, clicks: 0, conversions: 0, revenue: 0, commission: 0 };
      existing.clicks += s.clicks;
      existing.conversions += s.conversions;
      existing.revenue += s.revenue;
      existing.commission += s.commission;
      grouped.set(periodKey, existing);
    }

    return res.json(Array.from(grouped.values()));
  }

  res.json(stats.map((s) => ({
    date: new Date(s.date).toISOString().split("T")[0],
    clicks: s.clicks,
    conversions: s.conversions,
    revenue: s.revenue,
    commission: s.commission,
  })));
}));

// --- Summary stats (totals for a period) ---

router.get("/v1/analytics/summary", authMiddleware, asyncHandler(async (req, res) => {
  const { startDate, endDate, programId, affiliateId, merchantId } = req.query as Record<string, string | undefined>;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    date: { gte: start, lte: end },
  };
  if (programId) where.programId = programId;
  if (affiliateId) where.affiliateId = affiliateId;
  if (merchantId) where.merchantId = merchantId;

  const agg = await prisma.dailyStats.aggregate({
    where,
    _sum: { clicks: true, conversions: true, revenue: true, commission: true },
  });

  const totalClicks = agg._sum.clicks ?? 0;
  const totalConversions = agg._sum.conversions ?? 0;

  res.json({
    period: { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] },
    clicks: totalClicks,
    conversions: totalConversions,
    revenue: agg._sum.revenue ?? 0,
    commission: agg._sum.commission ?? 0,
    conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00",
  });
}));

// --- Top performers ---

router.get("/v1/analytics/top-affiliates", authMiddleware, asyncHandler(async (req, res) => {
  const { startDate, endDate, merchantId, limit: limitStr } = req.query as Record<string, string | undefined>;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  const limit = Math.min(Number(limitStr ?? 10), 50);

  const where: Record<string, unknown> = {
    date: { gte: start, lte: end },
    affiliateId: { not: "" },
  };
  if (merchantId) where.merchantId = merchantId;

  const stats = await prisma.dailyStats.groupBy({
    by: ["affiliateId"],
    where,
    _sum: { clicks: true, conversions: true, revenue: true, commission: true },
    orderBy: { _sum: { commission: "desc" } },
    take: limit,
  });

  // Enrich with affiliate names
  const affiliateIds = stats.map((s) => s.affiliateId).filter(Boolean) as string[];
  const affiliates = await prisma.affiliate.findMany({
    where: { id: { in: affiliateIds } },
    select: { id: true, displayName: true },
  });
  const nameMap = new Map(affiliates.map((a) => [a.id, a.displayName]));

  res.json(stats.map((s) => ({
    affiliateId: s.affiliateId,
    displayName: nameMap.get(s.affiliateId!) ?? "Unknown",
    clicks: s._sum.clicks ?? 0,
    conversions: s._sum.conversions ?? 0,
    revenue: s._sum.revenue ?? 0,
    commission: s._sum.commission ?? 0,
  })));
}));

export default router;
