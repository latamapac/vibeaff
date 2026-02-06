import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";
import { logAudit } from "../audit";
import { dispatchWebhook } from "../webhooks";

const router = express.Router();

// --- Affiliate applies to a program ---

router.post("/v1/programs/:id/apply", authMiddleware, asyncHandler(async (req, res) => {
  const programId = paramId(req);
  const schema = z.object({ affiliateId: z.string().min(8), note: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    return res.status(404).json({ error: "Program not found" });
  }

  const existing = await prisma.programEnrollment.findUnique({
    where: { programId_affiliateId: { programId, affiliateId: parsed.data.affiliateId } },
  });
  if (existing) {
    return res.status(409).json({ error: `Already applied (status: ${existing.status})`, enrollment: existing });
  }

  const status = program.approvalMode === "auto" ? "approved" : "pending";
  const enrollment = await prisma.programEnrollment.create({
    data: { programId, affiliateId: parsed.data.affiliateId, status, note: parsed.data.note },
  });

  await logAudit(prisma, {
    action: status === "approved" ? "enrollment_auto_approved" : "enrollment_applied",
    entity: "enrollment",
    entityId: enrollment.id,
  });

  // Dispatch webhook for auto-approved enrollments
  if (status === "approved") {
    dispatchWebhook(prisma, program.merchantId, "affiliate.enrolled", {
      enrollmentId: enrollment.id, affiliateId: parsed.data.affiliateId, programId,
    }).catch(() => {});
  }

  res.status(201).json(enrollment);
}));

// --- List applications for a program (admin/partner) ---

router.get("/v1/programs/:id/applications", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const programId = paramId(req);
  const pg = paginationParams(req);
  const statusFilter = req.query.status as string | undefined;

  const where: Record<string, unknown> = { programId };
  if (statusFilter) where.status = statusFilter;

  const enrollments = await prisma.programEnrollment.findMany({
    where,
    include: { affiliate: { select: { displayName: true, payoutMethod: true } } },
    orderBy: { appliedAt: "desc" },
    ...pg,
  });
  res.json(enrollments);
}));

// --- All pending enrollments (admin) ---

router.get("/v1/enrollments", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const statusFilter = req.query.status as string | undefined;
  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;

  const enrollments = await prisma.programEnrollment.findMany({
    where,
    include: {
      affiliate: { select: { displayName: true } },
      program: { select: { name: true, merchantId: true } },
    },
    orderBy: { appliedAt: "desc" },
    ...pg,
  });
  res.json(enrollments);
}));

// --- Approve enrollment ---

router.post("/v1/enrollments/:id/approve", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const enrollmentId = paramId(req);
  const enrollment = await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: { status: "approved", reviewedAt: new Date(), reviewedBy: "admin" },
    include: { program: { select: { merchantId: true } } },
  });
  await logAudit(prisma, { action: "enrollment_approved", entity: "enrollment", entityId: enrollmentId });

  dispatchWebhook(prisma, enrollment.program.merchantId, "affiliate.enrolled", {
    enrollmentId, affiliateId: enrollment.affiliateId, programId: enrollment.programId,
  }).catch(() => {});

  res.json(enrollment);
}));

// --- Reject enrollment ---

router.post("/v1/enrollments/:id/reject", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const enrollmentId = paramId(req);
  const schema = z.object({ note: z.string().optional() });
  const parsed = schema.safeParse(req.body);

  const enrollment = await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: { status: "rejected", reviewedAt: new Date(), reviewedBy: "admin", note: parsed.success ? parsed.data.note : undefined },
  });
  await logAudit(prisma, { action: "enrollment_rejected", entity: "enrollment", entityId: enrollmentId });
  res.json(enrollment);
}));

// --- Suspend enrollment ---

router.post("/v1/enrollments/:id/suspend", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const enrollmentId = paramId(req);
  const enrollment = await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: { status: "suspended", reviewedAt: new Date(), reviewedBy: "admin" },
  });
  await logAudit(prisma, { action: "enrollment_suspended", entity: "enrollment", entityId: enrollmentId });
  res.json(enrollment);
}));

// --- Affiliate's enrollments ---

router.get("/v1/affiliates/:id/enrollments", authMiddleware, asyncHandler(async (req, res) => {
  const affiliateId = paramId(req);
  const enrollments = await prisma.programEnrollment.findMany({
    where: { affiliateId },
    include: { program: { select: { name: true, merchantId: true, merchant: { select: { name: true } } } } },
    orderBy: { appliedAt: "desc" },
  });
  res.json(enrollments);
}));

export default router;
