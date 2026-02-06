import { PrismaClient } from "@prisma/client";

type TieredRule = {
  thresholds: { min: number; max?: number; rate: number }[];
};

/**
 * Resolve the best commission rate for a given program + affiliate + order total.
 *
 * Priority: Higher priority rules override lower ones.
 * If no matching rule, falls back to merchant defaultCommissionPct.
 *
 * Types:
 * - percentage: value is the % (e.g. 10 = 10%)
 * - fixed: value is a flat amount per conversion
 * - tiered: tiers JSON defines rate brackets based on order total
 */
export async function resolveCommission(
  prisma: PrismaClient,
  programId: string,
  affiliateId: string,
  orderTotal: number,
  fallbackPct: number,
): Promise<{ commissionPct: number; commissionAmount: number; ruleId: string | null }> {
  const now = new Date();

  const rules = await prisma.commissionRule.findMany({
    where: {
      programId,
      OR: [
        { affiliateId: null },
        { affiliateId },
      ],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    },
    orderBy: { priority: "desc" },
  });

  // Affiliate-specific rules take precedence over program-wide rules at the same priority
  const sorted = rules.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    // Prefer affiliate-specific over program-wide
    if (a.affiliateId && !b.affiliateId) return -1;
    if (!a.affiliateId && b.affiliateId) return 1;
    return 0;
  });

  const rule = sorted[0];
  if (!rule) {
    const amount = Math.round(orderTotal * (fallbackPct / 100) * 100) / 100;
    return { commissionPct: fallbackPct, commissionAmount: amount, ruleId: null };
  }

  if (rule.type === "fixed" && rule.value != null) {
    return { commissionPct: 0, commissionAmount: rule.value, ruleId: rule.id };
  }

  if (rule.type === "tiered" && rule.tiers) {
    const tiered = rule.tiers as TieredRule;
    const bracket = tiered.thresholds?.find(
      (t) => orderTotal >= t.min && (t.max === undefined || orderTotal < t.max),
    );
    const rate = bracket?.rate ?? fallbackPct;
    const amount = Math.round(orderTotal * (rate / 100) * 100) / 100;
    return { commissionPct: rate, commissionAmount: amount, ruleId: rule.id };
  }

  // Default: percentage
  const pct = rule.value ?? fallbackPct;
  const amount = Math.round(orderTotal * (pct / 100) * 100) / 100;
  return { commissionPct: pct, commissionAmount: amount, ruleId: rule.id };
}
