import express from "express";
import { z } from "zod";
import { prisma, asyncHandler, paramId, paginationParams } from "../shared";
import { authMiddleware, requireRole } from "../auth";

const router = express.Router();

// ── Categories ────────────────────────────────────

router.get("/v1/marketplace/categories", asyncHandler(async (_req, res) => {
  const categories = await prisma.marketplaceCategory.findMany({
    where: { parentId: null },
    include: { children: true, _count: { select: { listings: true } } },
    orderBy: { sortOrder: "asc" },
  });
  res.json(categories);
}));

router.post("/v1/marketplace/categories", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    iconUrl: z.string().url().optional(),
    parentId: z.string().optional(),
    sortOrder: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const category = await prisma.marketplaceCategory.create({ data: parsed.data });
  res.status(201).json(category);
}));

// ── Listings: Browse ──────────────────────────────

router.get("/v1/marketplace/listings", asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const { categorySlug, tag, minCommission, region, channel, sort } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = { status: "active" };

  if (categorySlug) {
    const cat = await prisma.marketplaceCategory.findUnique({ where: { slug: categorySlug } });
    if (cat) where.categoryId = cat.id;
  }
  if (tag) where.tags = { has: tag };
  if (region) where.supportedRegions = { has: region };
  if (channel) where.supportedChannels = { has: channel };

  const orderBy: Record<string, string> = {};
  if (sort === "newest") orderBy.createdAt = "desc";
  else if (sort === "commission") orderBy.commissionDisplay = "desc";
  else if (sort === "rating") orderBy.createdAt = "desc"; // fallback — real rating sort needs aggregation
  else orderBy.createdAt = "desc";

  const listings = await prisma.marketplaceListing.findMany({
    where,
    include: {
      category: { select: { name: true, slug: true } },
      merchant: { select: { name: true, website: true } },
      _count: { select: { reviews: true } },
    },
    orderBy,
    ...pg,
  });

  res.json(listings);
}));

// ── Featured listings ─────────────────────────────

