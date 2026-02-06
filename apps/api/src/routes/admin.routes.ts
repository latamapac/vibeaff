import express from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";

const router = express.Router();

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

// --- Channels ---

router.get("/v1/channels", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const channels = await prisma.channel.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(channels);
}));

router.post("/v1/channels", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const parsed = channelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const channel = await prisma.channel.create({ data: parsed.data });
  res.status(201).json(channel);
}));

router.put("/v1/channels/:id", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const parsed = channelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const channel = await prisma.channel.update({ where: { id: paramId(req) }, data: parsed.data });
  res.json(channel);
}));

router.delete("/v1/channels/:id", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  await prisma.channel.delete({ where: { id: paramId(req) } });
  res.status(204).send();
}));

// --- Integrations ---

router.get("/v1/integrations", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const connections = await prisma.integrationConnection.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(connections);
}));

router.post("/v1/integrations/connect", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
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
    data: { channelId: parsed.data.channelId, merchantId: parsed.data.merchantId, provider: parsed.data.provider, status: "pending" },
  });
  const oauthUrl = `https://oauth.${parsed.data.provider}.com/authorize?client_id=vibeaff&redirect_uri=/v1/integrations/callback&state=${connection.id}`;
  await logAudit(prisma, { action: "integration_connect", entity: "integration", entityId: connection.id });
  res.status(201).json({ connection, oauthUrl });
}));

router.post("/v1/integrations/callback", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
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
  const expiresAt = parsed.data.expiresInSeconds ? new Date(Date.now() + parsed.data.expiresInSeconds * 1000) : null;
  const connection = await prisma.integrationConnection.update({
    where: { id: parsed.data.connectionId },
    data: { status: "connected", accessToken: parsed.data.accessToken, refreshToken: parsed.data.refreshToken, expiresAt },
  });
  await logAudit(prisma, { action: "integration_connected", entity: "integration", entityId: connection.id });
  res.json(connection);
}));

router.post("/v1/integrations/:id/disconnect", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const connection = await prisma.integrationConnection.update({
    where: { id: paramId(req) },
    data: { status: "disconnected", accessToken: null, refreshToken: null },
  });
  await logAudit(prisma, { action: "integration_disconnected", entity: "integration", entityId: connection.id });
  res.json(connection);
}));

// --- OAuth redirect flows ---

router.get("/v1/integrations/oauth/:provider", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
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

router.get("/v1/integrations/oauth/callback", asyncHandler(async (req, res) => {
  const { state, code } = req.query as { state?: string; code?: string };
  if (!state || !code) {
    return res.status(400).json({ error: "Missing state or code" });
  }
  const connection = await prisma.integrationConnection.findUnique({ where: { id: state } });
  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }
  const updated = await prisma.integrationConnection.update({
    where: { id: state },
    data: { status: "connected", accessToken: `tok_${code}`, expiresAt: new Date(Date.now() + 3600 * 1000) },
  });
  await logAudit(prisma, { action: "oauth_callback", entity: "integration", entityId: updated.id });
  res.json({ status: "connected", connectionId: updated.id });
}));

// --- Creative tools ---

router.get("/v1/creative-tools", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const tools = await prisma.creativeTool.findMany({ orderBy: { createdAt: "desc" }, ...pg });
  res.json(tools);
}));

router.post("/v1/creative-tools", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const parsed = creativeToolSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tool = await prisma.creativeTool.create({ data: parsed.data });
  res.status(201).json(tool);
}));

router.put("/v1/creative-tools/:id", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const parsed = creativeToolSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tool = await prisma.creativeTool.update({ where: { id: paramId(req) }, data: parsed.data });
  res.json(tool);
}));

router.delete("/v1/creative-tools/:id", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  await prisma.creativeTool.delete({ where: { id: paramId(req) } });
  res.status(204).send();
}));

// --- Creative generation (stubs) ---

