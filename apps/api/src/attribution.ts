import { PrismaClient } from "@prisma/client";

type TouchPointData = {
  affiliateId: string;
  createdAt: Date;
};

type CreditShare = {
  affiliateId: string;
  weight: number;
};

/**
 * Resolve attribution for a conversion based on session touch points.
 * Returns weighted credit distribution across affiliates.
 *
 * Models:
 * - last_click: 100% to last touch (default)
 * - first_click: 100% to first touch
 * - linear: Equal credit across all touches
 * - time_decay: More credit to recent touches (half-life decay)
 */
export async function resolveAttribution(
  prisma: PrismaClient,
  sessionId: string,
  programId: string,
  model: string,
): Promise<CreditShare[]> {
  const touchPoints = await prisma.touchPoint.findMany({
    where: { sessionId, programId },
    orderBy: { createdAt: "asc" },
  });

  if (touchPoints.length === 0) return [];
  if (touchPoints.length === 1) {
    return [{ affiliateId: touchPoints[0].affiliateId, weight: 1.0 }];
  }

  switch (model) {
    case "first_click":
      return firstClick(touchPoints);
    case "linear":
      return linear(touchPoints);
    case "time_decay":
      return timeDecay(touchPoints);
    case "last_click":
    default:
      return lastClick(touchPoints);
  }
}

function lastClick(touchPoints: TouchPointData[]): CreditShare[] {
  const last = touchPoints[touchPoints.length - 1];
  return [{ affiliateId: last.affiliateId, weight: 1.0 }];
}

function firstClick(touchPoints: TouchPointData[]): CreditShare[] {
  const first = touchPoints[0];
  return [{ affiliateId: first.affiliateId, weight: 1.0 }];
}

function linear(touchPoints: TouchPointData[]): CreditShare[] {
  // Group by affiliate and distribute equally
  const affiliateMap = new Map<string, number>();
  const weightPer = 1.0 / touchPoints.length;

  for (const tp of touchPoints) {
    affiliateMap.set(tp.affiliateId, (affiliateMap.get(tp.affiliateId) ?? 0) + weightPer);
  }

  return Array.from(affiliateMap.entries()).map(([affiliateId, weight]) => ({
    affiliateId,
    weight: Math.round(weight * 10000) / 10000,
  }));
}

function timeDecay(touchPoints: TouchPointData[]): CreditShare[] {
  // Half-life of 7 days — more recent touches get exponentially more credit
  const halfLifeMs = 7 * 24 * 60 * 60 * 1000;
  const now = touchPoints[touchPoints.length - 1].createdAt.getTime();

  const rawWeights: { affiliateId: string; weight: number }[] = [];
  let totalWeight = 0;

  for (const tp of touchPoints) {
    const age = now - tp.createdAt.getTime();
    const weight = Math.pow(0.5, age / halfLifeMs);
    rawWeights.push({ affiliateId: tp.affiliateId, weight });
    totalWeight += weight;
  }

  // Normalize and group by affiliate
  const affiliateMap = new Map<string, number>();
  for (const rw of rawWeights) {
    const normalized = rw.weight / totalWeight;
    affiliateMap.set(rw.affiliateId, (affiliateMap.get(rw.affiliateId) ?? 0) + normalized);
  }

  return Array.from(affiliateMap.entries()).map(([affiliateId, weight]) => ({
    affiliateId,
    weight: Math.round(weight * 10000) / 10000,
  }));
}

/**
 * Record a touch point when a click or promo code use occurs.
 */
export async function recordTouchPoint(
  prisma: PrismaClient,
  params: {
    sessionId: string;
    affiliateId: string;
    programId: string;
    type: "click" | "promo_use" | "view";
    linkId?: string;
    promoCodeId?: string;
    ipAddress?: string;
    userAgent?: string;
  },
) {
  return prisma.touchPoint.create({
    data: params,
  });
}
