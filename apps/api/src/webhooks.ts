import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

/**
 * Dispatch a webhook event to all matching endpoints for a merchant.
 * Creates delivery records and processes them immediately.
 */
export async function dispatchWebhook(
  prisma: PrismaClient,
  merchantId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      merchantId,
      status: "active",
      events: { has: event },
    },
  });

  for (const endpoint of endpoints) {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        event,
        payload: payload as unknown as Record<string, never>,
        status: "pending",
      },
    });

    // Fire and forget — attempt delivery async
    attemptDelivery(prisma, delivery.id, endpoint.url, endpoint.secret, event, payload).catch(() => {});
  }
}

export async function attemptDelivery(
  prisma: PrismaClient,
  deliveryId: string,
  url: string,
  secret: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Signature": `sha256=${signature}`,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        statusCode: res.status,
        attempts: { increment: 1 },
        status: res.ok ? "delivered" : "failed",
        lastError: res.ok ? null : `HTTP ${res.status}`,
        nextRetryAt: res.ok ? null : getNextRetry(1),
      },
    });
  } catch (err) {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: { increment: 1 },
        status: "failed",
        lastError: (err as Error).message,
        nextRetryAt: getNextRetry(1),
      },
    });
  }
}

function getNextRetry(attempt: number): Date {
  // Exponential backoff: 1min, 5min, 30min
  const delays = [60_000, 300_000, 1_800_000];
  const delay = delays[Math.min(attempt - 1, delays.length - 1)];
  return new Date(Date.now() + delay);
}
