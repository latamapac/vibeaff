import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import merchantsRoutes from "./routes/merchants.routes";
import affiliatesRoutes from "./routes/affiliates.routes";
import trackingRoutes from "./routes/tracking.routes";
import conversionsRoutes from "./routes/conversions.routes";
import payoutsRoutes from "./routes/payouts.routes";
import enrollmentsRoutes from "./routes/enrollments.routes";
import commissionsRoutes from "./routes/commissions.routes";
import promoCodesRoutes from "./routes/promoCodes.routes";
import webhooksRoutes from "./routes/webhooks.routes";
import apikeysRoutes from "./routes/apikeys.routes";
import analyticsRoutes from "./routes/analytics.routes";
import marketplaceRoutes from "./routes/marketplace.routes";
import attributionRoutes from "./routes/attribution.routes";
import recurringRoutes from "./routes/recurring.routes";
import socialproofRoutes from "./routes/socialproof.routes";
import notificationsRoutes from "./routes/notifications.routes";
import exportsRoutes from "./routes/exports.routes";
import referralsRoutes from "./routes/referrals.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// --- Security headers ---
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Health / root (public) ---

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "VibeAff API",
    version: "1.0.0",
    status: "ok",
    docs: "/v1",
  });
});

// --- Route modules ---
app.use(authRoutes);
app.use(merchantsRoutes);
app.use(affiliatesRoutes);
app.use(trackingRoutes);
app.use(conversionsRoutes);
app.use(payoutsRoutes);
app.use(enrollmentsRoutes);
app.use(commissionsRoutes);
app.use(promoCodesRoutes);
app.use(webhooksRoutes);
app.use(apikeysRoutes);
app.use(analyticsRoutes);
app.use(marketplaceRoutes);
app.use(attributionRoutes);
app.use(recurringRoutes);
app.use(socialproofRoutes);
app.use(notificationsRoutes);
app.use(exportsRoutes);
app.use(referralsRoutes);
app.use(adminRoutes);

// --- Error handler (does not leak internal details) ---
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
