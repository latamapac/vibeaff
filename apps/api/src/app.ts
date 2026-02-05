import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword, signToken, authMiddleware, requireRole } from "./auth";
import { checkConversionVelocity, checkClickVelocity, computeFraudScore } from "./fraud";
import { logAudit } from "./audit";

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const prisma = new PrismaClient();

const asyncHandler =
  (handler: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    Promise.resolve(handler(req, res, next)).catch(next);

function paramId(req: express.Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

// --- Schemas ---

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "partner", "affiliate"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const merchantSchema = z.object({
  name: z.string().min(2),
  website: z.string().url(),
  defaultCommissionPct: z.number().min(0).max(100),
});

const affiliateSchema = z.object({
  displayName: z.string().min(2),
  payoutMethod: z.enum(["fiat", "crypto"]),
  walletAddress: z.string().optional(),
});

const programSchema = z.object({
  name: z.string().min(2),
  attributionWindowDays: z.number().min(1).max(90),
});

const campaignSchema = z.object({
  programId: z.string().min(8),
  affiliateId: z.string().min(8),
  channel: z.string().min(2),
  budget: z.number().positive(),
});

const linkSchema = z.object({
  programId: z.string().min(8),
  destinationUrl: z.string().url(),
  affiliateId: z.string().min(8),
});

const conversionSchema = z.object({
  programId: z.string().min(8),
  affiliateId: z.string().min(8),
  clickId: z.string().optional(),
  orderId: z.string().min(3),
  orderTotal: z.number().positive(),
  currency: z.string().min(3).max(3),
});

const channelSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  status: z.enum(["connected", "ready", "planned"]),
  provider: z.string().min(2).optional(),
});

const creativeToolSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["text", "visual", "web", "translation"]),
  status: z.enum(["connected", "ready", "planned"]),
});

// --- Health / root ---

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "VibeAff API",
    version: "1.0.0",
    status: "ok",
    docs: "/v1",
  });
});

// --- Auth ---

app.post("/v1/auth/register", asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role ?? "affiliate",
    },
  });
  const token = signToken({ userId: user.id, email: user.email, role: user.role as "admin" | "partner" | "affiliate" });
  await logAudit(prisma, { userId: user.id, action: "register", entity: "user", entityId: user.id });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
}));

app.post("/v1/auth/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role as "admin" | "partner" | "affiliate" });
  await logAudit(prisma, { userId: user.id, action: "login", entity: "user", entityId: user.id });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}));

app.get("/v1/auth/me", authMiddleware, (req, res) => {
  const user = (req as express.Request & { user: { userId: string; email: string; role: string } }).user;
  res.json(user);
});

// --- Merchants ---

app.get("/v1/merchants", asyncHandler(async (_req, res) => {
  const merchants = await prisma.merchant.findMany({ orderBy: { createdAt: "desc" } });
  res.json(merchants);
}));

app.post("/v1/merchants", asyncHandler(async (req, res) => {
  const parsed = merchantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const merchant = await prisma.merchant.create({ data: parsed.data });
  res.status(201).json(merchant);
}));

// --- Affiliates ---

app.get("/v1/affiliates", asyncHandler(async (_req, res) => {
  const affiliates = await prisma.affiliate.findMany({ orderBy: { createdAt: "desc" } });
  res.json(affiliates);
}));

app.post("/v1/affiliates", asyncHandler(async (req, res) => {
  const parsed = affiliateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const affiliate = await prisma.affiliate.create({ data: parsed.data });
  await prisma.affiliateStats.create({ data: { affiliateId: affiliate.id } });
  res.status(201).json(affiliate);
}));

// --- Programs ---

app.get("/v1/programs", asyncHandler(async (_req, res) => {
  const programs = await prisma.program.findMany({ orderBy: { createdAt: "desc" } });
  res.json(programs);
}));

app.post("/v1/merchants/:id/programs", asyncHandler(async (req, res) => {
  const parsed = programSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const merchantId = paramId(req);
  const program = await prisma.program.create({ data: { merchantId, ...parsed.data } });
  res.status(201).json(program);
}));

// --- Campaigns ---

app.get("/v1/campaigns", asyncHandler(async (_req, res) => {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
  res.json(campaigns);
}));

app.post("/v1/campaigns", asyncHandler(async (req, res) => {
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const campaign = await prisma.campaign.create({ data: parsed.data });
  res.status(201).json(campaign);
}));

// --- Links ---

app.get("/v1/links", asyncHandler(async (_req, res) => {
  const links = await prisma.link.findMany({ orderBy: { createdAt: "desc" } });
  res.json(links);
}));

