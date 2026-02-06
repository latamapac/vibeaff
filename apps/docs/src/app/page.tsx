"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MatrixRain from "./MatrixRain";

/* ================================================================
   TYPES
   ================================================================ */
type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Endpoint {
  method: Method;
  path: string;
  description: string;
  requestBody?: Record<string, unknown>;
  responseExample: Record<string, unknown>;
}

interface EndpointGroup {
  label: string;
  slug: string;
  endpoints: Endpoint[];
}

/* ================================================================
   ENDPOINT DATA — 45+ endpoints
   ================================================================ */
const API_GROUPS: EndpointGroup[] = [
  {
    label: "Auth",
    slug: "auth",
    endpoints: [
      {
        method: "POST",
        path: "/v1/auth/register",
        description: "Register a new user account with email and password.",
        requestBody: {
          email: "user@example.com",
          password: "s3cur3Pa$$word",
          name: "Jane Doe",
          role: "merchant",
        },
        responseExample: {
          id: "usr_abc123",
          email: "user@example.com",
          name: "Jane Doe",
          role: "merchant",
          token: "eyJhbGciOiJIUzI1NiIs...",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
      {
        method: "POST",
        path: "/v1/auth/login",
        description: "Authenticate with email & password and receive a JWT.",
        requestBody: {
          email: "user@example.com",
          password: "s3cur3Pa$$word",
        },
        responseExample: {
          token: "eyJhbGciOiJIUzI1NiIs...",
          expiresIn: 86400,
          user: { id: "usr_abc123", email: "user@example.com", role: "merchant" },
        },
      },
      {
        method: "GET",
        path: "/v1/auth/me",
        description: "Return the currently authenticated user profile.",
        responseExample: {
          id: "usr_abc123",
          email: "user@example.com",
          name: "Jane Doe",
          role: "merchant",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
    ],
  },
  {
    label: "Merchants",
    slug: "merchants",
    endpoints: [
      {
        method: "GET",
        path: "/v1/merchants",
        description: "List all merchants. Supports pagination via ?page and ?limit query params.",
        responseExample: {
          data: [
            { id: "mrc_001", name: "Acme Corp", domain: "acme.com", status: "active" },
            { id: "mrc_002", name: "Globex Inc", domain: "globex.io", status: "active" },
          ],
          meta: { page: 1, limit: 20, total: 2 },
        },
      },
      {
        method: "POST",
        path: "/v1/merchants",
        description: "Create a new merchant account.",
        requestBody: {
          name: "Acme Corp",
          domain: "acme.com",
          contactEmail: "partner@acme.com",
          category: "saas",
        },
        responseExample: {
          id: "mrc_001",
          name: "Acme Corp",
          domain: "acme.com",
          contactEmail: "partner@acme.com",
          category: "saas",
          status: "active",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
    ],
  },
  {
    label: "Affiliates",
    slug: "affiliates",
    endpoints: [
      {
        method: "GET",
        path: "/v1/affiliates",
        description: "List all affiliates. Supports filtering by ?status and ?programId.",
        responseExample: {
          data: [
            { id: "aff_001", name: "BloggerMax", email: "max@blog.com", status: "active", totalEarnings: 1240.5 },
            { id: "aff_002", name: "SocialSara", email: "sara@social.io", status: "active", totalEarnings: 870.0 },
          ],
          meta: { page: 1, limit: 20, total: 2 },
        },
      },
      {
        method: "POST",
        path: "/v1/affiliates",
        description: "Create a new affiliate profile.",
        requestBody: {
          name: "BloggerMax",
          email: "max@blog.com",
          website: "https://bloggermax.com",
          payoutMethod: "paypal",
        },
        responseExample: {
          id: "aff_001",
          name: "BloggerMax",
          email: "max@blog.com",
          website: "https://bloggermax.com",
          payoutMethod: "paypal",
          status: "pending",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
    ],
  },
  {
    label: "Programs",
    slug: "programs",
    endpoints: [
      {
        method: "GET",
        path: "/v1/programs",
        description: "List all affiliate programs across merchants.",
        responseExample: {
          data: [
            {
              id: "prg_001",
              merchantId: "mrc_001",
              name: "Acme Referral Program",
              commissionType: "percentage",
              commissionValue: 15,
              cookieDays: 30,
              status: "active",
            },
          ],
          meta: { page: 1, limit: 20, total: 1 },
        },
      },
      {
        method: "POST",
        path: "/v1/merchants/:id/programs",
        description: "Create a new affiliate program for a merchant.",
        requestBody: {
          name: "Acme Referral Program",
          commissionType: "percentage",
          commissionValue: 15,
          cookieDays: 30,
          terms: "Standard 30-day cookie, 15% recurring commission.",
        },
        responseExample: {
          id: "prg_001",
          merchantId: "mrc_001",
          name: "Acme Referral Program",
          commissionType: "percentage",
          commissionValue: 15,
          cookieDays: 30,
          status: "active",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
    ],
  },
  {
    label: "Campaigns",
    slug: "campaigns",
    endpoints: [
      {
        method: "GET",
        path: "/v1/campaigns",
        description: "List all campaigns. Filter with ?programId or ?status.",
        responseExample: {
          data: [
            {
              id: "cmp_001",
              programId: "prg_001",
              name: "Spring Sale 2026",
              startDate: "2026-03-01",
              endDate: "2026-03-31",
              budget: 5000,
              status: "scheduled",
            },
          ],
          meta: { page: 1, limit: 20, total: 1 },
        },
      },
      {
        method: "POST",
        path: "/v1/campaigns",
        description: "Create a new marketing campaign.",
        requestBody: {
          programId: "prg_001",
          name: "Spring Sale 2026",
          startDate: "2026-03-01",
          endDate: "2026-03-31",
          budget: 5000,
          landingUrl: "https://acme.com/spring",
        },
        responseExample: {
          id: "cmp_001",
          programId: "prg_001",
          name: "Spring Sale 2026",
          startDate: "2026-03-01",
          endDate: "2026-03-31",
          budget: 5000,
          landingUrl: "https://acme.com/spring",
          status: "scheduled",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
    ],
  },
  {
    label: "Links",
    slug: "links",
    endpoints: [
      {
        method: "GET",
        path: "/v1/links",
        description: "List all tracking links. Filter with ?affiliateId or ?campaignId.",
        responseExample: {
          data: [
            {
              id: "lnk_001",
              affiliateId: "aff_001",
              campaignId: "cmp_001",
              code: "SPRING25",
              url: "https://api.vibeaff.com/t/SPRING25",
              clicks: 342,
              conversions: 28,
            },
          ],
          meta: { page: 1, limit: 20, total: 1 },
        },
      },
      {
        method: "POST",
        path: "/v1/links",
        description: "Create a new tracking link.",
        requestBody: {
          affiliateId: "aff_001",
          campaignId: "cmp_001",
          customCode: "SPRING25",
          destinationUrl: "https://acme.com/spring",
        },
        responseExample: {
          id: "lnk_001",
          affiliateId: "aff_001",
          campaignId: "cmp_001",
          code: "SPRING25",
          url: "https://api.vibeaff.com/t/SPRING25",
          destinationUrl: "https://acme.com/spring",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
      {
        method: "GET",
        path: "/t/:code",
        description: "Public redirect endpoint. Tracks the click and redirects user to the destination URL.",
        responseExample: {
          status: 302,
          headers: { Location: "https://acme.com/spring?ref=SPRING25" },
        },
      },
    ],
  },
  {
    label: "Conversions",
    slug: "conversions",
    endpoints: [
      {
        method: "GET",
        path: "/v1/conversions",
        description: "List all conversions. Filter by ?affiliateId, ?status, or date range.",
        responseExample: {
          data: [
            {
              id: "cnv_001",
              linkId: "lnk_001",
              affiliateId: "aff_001",
              amount: 99.0,
              commission: 14.85,
              status: "approved",
              convertedAt: "2026-02-04T14:30:00Z",
            },
          ],
          meta: { page: 1, limit: 20, total: 1 },
        },
      },
      {
        method: "POST",
        path: "/v1/conversions",
        description: "Record a new conversion (server-to-server postback).",
        requestBody: {
          linkId: "lnk_001",
          orderId: "order_7890",
          amount: 99.0,
          currency: "USD",
          metadata: { sku: "PRO_PLAN", quantity: 1 },
        },
        responseExample: {
          id: "cnv_001",
          linkId: "lnk_001",
          affiliateId: "aff_001",
          orderId: "order_7890",
          amount: 99.0,
          commission: 14.85,
          currency: "USD",
          status: "pending",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
    ],
  },
  {
    label: "Payouts",
    slug: "payouts",
    endpoints: [
      {
        method: "GET",
        path: "/v1/payouts",
        description: "List all payouts with optional ?status filter.",
        responseExample: {
          data: [
            {
              id: "pay_001",
              affiliateId: "aff_001",
              amount: 500.0,
              currency: "USD",
              method: "paypal",
              status: "pending",
              createdAt: "2026-02-05T10:00:00Z",
            },
          ],
          meta: { page: 1, limit: 20, total: 1 },
        },
      },
      {
        method: "POST",
        path: "/v1/payouts",
        description: "Create a new payout request.",
        requestBody: {
          affiliateId: "aff_001",
          amount: 500.0,
          currency: "USD",
          method: "paypal",
          note: "January 2026 commissions",
        },
        responseExample: {
          id: "pay_001",
          affiliateId: "aff_001",
          amount: 500.0,
          currency: "USD",
          method: "paypal",
          status: "pending",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
      {
        method: "POST",
        path: "/v1/payouts/:id/approve",
        description: "Approve a pending payout.",
        requestBody: { note: "Approved by admin" },
        responseExample: {
          id: "pay_001",
          status: "approved",
          approvedBy: "usr_abc123",
          approvedAt: "2026-02-05T12:00:00Z",
        },
      },
      {
        method: "POST",
        path: "/v1/payouts/:id/hold",
        description: "Place a payout on hold for review.",
        requestBody: { reason: "Pending fraud review" },
        responseExample: {
          id: "pay_001",
          status: "held",
          heldBy: "usr_abc123",
          heldAt: "2026-02-05T12:00:00Z",
          reason: "Pending fraud review",
        },
      },
      {
        method: "POST",
        path: "/v1/payouts/:id/release",
        description: "Release a held payout for processing.",
        requestBody: { note: "Fraud review cleared" },
        responseExample: {
          id: "pay_001",
          status: "approved",
          releasedBy: "usr_abc123",
          releasedAt: "2026-02-05T13:00:00Z",
        },
      },
      {
        method: "POST",
        path: "/v1/payouts/:id/reject",
        description: "Reject a payout request.",
        requestBody: { reason: "Duplicate payout request" },
        responseExample: {
          id: "pay_001",
          status: "rejected",
          rejectedBy: "usr_abc123",
          rejectedAt: "2026-02-05T12:00:00Z",
          reason: "Duplicate payout request",
        },
      },
    ],
  },
  {
    label: "Channels",
    slug: "channels",
    endpoints: [
      {
        method: "GET",
        path: "/v1/channels",
        description: "List all marketing channels.",
        responseExample: {
          data: [
            { id: "chn_001", name: "Instagram", type: "social", affiliateId: "aff_001", url: "https://instagram.com/bloggermax", status: "verified" },
            { id: "chn_002", name: "Tech Blog", type: "website", affiliateId: "aff_001", url: "https://bloggermax.com", status: "verified" },
          ],
          meta: { page: 1, limit: 20, total: 2 },
        },
      },
      {
        method: "POST",
        path: "/v1/channels",
        description: "Register a new marketing channel.",
        requestBody: {
          name: "Instagram",
          type: "social",
          url: "https://instagram.com/bloggermax",
          platform: "instagram",
        },
        responseExample: {
          id: "chn_001",
          name: "Instagram",
          type: "social",
          url: "https://instagram.com/bloggermax",
          platform: "instagram",
          status: "pending_verification",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
      {
        method: "PUT",
        path: "/v1/channels/:id",
        description: "Update an existing channel.",
        requestBody: {
          name: "Instagram Main",
          url: "https://instagram.com/bloggermax_official",
        },
        responseExample: {
          id: "chn_001",
          name: "Instagram Main",
          url: "https://instagram.com/bloggermax_official",
          status: "verified",
          updatedAt: "2026-02-05T11:00:00Z",
        },
      },
      {
        method: "DELETE",
        path: "/v1/channels/:id",
        description: "Remove a channel.",
        responseExample: { deleted: true, id: "chn_001" },
      },
    ],
  },
  {
    label: "Integrations",
    slug: "integrations",
    endpoints: [
      {
        method: "GET",
        path: "/v1/integrations",
        description: "List all connected integrations for the current merchant.",
        responseExample: {
          data: [
            { id: "int_001", provider: "shopify", status: "connected", connectedAt: "2026-01-15T10:00:00Z" },
            { id: "int_002", provider: "stripe", status: "connected", connectedAt: "2026-01-20T10:00:00Z" },
          ],
        },
      },
      {
        method: "POST",
        path: "/v1/integrations/connect",
        description: "Initiate a new integration connection.",
        requestBody: {
          provider: "shopify",
          config: { shopDomain: "mystore.myshopify.com", apiKey: "shpka_..." },
        },
        responseExample: {
          id: "int_001",
          provider: "shopify",
          status: "connected",
          connectedAt: "2026-02-05T10:00:00Z",
        },
      },
      {
        method: "POST",
        path: "/v1/integrations/callback",
        description: "Handle an incoming webhook callback from an integration provider.",
        requestBody: {
          provider: "shopify",
          event: "order/created",
          payload: { orderId: "5678", total: 149.99, currency: "USD" },
        },
        responseExample: { received: true, conversionId: "cnv_002" },
      },
      {
        method: "POST",
        path: "/v1/integrations/:id/disconnect",
        description: "Disconnect an active integration.",
        requestBody: { reason: "Switching to a different provider" },
        responseExample: { id: "int_001", status: "disconnected", disconnectedAt: "2026-02-05T10:00:00Z" },
      },
      {
        method: "GET",
        path: "/v1/integrations/oauth/:provider",
        description: "Get the OAuth authorization URL for a provider.",
        responseExample: {
          provider: "google",
          authUrl: "https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...&scope=...",
          state: "oauthstate_abc123",
        },
      },
      {
        method: "GET",
        path: "/v1/integrations/oauth/callback",
        description: "Handle OAuth callback. Exchange the authorization code for tokens.",
        responseExample: {
          id: "int_003",
          provider: "google",
          status: "connected",
          connectedAt: "2026-02-05T10:00:00Z",
        },
      },
    ],
  },
  {
    label: "Creative Tools",
    slug: "creative-tools",
    endpoints: [
      {
        method: "GET",
        path: "/v1/creative-tools",
        description: "List available creative assets (banners, widgets, etc.).",
        responseExample: {
          data: [
            { id: "crt_001", name: "Spring Banner 728x90", type: "banner", format: "image/png", dimensions: "728x90", url: "https://cdn.vibeaff.com/creatives/crt_001.png" },
            { id: "crt_002", name: "Product Widget", type: "widget", format: "html", embedCode: "<script src=\"...\"></script>" },
          ],
          meta: { page: 1, limit: 20, total: 2 },
        },
      },
      {
        method: "POST",
        path: "/v1/creative-tools",
        description: "Upload a new creative asset.",
        requestBody: {
          name: "Summer Banner 300x250",
          type: "banner",
          format: "image/png",
          dimensions: "300x250",
          campaignId: "cmp_001",
          fileBase64: "iVBORw0KGgo...",
        },
        responseExample: {
          id: "crt_003",
          name: "Summer Banner 300x250",
          type: "banner",
          url: "https://cdn.vibeaff.com/creatives/crt_003.png",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
      {
        method: "PUT",
        path: "/v1/creative-tools/:id",
        description: "Update metadata for a creative asset.",
        requestBody: { name: "Summer Banner 300x250 v2", campaignId: "cmp_002" },
        responseExample: {
          id: "crt_003",
          name: "Summer Banner 300x250 v2",
          campaignId: "cmp_002",
          updatedAt: "2026-02-05T11:00:00Z",
        },
      },
      {
        method: "DELETE",
        path: "/v1/creative-tools/:id",
        description: "Delete a creative asset.",
        responseExample: { deleted: true, id: "crt_003" },
      },
    ],
  },
  {
    label: "Creatives",
    slug: "creatives",
    endpoints: [
      {
        method: "POST",
        path: "/v1/creatives/generate-copy",
        description: "Generate marketing copy using AI for a product or campaign.",
        requestBody: {
          productName: "Acme Pro Plan",
          tone: "professional",
          targetAudience: "SaaS founders",
          maxLength: 280,
          language: "en",
        },
        responseExample: {
          id: "copy_001",
          text: "Scale your affiliate program effortlessly with Acme Pro — built for SaaS founders who want results, not busywork.",
          tokens: 22,
          language: "en",
        },
      },
      {
        method: "POST",
        path: "/v1/creatives/generate-image",
        description: "Generate a promotional image using AI.",
        requestBody: {
          prompt: "Modern SaaS dashboard with affiliate metrics, dark theme, minimal",
          dimensions: "1200x630",
          style: "photorealistic",
        },
        responseExample: {
          id: "img_001",
          url: "https://cdn.vibeaff.com/generated/img_001.png",
          dimensions: "1200x630",
          createdAt: "2026-02-05T10:00:00Z",
        },
      },
      {
        method: "POST",
        path: "/v1/creatives/translate",
        description: "Translate marketing copy to another language.",
        requestBody: {
          text: "Scale your affiliate program effortlessly.",
          targetLanguage: "es",
          preserveTone: true,
        },
        responseExample: {
          original: "Scale your affiliate program effortlessly.",
          translated: "Escala tu programa de afiliados sin esfuerzo.",
          targetLanguage: "es",
          confidence: 0.97,
        },
      },
    ],
  },
  {
    label: "Gamification",
    slug: "gamification",
    endpoints: [
      {
        method: "GET",
        path: "/v1/leaderboard",
        description: "Get the affiliate leaderboard rankings. Filter by ?programId and ?period (day, week, month).",
        responseExample: {
          period: "month",
          data: [
            { rank: 1, affiliateId: "aff_001", name: "BloggerMax", conversions: 142, revenue: 12480.0, commission: 1872.0 },
            { rank: 2, affiliateId: "aff_002", name: "SocialSara", conversions: 98, revenue: 8750.0, commission: 1312.5 },
            { rank: 3, affiliateId: "aff_003", name: "TechTim", conversions: 67, revenue: 5980.0, commission: 897.0 },
          ],
        },
      },
      {
        method: "GET",
        path: "/v1/affiliates/:id/stats",
        description: "Get detailed performance statistics for an affiliate.",
        responseExample: {
          affiliateId: "aff_001",
          totalClicks: 15420,
          totalConversions: 842,
          conversionRate: 5.46,
          totalRevenue: 74200.0,
          totalCommission: 11130.0,
          avgOrderValue: 88.12,
          topCampaigns: [
            { campaignId: "cmp_001", name: "Spring Sale 2026", conversions: 210, revenue: 18500.0 },
          ],
          badges: ["top_performer", "100_conversions", "streak_30d"],
        },
      },
    ],
  },
  {
    label: "Admin",
    slug: "admin",
    endpoints: [
      {
        method: "GET",
        path: "/v1/metrics",
        description: "Get platform-wide metrics and KPIs. Requires admin role.",
        responseExample: {
          totalMerchants: 124,
          totalAffiliates: 3842,
          totalConversions: 28491,
          totalRevenue: 2450000.0,
          totalCommissionsPaid: 367500.0,
          activePrograms: 89,
          activeCampaigns: 156,
          monthOverMonth: { revenue: 12.4, conversions: 8.7, affiliates: 15.2 },
        },
      },
      {
        method: "GET",
        path: "/v1/audit-logs",
        description: "Retrieve audit logs. Filter by ?userId, ?action, ?from, ?to.",
        responseExample: {
          data: [
            {
              id: "log_001",
              userId: "usr_abc123",
              action: "payout.approved",
              resourceType: "payout",
              resourceId: "pay_001",
              ip: "203.0.113.42",
              timestamp: "2026-02-05T12:00:00Z",
            },
            {
              id: "log_002",
              userId: "usr_abc123",
              action: "merchant.created",
              resourceType: "merchant",
              resourceId: "mrc_003",
              ip: "203.0.113.42",
              timestamp: "2026-02-05T11:30:00Z",
            },
          ],
          meta: { page: 1, limit: 50, total: 2 },
        },
      },
    ],
  },
];

/* ================================================================
   HELPERS
   ================================================================ */
const METHOD_COLORS: Record<Method, { bg: string; text: string; border: string }> = {
  GET: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  POST: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  PUT: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  DELETE: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

const MATRIX_BADGE = "bg-green-500/10 text-green-400 border-green-500/30";

function endpointId(group: EndpointGroup, ep: Endpoint) {
  return `${group.slug}-${ep.method}-${ep.path}`.replace(/[/:]/g, "-");
}

function allEndpointsFlat() {
  return API_GROUPS.flatMap((g) => g.endpoints.map((ep) => ({ group: g, ep })));
}

/* ================================================================
   COMPONENT
   ================================================================ */
export default function DeveloperPortal() {
  /* ── state ───────────────────────────────────────── */
  const [matrix, setMatrix] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState("");
  const [search, setSearch] = useState("");
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

  // playground
  const [pgEndpoint, setPgEndpoint] = useState("");
  const [pgBaseUrl, setPgBaseUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.vibeaff.com"
  );
  const [pgHeaders, setPgHeaders] = useState("Authorization: Bearer YOUR_TOKEN");
  const [pgBody, setPgBody] = useState("{}");
  const [pgResponse, setPgResponse] = useState<{ status: number; body: string } | null>(null);
  const [pgLoading, setPgLoading] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);

  /* ── persist matrix mode ─────────────────────────── */
  useEffect(() => {
    const saved = localStorage.getItem("vibeaff_matrix");
    if (saved !== null) setMatrix(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("vibeaff_matrix", String(matrix));
  }, [matrix]);

  /* ── intersection observer for active sidebar item ─ */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    const sections = document.querySelectorAll("[data-endpoint-section]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /* ── auto-expand section on activeId change ──────── */
  useEffect(() => {
    if (!activeId) return;
    const group = API_GROUPS.find((g) =>
      g.endpoints.some((ep) => endpointId(g, ep) === activeId)
    );
    if (group) {
      setExpandedSections((prev) => ({ ...prev, [group.slug]: true }));
    }
  }, [activeId]);

  /* ── sidebar toggle ──────────────────────────────── */
  const toggleSection = useCallback((slug: string) => {
    setExpandedSections((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }, []);

  /* ── scroll to endpoint ──────────────────────────── */
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* ── playground: send request ────────────────────── */
  const sendRequest = useCallback(async () => {
    if (!pgEndpoint) return;
    const match = allEndpointsFlat().find(
      ({ group, ep }) => `${ep.method} ${ep.path}` === pgEndpoint
    );
    if (!match) return;

    setPgLoading(true);
    setPgResponse(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      for (const line of pgHeaders.split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      }

      const url = `${pgBaseUrl}${match.ep.path}`;
      const opts: RequestInit = { method: match.ep.method, headers };
      if (match.ep.method !== "GET" && pgBody.trim()) {
        opts.body = pgBody;
      }

      const res = await fetch(url, opts);
      let body: string;
      try {
        const json = await res.json();
        body = JSON.stringify(json, null, 2);
      } catch {
        body = await res.text();
      }
      setPgResponse({ status: res.status, body });
    } catch (err) {
      setPgResponse({
        status: 0,
        body: `Network error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    } finally {
      setPgLoading(false);
    }
  }, [pgEndpoint, pgBaseUrl, pgHeaders, pgBody]);

  /* ── auto-fill body when endpoint changes ────────── */
  useEffect(() => {
    if (!pgEndpoint) return;
    const match = allEndpointsFlat().find(
      ({ group, ep }) => `${ep.method} ${ep.path}` === pgEndpoint
    );
    if (match?.ep.requestBody) {
      setPgBody(JSON.stringify(match.ep.requestBody, null, 2));
    } else {
      setPgBody("{}");
    }
  }, [pgEndpoint]);

  /* ── search filter ───────────────────────────────── */
  const lowerSearch = search.toLowerCase();
  const filteredGroups = search
    ? API_GROUPS.map((g) => ({
        ...g,
        endpoints: g.endpoints.filter(
          (ep) =>
            ep.path.toLowerCase().includes(lowerSearch) ||
            ep.description.toLowerCase().includes(lowerSearch) ||
            ep.method.toLowerCase().includes(lowerSearch) ||
            g.label.toLowerCase().includes(lowerSearch)
        ),
      })).filter((g) => g.endpoints.length > 0)
    : API_GROUPS;

  /* ── theme vars ──────────────────────────────────── */
  const t = {
    bg: matrix ? "bg-black" : "bg-zinc-950",
    text: matrix ? "text-white" : "text-zinc-100",
    muted: matrix ? "text-zinc-300" : "text-zinc-400",
    sidebarBg: matrix ? "bg-black/90" : "bg-zinc-900",
    chromeBorder: matrix ? "border-emerald-500/30" : "border-zinc-800",
    border: matrix ? "border-emerald-500/20" : "border-zinc-800",
    cardBg: matrix ? "bg-black/90" : "bg-zinc-900/50",
    codeBg: matrix ? "bg-green-950/30" : "bg-zinc-900",
    hover: matrix ? "hover:bg-green-500/10" : "hover:bg-zinc-800",
    activeSidebar: matrix ? "bg-green-500/15 text-green-300" : "bg-zinc-800 text-white",
    accent: matrix ? "text-green-400" : "text-blue-400",
    link: matrix ? "text-green-400 hover:text-green-300" : "text-blue-400 hover:text-blue-300",
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} ${matrix ? "matrix-mode" : ""}`}>
      <MatrixRain visible={matrix} />
      {matrix && <div className="fixed inset-0 bg-black/70 z-[1] pointer-events-none" />}

      {/* ── SIDEBAR ────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-[260px] ${t.sidebarBg} border-r ${t.chromeBorder} backdrop-blur-md flex flex-col overflow-hidden`}
      >
        {/* logo */}
        <div className={`px-5 py-5 border-b ${t.chromeBorder} flex-shrink-0`}>
          <h1 className="text-lg font-bold tracking-tight">VibeAff API</h1>
          <p className={`text-xs mt-0.5 ${t.muted}`}>Developer Documentation</p>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {/* Overview link */}
          <button
            onClick={() => scrollTo("overview")}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              activeId === "overview" ? t.activeSidebar : `${t.muted} ${t.hover}`
            }`}
          >
            Overview
          </button>

          {API_GROUPS.map((group) => {
            const isOpen = expandedSections[group.slug] ?? false;
            const hasActive = group.endpoints.some(
              (ep) => endpointId(group, ep) === activeId
            );

            return (
              <div key={group.slug}>
                <button
                  onClick={() => toggleSection(group.slug)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
                    hasActive && !isOpen ? t.activeSidebar : `${t.text} ${t.hover}`
                  }`}
                >
                  <span className="font-medium">{group.label}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="ml-2 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-2">
                    {group.endpoints.map((ep) => {
                      const eid = endpointId(group, ep);
                      const methodStyle = matrix
                        ? "text-green-400"
                        : METHOD_COLORS[ep.method].text;

                      return (
                        <button
                          key={eid}
                          onClick={() => scrollTo(eid)}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center gap-2 ${
                            activeId === eid ? t.activeSidebar : `${t.muted} ${t.hover}`
                          }`}
                        >
                          <span className={`font-bold text-[10px] uppercase w-9 flex-shrink-0 ${methodStyle}`}>
                            {ep.method}
                          </span>
                          <span className="truncate font-mono">{ep.path}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Playground link */}
          <button
            onClick={() => {
              setPlaygroundOpen(true);
              scrollTo("playground");
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors font-medium ${
              activeId === "playground" ? t.activeSidebar : `${t.accent} ${t.hover}`
            }`}
          >
            API Playground
          </button>
        </nav>
      </aside>

      {/* ── TOP BAR ────────────────────────────────── */}
      <header
        className={`fixed top-0 left-[260px] right-0 z-20 h-14 ${t.sidebarBg} border-b ${t.chromeBorder} backdrop-blur-md flex items-center justify-between px-6`}
      >
        {/* search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.muted}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-1.5 rounded-lg text-sm border ${t.border} ${t.cardBg} ${t.text} placeholder:text-zinc-500 focus:outline-none focus:ring-1 ${
              matrix ? "focus:ring-green-500/50" : "focus:ring-blue-500/50"
            }`}
          />
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* matrix toggle */}
          <button
            onClick={() => setMatrix(!matrix)}
            className={`relative flex items-center h-8 rounded-full px-1 w-[100px] border transition-colors ${
              matrix
                ? "bg-green-500/20 border-green-500/40"
                : "bg-zinc-800 border-zinc-700"
            }`}
            aria-label="Toggle Matrix mode"
          >
            <span
              className={`absolute text-[10px] font-bold uppercase tracking-wider ${
                matrix ? "right-3 text-green-400" : "left-3 text-zinc-400"
              }`}
            >
              {matrix ? "Matrix" : "Normal"}
            </span>
            <span
              className={`w-6 h-6 rounded-full transition-all ${
                matrix ? "translate-x-[68px] bg-green-400" : "translate-x-0 bg-zinc-400"
              }`}
            />
          </button>

          {/* link */}
          <a
            href="https://vibeaff.com"
            className={`text-sm ${t.link} transition-colors`}
            target="_blank"
            rel="noopener noreferrer"
          >
            vibeaff.com &rarr;
          </a>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <main ref={mainRef} className="ml-[260px] pt-14 relative z-10">
        <div className="max-w-4xl mx-auto px-8 py-10">
          {/* ── OVERVIEW ─────────────────────────────── */}
          <section id="overview" data-endpoint-section className="mb-16">
            <h2 className="text-3xl font-bold mb-2 text-white">
              VibeAff API Reference
            </h2>
            <p className={`text-base mb-8 ${t.muted}`}>
              Complete REST API documentation for the VibeAff affiliate marketing platform.
            </p>

            {/* base url */}
            <div className={`rounded-lg border ${t.border} ${t.cardBg} p-5 mb-6`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${t.muted}`}>
                Base URL
              </h3>
              <code className={`text-base font-mono ${matrix ? "text-green-300" : "text-blue-300"}`}>
                {process.env.NEXT_PUBLIC_API_URL ?? "https://api.vibeaff.com"}
              </code>
            </div>

            {/* auth */}
            <div className={`rounded-lg border ${t.border} ${t.cardBg} p-5 mb-6`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${t.muted}`}>
                Authentication
              </h3>
              <p className={`text-sm mb-3 ${t.muted}`}>
                All authenticated endpoints require a Bearer token in the{" "}
                <code className={`px-1.5 py-0.5 rounded text-xs ${t.codeBg} ${t.text}`}>Authorization</code> header.
              </p>
              <pre className={`rounded-md p-4 text-sm font-mono ${t.codeBg} border ${t.border} overflow-x-auto`}>
{`curl -H "Authorization: Bearer YOUR_API_TOKEN" \\
     https://api.vibeaff.com/v1/auth/me`}
              </pre>
            </div>

            {/* rate limits */}
            <div className={`rounded-lg border ${t.border} ${t.cardBg} p-5`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${t.muted}`}>
                Rate Limits
              </h3>
              <p className={`text-sm ${t.muted}`}>
                API requests are rate-limited to <strong className={t.text}>1,000 requests/minute</strong> per API key.
                Rate limit headers (<code className={`px-1.5 py-0.5 rounded text-xs ${t.codeBg} ${t.text}`}>X-RateLimit-Remaining</code>) are included in every response.
              </p>
            </div>
          </section>

          {/* ── ENDPOINT GROUPS ──────────────────────── */}
          {filteredGroups.map((group) => (
            <section key={group.slug} className="mb-14">
              <h2
                className={`text-2xl font-bold mb-6 pb-2 border-b ${t.border} text-white`}
              >
                {group.label}
              </h2>

              <div className="space-y-6">
                {group.endpoints.map((ep) => {
                  const eid = endpointId(group, ep);
                  const badge = matrix ? MATRIX_BADGE : `${METHOD_COLORS[ep.method].bg} ${METHOD_COLORS[ep.method].text} ${METHOD_COLORS[ep.method].border}`;

                  return (
                    <div
                      key={eid}
                      id={eid}
                      data-endpoint-section
                      className={`rounded-lg border ${t.border} ${t.cardBg} scroll-mt-20 transition-colors`}
                    >
                      {/* header bar */}
                      <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.border}`}>
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded border ${badge} uppercase tracking-wide`}
                        >
                          {ep.method}
                        </span>
                        <code className={`text-sm font-mono ${matrix ? "text-green-300" : "text-zinc-200"}`}>
                          {ep.path}
                        </code>
                      </div>

                      {/* body */}
                      <div className="px-5 py-4 space-y-4">
                        <p className={`text-sm leading-relaxed ${t.muted}`}>{ep.description}</p>

                        {/* request body */}
                        {ep.requestBody && (
                          <div>
                            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t.muted}`}>
                              Request Body
                            </h4>
                            <pre
                              className={`rounded-md p-4 text-xs font-mono ${t.codeBg} border ${t.border} overflow-x-auto leading-relaxed`}
                            >
                              {JSON.stringify(ep.requestBody, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* response */}
                        <div>
                          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t.muted}`}>
                            Response <span className={`${matrix ? "text-green-500/50" : "text-zinc-600"}`}>200</span>
                          </h4>
                          <pre
                            className={`rounded-md p-4 text-xs font-mono ${t.codeBg} border ${t.border} overflow-x-auto leading-relaxed`}
                          >
                            {JSON.stringify(ep.responseExample, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* ── API PLAYGROUND ────────────────────────── */}
          <section id="playground" data-endpoint-section className="mb-20 scroll-mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                API Playground
              </h2>
              <button
                onClick={() => setPlaygroundOpen(!playgroundOpen)}
                className={`text-sm px-4 py-1.5 rounded-md border transition-colors ${t.border} ${t.hover} ${t.text}`}
              >
                {playgroundOpen ? "Collapse" : "Expand"}
              </button>
            </div>

            {playgroundOpen && (
              <div className={`rounded-lg border ${t.border} ${t.cardBg} p-6 space-y-5`}>
                {/* endpoint selector */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${t.muted}`}>
                    Endpoint
                  </label>
                  <select
                    value={pgEndpoint}
                    onChange={(e) => setPgEndpoint(e.target.value)}
                    className={`w-full p-2.5 rounded-md border text-sm font-mono ${t.border} ${t.codeBg} ${t.text} focus:outline-none focus:ring-1 ${
                      matrix ? "focus:ring-green-500/50" : "focus:ring-blue-500/50"
                    }`}
                  >
                    <option value="">Select an endpoint...</option>
                    {API_GROUPS.map((g) => (
                      <optgroup key={g.slug} label={g.label}>
                        {g.endpoints.map((ep) => (
                          <option key={`${ep.method}-${ep.path}`} value={`${ep.method} ${ep.path}`}>
                            {ep.method} {ep.path}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* base url */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${t.muted}`}>
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={pgBaseUrl}
                    onChange={(e) => setPgBaseUrl(e.target.value)}
                    className={`w-full p-2.5 rounded-md border text-sm font-mono ${t.border} ${t.codeBg} ${t.text} focus:outline-none focus:ring-1 ${
                      matrix ? "focus:ring-green-500/50" : "focus:ring-blue-500/50"
                    }`}
                  />
                </div>

                {/* headers */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${t.muted}`}>
                    Headers <span className={`font-normal normal-case ${t.muted}`}>(one per line, Key: Value)</span>
                  </label>
                  <textarea
                    value={pgHeaders}
                    onChange={(e) => setPgHeaders(e.target.value)}
                    rows={3}
                    className={`w-full p-2.5 rounded-md border text-sm font-mono ${t.border} ${t.codeBg} ${t.text} focus:outline-none focus:ring-1 ${
                      matrix ? "focus:ring-green-500/50" : "focus:ring-blue-500/50"
                    } resize-y`}
                  />
                </div>

                {/* body */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${t.muted}`}>
                    Request Body <span className={`font-normal normal-case ${t.muted}`}>(JSON)</span>
                  </label>
                  <textarea
                    value={pgBody}
                    onChange={(e) => setPgBody(e.target.value)}
                    rows={10}
                    className={`w-full p-2.5 rounded-md border text-sm font-mono ${t.border} ${t.codeBg} ${t.text} focus:outline-none focus:ring-1 ${
                      matrix ? "focus:ring-green-500/50" : "focus:ring-blue-500/50"
                    } resize-y`}
                  />
                </div>

                {/* send */}
                <button
                  onClick={sendRequest}
                  disabled={!pgEndpoint || pgLoading}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    matrix
                      ? "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {pgLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Request"
                  )}
                </button>

                {/* response */}
                {pgResponse && (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <label className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}>
                        Response
                      </label>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          pgResponse.status >= 200 && pgResponse.status < 300
                            ? "bg-emerald-500/10 text-emerald-400"
                            : pgResponse.status >= 400
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {pgResponse.status || "ERR"}
                      </span>
                    </div>
                    <pre
                      className={`rounded-md p-4 text-xs font-mono ${t.codeBg} border ${t.border} overflow-auto max-h-96 leading-relaxed`}
                    >
                      {pgResponse.body}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
