import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware } from "../auth";
import { checkConversionVelocity, checkClickVelocity, checkSelfReferral, computeFraudScore } from "../fraud";
import { resolveCommission } from "../commission";
import { logAudit } from "../audit";
import { sendConversionFlaggedEmail } from "../email";
import { generateQrSvg } from "../qr";
import { recordTouchPoint } from "../attribution";

const router = express.Router();

const linkSchema = z.object({
  programId: z.string().min(8),
  destinationUrl: z.string().url(),
  affiliateId: z.string().min(8),
  label: z.string().optional(),
  tags: z.array(z.string()).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
});

const linkUpdateSchema = z.object({
  label: z.string().optional(),
  tags: z.array(z.string()).optional(),
  destination: z.string().url().optional(),
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
  utmContent: z.string().nullable().optional(),
  utmTerm: z.string().nullable().optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

const campaignSchema = z.object({
  programId: z.string().min(8),
  affiliateId: z.string().min(8),
  channel: z.string().min(2),
  budget: z.number().positive(),
});

// --- Links ---

router.get("/v1/links", authMiddleware, asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const links = await prisma.link.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(links);
}));

router.post("/v1/links", authMiddleware, asyncHandler(async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const trackingCode = `trk_${crypto.randomBytes(8).toString("hex")}`;
  const { destinationUrl, ...rest } = parsed.data;
  const link = await prisma.link.create({
    data: {
      ...rest,
      destination: destinationUrl,
      trackingCode,
    },
  });
  res.status(201).json({ ...link, trackingUrl: `/t/${trackingCode}` });
}));

router.patch("/v1/links/:id", authMiddleware, asyncHandler(async (req, res) => {
  const parsed = linkUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const link = await prisma.link.update({ where: { id: paramId(req) }, data: parsed.data });
  res.json(link);
}));

router.delete("/v1/links/:id", authMiddleware, asyncHandler(async (req, res) => {
  await prisma.link.update({ where: { id: paramId(req) }, data: { status: "archived" } });
  res.status(204).send();
}));

router.get("/v1/links/:id/stats", authMiddleware, asyncHandler(async (req, res) => {
  const linkId = paramId(req);
  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }
  const [totalClicks, conversions] = await Promise.all([
    prisma.click.count({ where: { linkId } }),
    prisma.conversion.findMany({ where: { clickId: { not: null }, affiliateId: link.affiliateId, programId: link.programId } }),
  ]);
  const linkedConversions = conversions.length;
  const totalRevenue = conversions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const conversionRate = totalClicks > 0 ? (linkedConversions / totalClicks) * 100 : 0;
  res.json({ linkId, totalClicks, conversions: linkedConversions, revenue: totalRevenue, conversionRate: Math.round(conversionRate * 10) / 10 });
}));

// --- QR Code ---

router.get("/v1/links/:id/qr", authMiddleware, asyncHandler(async (req, res) => {
  const linkId = paramId(req);
  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) return res.status(404).json({ error: "Link not found" });

  const baseUrl = process.env.API_BASE_URL ?? `${req.protocol}://${req.get("host")}`;
  const trackingUrl = `${baseUrl}/t/${link.trackingCode}`;
  const size = Number(req.query.size) || 256;

  const svg = generateQrSvg(trackingUrl, Math.min(size, 1024));
  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
}));

// --- Smart Link Rules ---

const smartRuleSchema = z.object({
  conditions: z.record(z.string(), z.unknown()),
  destination: z.string().url(),
  priority: z.number().int().optional(),
});

router.get("/v1/links/:id/smart-rules", authMiddleware, asyncHandler(async (req, res) => {
  const linkId = paramId(req);
  const rules = await prisma.smartLinkRule.findMany({
    where: { linkId },
    orderBy: { priority: "desc" },
  });
  res.json(rules);
}));

