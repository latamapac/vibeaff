import express from "express";
import { prisma, asyncHandler } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { resolveAttribution } from "../attribution";

const router = express.Router();

// --- Get touch points for a session ---

router.get("/v1/attribution/touchpoints", authMiddleware, asyncHandler(async (req, res) => {
  const sessionId = req.query.sessionId as string | undefined;
  const programId = req.query.programId as string | undefined;

  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const where: Record<string, unknown> = { sessionId };
  if (programId) where.programId = programId;

  const touchPoints = await prisma.touchPoint.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  res.json(touchPoints);
}));

// --- Simulate attribution for a session ---

router.get("/v1/attribution/simulate", authMiddleware, asyncHandler(async (req, res) => {
  const { sessionId, programId, model } = req.query as Record<string, string | undefined>;

  if (!sessionId || !programId) {
    return res.status(400).json({ error: "sessionId and programId required" });
  }

  const program = await prisma.program.findUnique({ where: { id: programId } });
  const attributionModel = model ?? program?.attributionModel ?? "last_click";

  const credits = await resolveAttribution(prisma, sessionId, programId, attributionModel);

  // Enrich with affiliate names
  const affiliateIds = credits.map((c) => c.affiliateId);
  const affiliates = await prisma.affiliate.findMany({
    where: { id: { in: affiliateIds } },
    select: { id: true, displayName: true },
  });
  const nameMap = new Map(affiliates.map((a) => [a.id, a.displayName]));

  res.json({
    model: attributionModel,
    credits: credits.map((c) => ({
      ...c,
      displayName: nameMap.get(c.affiliateId) ?? "Unknown",
      weightPercent: `${(c.weight * 100).toFixed(1)}%`,
    })),
  });
}));

// --- Attribution summary for a program (all conversions) ---

router.get("/v1/attribution/program-summary", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const programId = req.query.programId as string;
  if (!programId) return res.status(400).json({ error: "programId required" });

  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  // Get unique sessions with touch points for this program
  const sessions = await prisma.touchPoint.groupBy({
    by: ["sessionId"],
    where: { programId },
    _count: true,
    orderBy: { _count: { sessionId: "desc" } },
    take: limit,
  });

  // Only show multi-touch sessions (more than 1 touch)
  const multiTouch = sessions.filter((s) => s._count > 1);

  res.json({
    totalSessions: sessions.length,
    multiTouchSessions: multiTouch.length,
    sessions: sessions.map((s) => ({
      sessionId: s.sessionId,
      touchPoints: s._count,
    })),
  });
}));

export default router;