router.get("/v1/marketplace/featured", asyncHandler(async (_req, res) => {
  const listings = await prisma.marketplaceListing.findMany({
    where: { status: "active", featured: true },
    include: {
      category: { select: { name: true, slug: true } },
      merchant: { select: { name: true } },
      _count: { select: { reviews: true } },
    },
    take: 12,
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
}));

// ── Trending (by recent enrollment activity) ──────

router.get("/v1/marketplace/trending", asyncHandler(async (_req, res) => {
  // Programs with most recent enrollments
  const recentEnrollments = await prisma.programEnrollment.groupBy({
    by: ["programId"],
    _count: true,
    where: { appliedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { _count: { programId: "desc" } },
    take: 12,
  });

  const programIds = recentEnrollments.map((e) => e.programId);
  const listings = await prisma.marketplaceListing.findMany({
    where: { programId: { in: programIds }, status: "active" },
    include: {
      category: { select: { name: true, slug: true } },
      merchant: { select: { name: true } },
      _count: { select: { reviews: true } },
    },
  });

  res.json(listings);
}));

// ── Search ────────────────────────────────────────

router.get("/v1/marketplace/search", asyncHandler(async (req, res) => {
  const pg = paginationParams(req);
  const q = (req.query.q as string) ?? "";

  if (!q.trim()) return res.json([]);

  const listings = await prisma.marketplaceListing.findMany({
    where: {
      status: "active",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ],
    },
    include: {
      category: { select: { name: true, slug: true } },
      merchant: { select: { name: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
    ...pg,
  });

  res.json(listings);
}));

// ── Listing detail ────────────────────────────────

router.get("/v1/marketplace/listings/:id", asyncHandler(async (req, res) => {
  const id = paramId(req);
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      category: true,
      merchant: { select: { name: true, website: true } },
      program: { select: { name: true, attributionWindowDays: true, approvalMode: true } },
      reviews: {
        include: { affiliate: { select: { displayName: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!listing) return res.status(404).json({ error: "Listing not found" });

  // Compute average rating
  const avgRating = listing.reviews.length > 0
    ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
    : null;

  res.json({ ...listing, avgRating });
}));

// ── Create listing (merchant/admin) ───────────────

router.post("/v1/marketplace/listings", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const schema = z.object({
    programId: z.string().min(8),
    merchantId: z.string().min(8),
    title: z.string().min(1).max(200),
    description: z.string().min(10).max(1000),
    longDescription: z.string().optional(),
    categoryId: z.string().min(8),
    tags: z.array(z.string()).optional(),
    logoUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    commissionDisplay: z.string().min(1),
    cookieWindowDays: z.number().int().positive().optional(),
    payoutFrequency: z.string().optional(),
    minPayout: z.number().positive().optional(),
    supportedRegions: z.array(z.string()).optional(),
    supportedChannels: z.array(z.string()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const listing = await prisma.marketplaceListing.create({
    data: { ...parsed.data, status: "pending_review" },
  });

  res.status(201).json(listing);
}));

// ── Update listing ────────────────────────────────

router.patch("/v1/marketplace/listings/:id", authMiddleware, requireRole("admin", "partner"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  const schema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(10).max(1000).optional(),
    longDescription: z.string().optional(),
    categoryId: z.string().min(8).optional(),
    tags: z.array(z.string()).optional(),
    logoUrl: z.string().url().nullable().optional(),
    bannerUrl: z.string().url().nullable().optional(),
    commissionDisplay: z.string().optional(),
    cookieWindowDays: z.number().int().positive().optional(),
    supportedRegions: z.array(z.string()).optional(),
    supportedChannels: z.array(z.string()).optional(),
    status: z.enum(["draft", "pending_review", "active", "suspended"]).optional(),
    featured: z.boolean().optional(),
    verified: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const listing = await prisma.marketplaceListing.update({ where: { id }, data: parsed.data });
  res.json(listing);
}));

// ── Admin approve listing ─────────────────────────

router.post("/v1/marketplace/listings/:id/approve", authMiddleware, requireRole("admin"), asyncHandler(async (req, res) => {
  const id = paramId(req);
  const listing = await prisma.marketplaceListing.update({
    where: { id },
    data: { status: "active", verified: true },
  });
  res.json(listing);
}));

// ── Apply to a listing (affiliate) ────────────────

router.post("/v1/marketplace/listings/:id/apply", authMiddleware, asyncHandler(async (req, res) => {
  const listingId = paramId(req);
  const schema = z.object({ affiliateId: z.string().min(8), note: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    include: { program: { select: { id: true, approvalMode: true } } },
  });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  // Use the enrollment system
  const existing = await prisma.programEnrollment.findUnique({
    where: { programId_affiliateId: { programId: listing.programId, affiliateId: parsed.data.affiliateId } },
  });
  if (existing) {
    return res.status(409).json({ error: `Already applied (status: ${existing.status})`, enrollment: existing });
  }

  const status = listing.program.approvalMode === "auto" ? "approved" : "pending";
  const enrollment = await prisma.programEnrollment.create({
    data: { programId: listing.programId, affiliateId: parsed.data.affiliateId, status, note: parsed.data.note },
  });

  res.status(201).json(enrollment);
}));

// ── Reviews ───────────────────────────────────────

router.post("/v1/marketplace/listings/:id/reviews", authMiddleware, asyncHandler(async (req, res) => {
  const listingId = paramId(req);
  const schema = z.object({
    affiliateId: z.string().min(8),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(200).optional(),
    body: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Verify affiliate is enrolled
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { programId_affiliateId: { programId: listing.programId, affiliateId: parsed.data.affiliateId } },
  });
  if (!enrollment || enrollment.status !== "approved") {
    return res.status(403).json({ error: "Must be an approved affiliate to review" });
  }

  const review = await prisma.marketplaceReview.upsert({
    where: { listingId_affiliateId: { listingId, affiliateId: parsed.data.affiliateId } },
    update: { rating: parsed.data.rating, title: parsed.data.title, body: parsed.data.body },
    create: { listingId, ...parsed.data },
  });

  res.status(201).json(review);
}));

export default router;
