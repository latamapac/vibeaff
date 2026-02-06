import crypto from "crypto";
import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";
import { attemptDelivery } from "../webhooks";

const router = express.Router();

// --- CRUD: Webhook Endpoints ---

router.get("/v1/webhooks", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const merchantId = req.query.merchantId as string | undefined;
  const where: Record<string, unknown> = {};
  if (merchantId) where.merchantId = merchantId;

  const endpoints = await prisma.webhookEndpoint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { deliveries: true } } },
  });
  res.json(endpoints);
}));

router.post("/v1/webhooks", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const schema = z.object({
    merchantId: z.string().min(8),
    url: z.string().url(),
    events: z.array(z.string()).min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  const endpoint = await prisma.webhookEndpoint.create({
    data: { ...parsed.data, secret, status: "active" },
  });

  await logAudit(prisma, { action: "webhook_created", entity: "webhook_endpoint", entityId: endpoint.id });

  // Return secret only on creation
  res.status(201).json(endpoint);
}));

router.patch("/v1/webhooks/:id", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  const schema = z.object({
    url: z.string().url().optional(),
    events: z.array(z.string()).min(1).optional(),
    status: z.enum(["active", "paused"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const endpoint = await prisma.webhookEndpoint.update({ where: { id }, data: parsed.data });
  await logAudit(prisma, { action: "webhook_updated", entity: "webhook_endpoint", entityId: id });
  res.json(endpoint);
}));

router.delete("/v1/webhooks/:id", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  await prisma.webhookEndpoint.delete({ where: { id } });
  await logAudit(prisma, { action: "webhook_deleted", entity: "webhook_endpoint", entityId: id });
  res.json({ deleted: true });
}));

// --- Delivery logs ---

router.get("/v1/webhooks/:id/deliveries", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const endpointId = paramId(req);
  const pg = paginationParams(req);

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { endpointId },
    orderBy: { createdAt: "desc" },
    ...pg,
  });
  res.json(deliveries);
}));

// --- Retry a failed delivery ---

router.post("/v1/webhook-deliveries/:id/retry", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const deliveryId = paramId(req);
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });
  if (!delivery) {
    return res.status(404).json({ error: "Delivery not found" });
  }
  if (delivery.status === "delivered") {
    return res.status(400).json({ error: "Already delivered" });
  }

  // Reset and re-attempt
  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: { status: "pending", lastError: null },
  });

  attemptDelivery(
    prisma,
    delivery.id,
    delivery.endpoint.url,
    delivery.endpoint.secret,
    delivery.event,
    delivery.payload as Record<string, unknown>,
  ).catch(() => {});

  res.json({ retrying: true });
}));

// --- Roll secret ---

router.post("/v1/webhooks/:id/roll-secret", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  const newSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
  const endpoint = await prisma.webhookEndpoint.update({ where: { id }, data: { secret: newSecret } });
  await logAudit(prisma, { action: "webhook_secret_rolled", entity: "webhook_endpoint", entityId: id });
  res.json(endpoint);
}));

export default router;