app.post("/v1/links", asyncHandler(async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const trackingCode = `trk_${Math.random().toString(36).slice(2, 10)}`;
  const link = await prisma.link.create({
    data: {
      programId: parsed.data.programId,
      affiliateId: parsed.data.affiliateId,
      destination: parsed.data.destinationUrl,
      trackingCode,
    },
  });
  res.status(201).json({ ...link, trackingUrl: `/t/${trackingCode}` });
}));

// --- Click tracking + redirect ---

app.get("/t/:code", asyncHandler(async (req, res) => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const link = await prisma.link.findUnique({ where: { trackingCode: code } });
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

  const separator = link.destination.includes("?") ? "&" : "?";
  res.redirect(302, `${link.destination}${separator}vclick=${click.id}&vaff=${link.affiliateId}&vprg=${link.programId}`);
}));

// --- Conversions with fraud checks ---

app.get("/v1/conversions", asyncHandler(async (_req, res) => {
  const conversions = await prisma.conversion.findMany({ orderBy: { createdAt: "desc" } });
  res.json(conversions);
}));

app.post("/v1/conversions", asyncHandler(async (req, res) => {
  const parsed = conversionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "";
  const ua = req.headers["user-agent"] ?? "";

  const velocityCheck = await checkConversionVelocity(prisma, parsed.data.affiliateId);
  let fraudScore = 0;

  if (!velocityCheck.ok) {
    fraudScore = computeFraudScore({ velocityOk: false, selfReferralOk: true, conversionDelaySeconds: 999 });
  }

  const status = fraudScore >= 50 ? "flagged" : "pending_verification";

  const conversion = await prisma.conversion.create({
    data: {
      ...parsed.data,
      ipAddress: ip,
      userAgent: ua,
      status,
    },
  });

  if (status !== "flagged") {
    await prisma.affiliateStats.upsert({
      where: { affiliateId: parsed.data.affiliateId },
      update: { totalConversions: { increment: 1 } },
      create: { affiliateId: parsed.data.affiliateId, totalConversions: 1 },
    });
  }

  await logAudit(prisma, {
    action: "conversion_created",
    entity: "conversion",
    entityId: conversion.id,
    details: JSON.stringify({ fraudScore, status }),
    ipAddress: ip,
  });

  res.status(202).json({ ...conversion, fraudScore });
}));

// --- Payouts workflow ---

app.get("/v1/payouts", asyncHandler(async (_req, res) => {
  const payouts = await prisma.payout.findMany({ orderBy: { createdAt: "desc" } });
  res.json(payouts);
}));

app.post("/v1/payouts", asyncHandler(async (req, res) => {
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
    data: {
      affiliateId: parsed.data.affiliateId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      status: "on_hold",
      holdUntil,
    },
  });
  await logAudit(prisma, { action: "payout_created", entity: "payout", entityId: payout.id });
  res.status(201).json(payout);
}));

app.post("/v1/payouts/:id/approve", asyncHandler(async (req, res) => {
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
  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "approved" },
  });

  await prisma.affiliateStats.upsert({
    where: { affiliateId: payout.affiliateId },
    update: { totalEarnings: { increment: payout.amount } },
    create: { affiliateId: payout.affiliateId, totalEarnings: payout.amount },
  });

  await logAudit(prisma, { action: "payout_approved", entity: "payout", entityId: payoutId });
  res.json(updated);
}));

app.post("/v1/payouts/:id/hold", asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "on_hold" },
  });
  await logAudit(prisma, { action: "payout_held", entity: "payout", entityId: payoutId });
  res.json(updated);
}));

app.post("/v1/payouts/:id/release", asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) {
    return res.status(404).json({ error: "Payout not found" });
  }
  if (payout.status !== "approved") {
    return res.status(400).json({ error: `Cannot release payout in status: ${payout.status}` });
  }
  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "released" },
  });
  await logAudit(prisma, { action: "payout_released", entity: "payout", entityId: payoutId });
  res.json(updated);
}));

app.post("/v1/payouts/:id/reject", asyncHandler(async (req, res) => {
  const payoutId = paramId(req);
  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "rejected" },
  });
  await logAudit(prisma, { action: "payout_rejected", entity: "payout", entityId: payoutId });
  res.json(updated);
}));

// --- Channels ---

app.get("/v1/channels", asyncHandler(async (_req, res) => {
  const channels = await prisma.channel.findMany({ orderBy: { createdAt: "desc" } });
  res.json(channels);
}));

