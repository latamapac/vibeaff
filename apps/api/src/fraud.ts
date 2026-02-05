import { PrismaClient } from "@prisma/client";

const VELOCITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_CONVERSIONS_PER_HOUR = 20;
const MAX_CLICKS_PER_MINUTE = 60;

export async function checkConversionVelocity(
  prisma: PrismaClient,
  affiliateId: string
): Promise<{ ok: boolean; reason?: string }> {
  const since = new Date(Date.now() - VELOCITY_WINDOW_MS);
  const count = await prisma.conversion.count({
    where: { affiliateId, createdAt: { gte: since } },
  });
  if (count >= MAX_CONVERSIONS_PER_HOUR) {
    return { ok: false, reason: `Velocity exceeded: ${count} conversions in the last hour` };
  }
  return { ok: true };
}

export async function checkClickVelocity(
  prisma: PrismaClient,
  ipAddress: string
): Promise<{ ok: boolean; reason?: string }> {
  const since = new Date(Date.now() - 60 * 1000); // 1 minute
  const count = await prisma.click.count({
    where: { ipAddress, createdAt: { gte: since } },
  });
  if (count >= MAX_CLICKS_PER_MINUTE) {
    return { ok: false, reason: `Click velocity exceeded: ${count} clicks/min from ${ipAddress}` };
  }
  return { ok: true };
}

export function checkSelfReferral(
  affiliateId: string,
  ipAddress?: string | null,
  conversionIp?: string | null
): { ok: boolean; reason?: string } {
  if (ipAddress && conversionIp && ipAddress === conversionIp) {
    return { ok: false, reason: "Possible self-referral: click and conversion from same IP" };
  }
  return { ok: true };
}

export function computeFraudScore(signals: {
  velocityOk: boolean;
  selfReferralOk: boolean;
  conversionDelaySeconds: number;
}): number {
  let score = 0;
  if (!signals.velocityOk) score += 40;
  if (!signals.selfReferralOk) score += 30;
  if (signals.conversionDelaySeconds < 5) score += 20; // too-fast conversion
  if (signals.conversionDelaySeconds < 1) score += 10;
  return Math.min(score, 100);
}