router.post("/v1/creatives/generate-copy", authMiddleware, asyncHandler(async (req, res) => {
  const schema = z.object({ productName: z.string().min(2), targetAudience: z.string().min(2), channel: z.string().min(2), tone: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const variants = [
    { headline: `Discover ${parsed.data.productName} - Made for ${parsed.data.targetAudience}`, cta: "Shop now" },
    { headline: `${parsed.data.targetAudience}? ${parsed.data.productName} is for you.`, cta: "Learn more" },
    { headline: `Upgrade your life with ${parsed.data.productName}`, cta: "Get started" },
  ];
  await logAudit(prisma, { action: "creative_copy_generated", entity: "creative", details: JSON.stringify(parsed.data) });
  res.json({ channel: parsed.data.channel, variants });
}));

router.post("/v1/creatives/generate-image", authMiddleware, asyncHandler(async (req, res) => {
  const schema = z.object({ productName: z.string().min(2), style: z.enum(["photo", "illustration", "minimal"]), dimensions: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json({ status: "queued", message: "Image generation queued. Connect STABILITY_API_KEY or OPENAI_API_KEY to enable.", params: parsed.data });
}));

router.post("/v1/creatives/translate", authMiddleware, asyncHandler(async (req, res) => {
  const schema = z.object({ text: z.string().min(1), targetLanguage: z.string().min(2).max(5), sourceLanguage: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json({ status: "queued", message: "Translation queued. Connect TRANSLATION_API_KEY to enable.", params: parsed.data });
}));

// --- Metrics ---

router.get("/v1/metrics", authMiddleware, requireRole("admin"), asyncHandler(async (_req, res) => {
  const [merchants, affiliates, programs, campaigns, conversions, payouts, channels, creativeTools] =
    await Promise.all([
      prisma.merchant.count(), prisma.affiliate.count(), prisma.program.count(), prisma.campaign.count(),
      prisma.conversion.count(), prisma.payout.count(), prisma.channel.count(), prisma.creativeTool.count(),
    ]);
  res.json({ merchants, affiliates, programs, campaigns, conversions, payouts, channels, creativeTools });
}));

// --- Audit logs ---

router.get("/v1/audit-logs", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const take = Math.min(Number(req.query.limit ?? 50), 200);
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
  res.json(logs);
}));

// --- AI Assistant ---

const aiChatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
});

const AI_SYSTEM_PROMPT = `You are VibeAff AI — an expert assistant embedded in the VibeAff affiliate marketing platform admin backoffice.

Platform context:
- VibeAff is an affiliate marketing platform with merchants, affiliates, programs, campaigns, conversions, and payouts.
- The API runs on Express.js with Prisma ORM connected to a PostgreSQL database.
- Entities: User, Merchant, Affiliate, Program, Campaign, Link, Click, Conversion, Payout, Channel, CreativeTool, Integration, AuditLog.
- Key features: multi-tier affiliate commissions, fraud detection (velocity checks, self-referral, fraud scoring), gamification/leaderboard, creative generation, crypto payouts.

You help the admin with:
- Understanding and managing the platform (programs, affiliates, payouts, campaigns)
- Analyzing affiliate performance and campaign metrics
- Diagnosing API issues and suggesting fixes
- Writing database queries for custom reports
- Planning new integrations and features
- Security and compliance review
- Best practices for affiliate marketing

Be concise, technical when needed, and actionable. Use markdown formatting. When suggesting code changes, be specific about file paths and exact modifications.`;

router.post("/v1/ai/chat", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const parsed = aiChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const anthropic = new Anthropic({ apiKey });

  const [merchantCount, affiliateCount, programCount, conversionCount, payoutPending] = await Promise.all([
    prisma.merchant.count(), prisma.affiliate.count(), prisma.program.count(),
    prisma.conversion.count(), prisma.payout.count({ where: { status: "pending" } }),
  ]);

  const contextBlock = `\n\nLive platform stats: ${merchantCount} merchants, ${affiliateCount} affiliates, ${programCount} programs, ${conversionCount} conversions, ${payoutPending} pending payouts.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: AI_SYSTEM_PROMPT + contextBlock,
    messages: parsed.data.messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
}));

export default router;