app.post("/v1/channels", asyncHandler(async (req, res) => {
  const parsed = channelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const channel = await prisma.channel.create({ data: parsed.data });
  res.status(201).json(channel);
}));

app.put("/v1/channels/:id", asyncHandler(async (req, res) => {
  const parsed = channelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const channel = await prisma.channel.update({ where: { id: paramId(req) }, data: parsed.data });
  res.json(channel);
}));

app.delete("/v1/channels/:id", asyncHandler(async (req, res) => {
  await prisma.channel.delete({ where: { id: paramId(req) } });
  res.status(204).send();
}));

// --- Integration connections (OAuth stubs) ---

app.get("/v1/integrations", asyncHandler(async (_req, res) => {
  const connections = await prisma.integrationConnection.findMany({ orderBy: { createdAt: "desc" } });
  res.json(connections);
}));

app.post("/v1/integrations/connect", asyncHandler(async (req, res) => {
  const schema = z.object({
    channelId: z.string().min(8),
    merchantId: z.string().min(8),
    provider: z.string().min(2),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const connection = await prisma.integrationConnection.create({
    data: {
      channelId: parsed.data.channelId,
      merchantId: parsed.data.merchantId,
      provider: parsed.data.provider,
      status: "pending",
    },
  });
  const oauthUrl = `https://oauth.${parsed.data.provider}.com/authorize?client_id=vibeaff&redirect_uri=/v1/integrations/callback&state=${connection.id}`;
  await logAudit(prisma, { action: "integration_connect", entity: "integration", entityId: connection.id });
  res.status(201).json({ connection, oauthUrl });
}));

app.post("/v1/integrations/callback", asyncHandler(async (req, res) => {
  const schema = z.object({
    connectionId: z.string().min(8),
    accessToken: z.string().min(1),
    refreshToken: z.string().optional(),
    expiresInSeconds: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const expiresAt = parsed.data.expiresInSeconds
    ? new Date(Date.now() + parsed.data.expiresInSeconds * 1000)
    : null;
  const connection = await prisma.integrationConnection.update({
    where: { id: parsed.data.connectionId },
    data: {
      status: "connected",
      accessToken: parsed.data.accessToken,
      refreshToken: parsed.data.refreshToken,
      expiresAt,
    },
  });
  await logAudit(prisma, { action: "integration_connected", entity: "integration", entityId: connection.id });
  res.json(connection);
}));

app.post("/v1/integrations/:id/disconnect", asyncHandler(async (req, res) => {
  const connection = await prisma.integrationConnection.update({
    where: { id: paramId(req) },
    data: { status: "disconnected", accessToken: null, refreshToken: null },
  });
  await logAudit(prisma, { action: "integration_disconnected", entity: "integration", entityId: connection.id });
  res.json(connection);
}));

// --- Creative tools ---

app.get("/v1/creative-tools", asyncHandler(async (_req, res) => {
  const tools = await prisma.creativeTool.findMany({ orderBy: { createdAt: "desc" } });
  res.json(tools);
}));

app.post("/v1/creative-tools", asyncHandler(async (req, res) => {
  const parsed = creativeToolSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tool = await prisma.creativeTool.create({ data: parsed.data });
  res.status(201).json(tool);
}));

app.put("/v1/creative-tools/:id", asyncHandler(async (req, res) => {
  const parsed = creativeToolSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tool = await prisma.creativeTool.update({ where: { id: paramId(req) }, data: parsed.data });
  res.json(tool);
}));

app.delete("/v1/creative-tools/:id", asyncHandler(async (req, res) => {
  await prisma.creativeTool.delete({ where: { id: paramId(req) } });
  res.status(204).send();
}));

// --- Metrics ---

app.get("/v1/metrics", asyncHandler(async (_req, res) => {
  const [merchants, affiliates, programs, campaigns, conversions, payouts, channels, creativeTools] =
    await Promise.all([
      prisma.merchant.count(),
      prisma.affiliate.count(),
      prisma.program.count(),
      prisma.campaign.count(),
      prisma.conversion.count(),
      prisma.payout.count(),
      prisma.channel.count(),
      prisma.creativeTool.count(),
    ]);
  res.json({ merchants, affiliates, programs, campaigns, conversions, payouts, channels, creativeTools });
}));

// --- Gamification ---

app.get("/v1/leaderboard", asyncHandler(async (_req, res) => {
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

app.get("/v1/affiliates/:id/stats", asyncHandler(async (req, res) => {
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

// --- OAuth redirect flows ---

app.get("/v1/integrations/oauth/:provider", asyncHandler(async (req, res) => {
  const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;
  const merchantId = req.query.merchantId as string;
  const channelId = req.query.channelId as string;
  if (!merchantId || !channelId) {
    return res.status(400).json({ error: "merchantId and channelId query params required" });
  }

  const connection = await prisma.integrationConnection.create({
    data: { channelId, merchantId, provider, status: "pending" },
  });

  const clientIds: Record<string, string> = {
    google: process.env.GOOGLE_CLIENT_ID ?? "GOOGLE_CLIENT_ID_NOT_SET",
    meta: process.env.META_APP_ID ?? "META_APP_ID_NOT_SET",
    microsoft: process.env.MICROSOFT_CLIENT_ID ?? "MICROSOFT_CLIENT_ID_NOT_SET",
  };

  const authUrls: Record<string, string> = {
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientIds.google}&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URL ?? "")}&response_type=code&scope=https://www.googleapis.com/auth/adwords&state=${connection.id}`,
    meta: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientIds.meta}&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URL ?? "")}&scope=ads_read&state=${connection.id}`,
    microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientIds.microsoft}&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URL ?? "")}&response_type=code&scope=https://ads.microsoft.com/msads.manage&state=${connection.id}`,
  };

  const url = authUrls[provider];
  if (!url) {
    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  }

  await logAudit(prisma, { action: "oauth_redirect", entity: "integration", entityId: connection.id, details: provider });
  res.json({ connectionId: connection.id, oauthUrl: url });
}));

app.get("/v1/integrations/oauth/callback", asyncHandler(async (req, res) => {
  const { state, code } = req.query as { state?: string; code?: string };
  if (!state || !code) {
    return res.status(400).json({ error: "Missing state or code" });
  }

  const connection = await prisma.integrationConnection.findUnique({ where: { id: state } });
  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }

  // In production, exchange code for tokens via provider's token endpoint
  const updated = await prisma.integrationConnection.update({
    where: { id: state },
    data: {
      status: "connected",
      accessToken: `tok_${code}`,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
  });

  await logAudit(prisma, { action: "oauth_callback", entity: "integration", entityId: updated.id });
  res.json({ status: "connected", connectionId: updated.id });
}));

// --- Creative generation pipeline ---

app.post("/v1/creatives/generate-copy", asyncHandler(async (req, res) => {
  const schema = z.object({
    productName: z.string().min(2),
    targetAudience: z.string().min(2),
    channel: z.string().min(2),
    tone: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Stub: In production, call OpenAI API
  const variants = [
    { headline: `Discover ${parsed.data.productName} - Made for ${parsed.data.targetAudience}`, cta: "Shop now" },
    { headline: `${parsed.data.targetAudience}? ${parsed.data.productName} is for you.`, cta: "Learn more" },
    { headline: `Upgrade your life with ${parsed.data.productName}`, cta: "Get started" },
  ];

  await logAudit(prisma, { action: "creative_copy_generated", entity: "creative", details: JSON.stringify(parsed.data) });
  res.json({ channel: parsed.data.channel, variants });
}));

app.post("/v1/creatives/generate-image", asyncHandler(async (req, res) => {
  const schema = z.object({
    productName: z.string().min(2),
    style: z.enum(["photo", "illustration", "minimal"]),
    dimensions: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Stub: In production, call Stability/DALL-E API
  res.json({
    status: "queued",
    message: "Image generation queued. Connect STABILITY_API_KEY or OPENAI_API_KEY to enable.",
    params: parsed.data,
  });
}));

app.post("/v1/creatives/translate", asyncHandler(async (req, res) => {
  const schema = z.object({
    text: z.string().min(1),
    targetLanguage: z.string().min(2).max(5),
    sourceLanguage: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Stub: In production, call translation API
  res.json({
    status: "queued",
    message: "Translation queued. Connect TRANSLATION_API_KEY to enable.",
    params: parsed.data,
  });
}));

// --- Crypto payout ---

app.post("/v1/payouts/:id/crypto-release", asyncHandler(async (req, res) => {
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

  // Stub: In production, initiate on-chain transfer via Circle/ethers.js
  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "released" },
  });

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
      txHash: `0x${Math.random().toString(16).slice(2, 34)}...stub`,
      message: "Connect CRYPTO_PROVIDER to enable real on-chain transfers",
    },
  });
}));

// --- Audit log (admin only) ---

app.get("/v1/audit-logs", asyncHandler(async (req, res) => {
  const take = Math.min(Number(req.query.limit ?? 50), 200);
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
  res.json(logs);
}));

// --- Error handler ---

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: err.message });
});

export default app;
