import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";

const router = express.Router();

// --- Notification channel model (stored in metadata on WebhookEndpoint or separate) ---
// We'll reuse WebhookEndpoint with a "type" convention:
// - url starting with https://hooks.slack.com = Slack
// - url starting with https://discord.com/api/webhooks = Discord
// The webhook system already dispatches to these URLs, so we just need
// formatted payloads for Slack/Discord.

/**
 * POST /v1/notifications/test - Send a test notification to a Slack/Discord webhook URL.
 */
router.post("/v1/notifications/test", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const schema = z.object({
    url: z.string().url(),
    message: z.string().default("Test notification from VibeAff"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { url, message } = parsed.data;
  const body = formatNotification(url, message, "test", {});

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    res.json({ success: response.ok, status: response.status });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}));

/**
 * Helper to send formatted notifications to Slack or Discord.
 */
export function formatNotification(
  url: string,
  text: string,
  event: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const isSlack = url.includes("hooks.slack.com");
  const isDiscord = url.includes("discord.com/api/webhooks");

  if (isSlack) {
    return {
      text,
      blocks: [
        { type: "header", text: { type: "plain_text", text: `VibeAff: ${event}` } },
        { type: "section", text: { type: "mrkdwn", text } },
        ...(Object.keys(data).length > 0 ? [{
          type: "section",
          fields: Object.entries(data).slice(0, 10).map(([k, v]) => ({
            type: "mrkdwn",
            text: `*${k}:*\n${v}`,
          })),
        }] : []),
      ],
    };
  }

  if (isDiscord) {
    return {
      content: text,
      embeds: [{
        title: `VibeAff: ${event}`,
        description: text,
        color: 0xD7FF3B,
        fields: Object.entries(data).slice(0, 10).map(([k, v]) => ({
          name: k,
          value: String(v),
          inline: true,
        })),
        timestamp: new Date().toISOString(),
      }],
    };
  }

  // Generic webhook
  return { text, event, data };
}

/**
 * Send notification to all matching Slack/Discord endpoints for a merchant.
 * Called from event handlers (conversion, payout, enrollment).
 */
export async function sendNotification(
  merchantId: string,
  event: string,
  message: string,
  data: Record<string, unknown>,
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      merchantId,
      status: "active",
      events: { has: event },
      OR: [
        { url: { contains: "hooks.slack.com" } },
        { url: { contains: "discord.com/api/webhooks" } },
      ],
    },
  });

  for (const ep of endpoints) {
    const body = formatNotification(ep.url, message, event, data);
    fetch(ep.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }
}

export default router;
