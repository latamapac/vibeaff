import express from "express";
import { prisma, asyncHandler } from "../shared";
import { authMiddleware, requireRole } from "../auth";

const router = express.Router();

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (val: unknown): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

// --- Export conversions as CSV ---

router.get("/v1/exports/conversions.csv", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const { startDate, endDate, programId, affiliateId, status } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }
  if (programId) where.programId = programId;
  if (affiliateId) where.affiliateId = affiliateId;
  if (status) where.status = status;

  const conversions = await prisma.conversion.findMany({
    where,
    include: {
      program: { select: { name: true } },
      affiliate: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const headers = ["id", "orderId", "program", "affiliate", "orderTotal", "currency", "commissionPct", "commissionAmount", "status", "isRecurring", "createdAt"];
  const rows = conversions.map((c) => ({
    id: c.id,
    orderId: c.orderId,
    program: c.program.name,
    affiliate: c.affiliate.displayName,
    orderTotal: c.orderTotal,
    currency: c.currency,
    commissionPct: c.commissionPct,
    commissionAmount: c.commissionAmount,
    status: c.status,
    isRecurring: c.isRecurring,
    createdAt: c.createdAt.toISOString(),
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=conversions.csv");
  res.send(toCsv(headers, rows));
}));

// --- Export payouts as CSV ---

router.get("/v1/exports/payouts.csv", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }
  if (status) where.status = status;

  const payouts = await prisma.payout.findMany({
    where,
    include: {
      affiliate: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const headers = ["id", "affiliate", "affiliateId", "amount", "currency", "status", "holdUntil", "stripeTransferId", "createdAt"];
  const rows = payouts.map((p) => ({
    id: p.id,
    affiliate: p.affiliate.displayName,
    affiliateId: p.affiliateId,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    holdUntil: p.holdUntil?.toISOString() ?? "",
    stripeTransferId: p.stripeTransferId ?? "",
    createdAt: p.createdAt.toISOString(),
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=payouts.csv");
  res.send(toCsv(headers, rows));
}));

// --- Export analytics as CSV ---

router.get("/v1/exports/analytics.csv", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const { startDate, endDate, programId, merchantId } = req.query as Record<string, string | undefined>;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const where: Record<string, unknown> = {
    date: { gte: start, lte: end },
  };
  if (programId) where.programId = programId;
  if (merchantId) where.merchantId = merchantId;

  const stats = await prisma.dailyStats.findMany({
    where,
    orderBy: { date: "asc" },
    take: 10000,
  });

  const headers = ["date", "programId", "affiliateId", "merchantId", "clicks", "conversions", "revenue", "commission"];
  const rows = stats.map((s) => ({
    date: new Date(s.date).toISOString().split("T")[0],
    programId: s.programId || "",
    affiliateId: s.affiliateId || "",
    merchantId: s.merchantId || "",
    clicks: s.clicks,
    conversions: s.conversions,
    revenue: s.revenue,
    commission: s.commission,
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=analytics.csv");
  res.send(toCsv(headers, rows));
}));

// --- Export links as CSV ---

router.get("/v1/exports/links.csv", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = req.query.affiliateId as string | undefined;
  const where: Record<string, unknown> = {};
  if (affiliateId) where.affiliateId = affiliateId;

  const links = await prisma.link.findMany({
    where,
    include: { program: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const headers = ["id", "trackingCode", "program", "destination", "label", "status", "createdAt"];
  const rows = links.map((l) => ({
    id: l.id,
    trackingCode: l.trackingCode,
    program: l.program.name,
    destination: l.destination,
    label: l.label ?? "",
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=links.csv");
  res.send(toCsv(headers, rows));
}));

export default router;