router.post("/v1/links/:id/smart-rules", authMiddleware, asyncHandler(async (req, res) => {
  const linkId = paramId(req);
  const parsed = smartRuleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const rule = await prisma.smartLinkRule.create({
    data: { linkId, ...parsed.data, conditions: parsed.data.conditions as Record<string, never> },
  });
  res.status(201).json(rule);
}));

router.delete("/v1/smart-rules/:id", authMiddleware, asyncHandler(async (req, res) => {
  await prisma.smartLinkRule.delete({ where: { id: paramId(req) } });
  res.json({ deleted: true });
}));

// --- Campaigns ---

router.get("/v1/campaigns", authMiddleware, asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(campaigns);
}));

router.post("/v1/campaigns", authMiddleware, asyncHandler(async (req, res) => {
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const campaign = await prisma.campaign.create({ data: parsed.data });
  res.status(201).json(campaign);
}));

// --- Click tracking + redirect (public) ---

router.get("/t/:code", asyncHandler(async (req, res) => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const link = await prisma.link.findUnique({
    where: { trackingCode: code },
    include: { smartRules: { orderBy: { priority: "desc" } } },
  });
  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "";
  const ua = req.headers["user-agent"] ?? "";

  const velocityCheck = await checkClickVelocity(prisma, ip);
  if (!velocityCheck.ok) {
    return res.status(429).json({ error: velocityCheck.reason });
  }

  const click = await prisma.click.create({
    data: { linkId: link.id, ipAddress: ip, userAgent: ua },
  });

  await prisma.affiliateStats.upsert({
    where: { affiliateId: link.affiliateId },
    update: { totalClicks: { increment: 1 } },
    create: { affiliateId: link.affiliateId, totalClicks: 1 },
  });

  // Record touch point for multi-touch attribution
  // Session ID is derived from click ID — consumer will pass vclick param back on conversion
  recordTouchPoint(prisma, {
    sessionId: click.id,
    affiliateId: link.affiliateId,
    programId: link.programId,
    type: "click",
    linkId: link.id,
    ipAddress: ip,
    userAgent: ua ?? undefined,
  }).catch(() => {});

  // Smart link rule evaluation
  let destination = link.destination;
  if (link.smartRules.length > 0) {
    const uaLower = (ua ?? "").toLowerCase();
    for (const rule of link.smartRules) {
      const conditions = rule.conditions as Record<string, string | string[]>;
      let match = true;

      if (conditions.device) {
        const device = /mobile|android|iphone|ipad/i.test(uaLower) ? "mobile" : "desktop";
        if (device !== conditions.device) match = false;
      }
      if (conditions.os) {
        const osMap: Record<string, RegExp> = {
          ios: /iphone|ipad|ipod/i, android: /android/i,
          windows: /windows/i, macos: /macintosh|mac os/i, linux: /linux/i,
        };
        const osRegex = osMap[conditions.os as string];
        if (osRegex && !osRegex.test(uaLower)) match = false;
      }
      if (conditions.country && typeof conditions.country === "string") {
        // Use CF-IPCountry or X-Vercel-IP-Country header if available
        const country = (req.headers["cf-ipcountry"] ?? req.headers["x-vercel-ip-country"] ?? "") as string;
        if (country.toLowerCase() !== conditions.country.toLowerCase()) match = false;
      }
      if (conditions.browser) {
        const browserMap: Record<string, RegExp> = {
          chrome: /chrome/i, firefox: /firefox/i, safari: /safari/i, edge: /edg/i,
        };
        const bRegex = browserMap[conditions.browser as string];
        if (bRegex && !bRegex.test(uaLower)) match = false;
      }

      if (match) {
        destination = rule.destination;
        break;
      }
    }
  }

  const separator = destination.includes("?") ? "&" : "?";
  res.redirect(302, `${destination}${separator}vclick=${click.id}&vaff=${link.affiliateId}&vprg=${link.programId}`);
}));

// --- Public SDK conversion tracking (no JWT — validated via clickId + merchantId) ---

