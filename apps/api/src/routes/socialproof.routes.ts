import express from "express";
import { z } from "zod";
import { prisma, asyncHandler } from "../shared";

const router = express.Router();

/**
 * Public endpoint - returns recent anonymized conversions for social proof.
 * Shows "Someone from [city] just purchased [product]" style notifications.
 */
router.get("/v1/social-proof/feed", asyncHandler(async (req, res) => {
  const schema = z.object({
    merchantId: z.string().min(8),
    limit: z.coerce.number().int().min(1).max(20).default(5),
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { merchantId, limit } = parsed.data;

  // Verify merchant exists
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });

  // Get recent non-flagged conversions for this merchant's programs
  const programs = await prisma.program.findMany({
    where: { merchantId },
    select: { id: true },
  });
  const programIds = programs.map((p) => p.id);

  const conversions = await prisma.conversion.findMany({
    where: {
      programId: { in: programIds },
      status: { not: "flagged" },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      orderTotal: true,
      currency: true,
      createdAt: true,
      program: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Anonymize: remove PII, generate pseudo-location from order ID hash
  const cities = ["New York", "Los Angeles", "London", "Toronto", "Sydney", "Berlin", "Tokyo", "Paris", "Singapore", "Dubai"];
  const names = ["Someone", "A customer", "A buyer", "A shopper"];

  res.json(conversions.map((c, i) => {
    const hash = c.id.charCodeAt(0) + c.id.charCodeAt(1);
    return {
      id: c.id,
      name: names[hash % names.length],
      city: cities[(hash + i) % cities.length],
      program: c.program.name,
      amount: c.orderTotal,
      currency: c.currency,
      timeAgo: getTimeAgo(c.createdAt),
    };
  }));
}));

/**
 * Returns embeddable widget script for social proof notifications.
 */
router.get("/v1/social-proof/widget.js", (_req, res) => {
  const script = `
(function() {
  var API_URL = (document.currentScript && document.currentScript.getAttribute('data-api')) || '';
  var merchantId = (document.currentScript && document.currentScript.getAttribute('data-merchant')) || '';
  var position = (document.currentScript && document.currentScript.getAttribute('data-position')) || 'bottom-left';

  if (!API_URL || !merchantId) return;

  var style = document.createElement('style');
  style.textContent = \`
    .vibeaff-sp { position: fixed; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .vibeaff-sp.bottom-left { bottom: 20px; left: 20px; }
    .vibeaff-sp.bottom-right { bottom: 20px; right: 20px; }
    .vibeaff-sp-toast {
      background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
      padding: 12px 16px; color: #f6f6f7; font-size: 13px; max-width: 320px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4); transform: translateY(20px); opacity: 0;
      transition: all 0.4s ease;
    }
    .vibeaff-sp-toast.show { transform: translateY(0); opacity: 1; }
    .vibeaff-sp-toast .name { color: #D7FF3B; font-weight: 600; }
    .vibeaff-sp-toast .time { color: #8B8B9E; font-size: 11px; margin-top: 2px; }
  \`;
  document.head.appendChild(style);

  var container = document.createElement('div');
  container.className = 'vibeaff-sp ' + position;
  document.body.appendChild(container);

  function showNotification(item) {
    var toast = document.createElement('div');
    toast.className = 'vibeaff-sp-toast';
    toast.innerHTML = '<div><span class="name">' + item.name + '</span> from ' + item.city + ' just purchased</div><div class="time">' + item.timeAgo + '</div>';
    container.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 50);
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 400); }, 5000);
  }

  fetch(API_URL + '/v1/social-proof/feed?merchantId=' + merchantId + '&limit=10')
    .then(function(r) { return r.json(); })
    .then(function(items) {
      var i = 0;
      function next() {
        if (i >= items.length) i = 0;
        showNotification(items[i++]);
        setTimeout(next, 8000 + Math.random() * 4000);
      }
      setTimeout(next, 3000);
    });
})();
`;
  res.setHeader("Content-Type", "application/javascript");
  res.send(script);
});

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default router;