const trackConversionSchema = z.object({
  merchantId: z.string().min(8),
  clickId: z.string().min(8).optional(),
  affiliateId: z.string().min(8).optional(),
  programId: z.string().min(8).optional(),
  orderId: z.string().min(3),
  orderTotal: z.number().positive(),
  currency: z.string().min(3).max(3),
});

const sdkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many conversion requests" },
});

router.post("/v1/track/conversion", sdkLimiter, asyncHandler(async (req, res) => {
  const parsed = trackConversionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { merchantId, clickId, affiliateId: rawAffiliateId, programId: rawProgramId, orderId, orderTotal, currency } = parsed.data;

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) {
    return res.status(403).json({ error: "Invalid merchant" });
  }

  let affiliateId = rawAffiliateId;
  let programId = rawProgramId;

  if (clickId) {
    const click = await prisma.click.findUnique({
      where: { id: clickId },
      include: { link: { include: { program: true } } },
    });
    if (!click) {
      return res.status(400).json({ error: "Invalid click ID" });
    }
    if (click.link.program.merchantId !== merchantId) {
      return res.status(403).json({ error: "Click does not belong to this merchant" });
    }
    affiliateId = affiliateId || click.link.affiliateId;
    programId = programId || click.link.programId;
  }

  if (!affiliateId || !programId) {
    return res.status(400).json({ error: "affiliateId and programId are required when clickId is not provided" });
  }

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { merchant: { select: { id: true, defaultCommissionPct: true } } },
  });
  if (!program || program.merchantId !== merchantId) {
    return res.status(403).json({ error: "Program does not belong to this merchant" });
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "";
  const ua = req.headers["user-agent"] ?? "";

  const velocityCheck = await checkConversionVelocity(prisma, affiliateId);
  let selfReferralOk = true;
  let conversionDelaySeconds = 999;

  if (clickId) {
    const click = await prisma.click.findUnique({ where: { id: clickId } });
    if (click) {
      const selfCheck = checkSelfReferral(affiliateId, click.ipAddress, ip);
      selfReferralOk = selfCheck.ok;
      conversionDelaySeconds = Math.floor((Date.now() - click.createdAt.getTime()) / 1000);
    }
  }

  const fraudScore = computeFraudScore({ velocityOk: velocityCheck.ok, selfReferralOk, conversionDelaySeconds });
  const status = fraudScore >= 50 ? "flagged" : "pending_verification";

  const fallbackPct = program.merchant.defaultCommissionPct;
  const { commissionPct, commissionAmount } = await resolveCommission(
    prisma, programId, affiliateId, orderTotal, fallbackPct,
  );

  const conversion = await prisma.conversion.create({
    data: {
      programId, affiliateId, clickId: clickId || null, orderId, orderTotal, currency,
      commissionPct, commissionAmount, ipAddress: ip, userAgent: ua, status,
    },
  });

  if (status !== "flagged") {
    await prisma.affiliateStats.upsert({
      where: { affiliateId },
      update: { totalConversions: { increment: 1 } },
      create: { affiliateId, totalConversions: 1 },
    });

    if (commissionAmount > 0) {
      const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const payout = await prisma.payout.create({
        data: { affiliateId, amount: commissionAmount, currency, status: "on_hold", holdUntil },
      });
      await prisma.conversion.update({ where: { id: conversion.id }, data: { payoutId: payout.id } });
    }
  }

  if (status === "flagged") {
    const reason = !velocityCheck.ok ? "Velocity threshold exceeded" : !selfReferralOk ? "Self-referral detected" : "High fraud score";
    sendConversionFlaggedEmail("admin@vibeaff.com", conversion.id, reason).catch(() => {});
  }

  await logAudit(prisma, {
    action: "sdk_conversion_tracked",
    entity: "conversion",
    entityId: conversion.id,
    details: JSON.stringify({ fraudScore, status, commissionPct, commissionAmount, source: "browser_sdk" }),
    ipAddress: ip,
  });

  res.status(202).json({ id: conversion.id, status, commissionAmount });
}));

export default router;
