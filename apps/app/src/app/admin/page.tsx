"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Metrics = {
  merchants: number;
  affiliates: number;
  programs: number;
  campaigns: number;
  conversions: number;
  payouts: number;
  channels: number;
  creativeTools: number;
};

type Payout = {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
};

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ip: string;
  timestamp: string;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vibeaff_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ── Loading skeleton ─────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-zinc-800 ${className}`} />
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ── Fetch helpers ─────────────────────────── */
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const res = await fetch(`${API_URL}/v1/metrics`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMetrics(await res.json());
    } catch (err) {
      setMetricsError((err as Error).message);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    setPayoutsError(null);
    try {
      const res = await fetch(`${API_URL}/v1/payouts`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPayouts(data.data ?? data);
    } catch (err) {
      setPayoutsError((err as Error).message);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch(`${API_URL}/v1/audit-logs?limit=5`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAuditLogs(data.data ?? data);
    } catch (err) {
      setAuditError((err as Error).message);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  /* ── Initial fetch + auto-refresh every 30s ── */
  useEffect(() => {
    fetchMetrics();
    fetchPayouts();
    fetchAuditLogs();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchPayouts();
      fetchAuditLogs();
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchMetrics, fetchPayouts, fetchAuditLogs]);

  /* ── Payout actions ─────────────────────────── */
  const payoutAction = async (id: string, action: "approve" | "hold" | "release") => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`${API_URL}/v1/payouts/${id}/${action}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(
          action === "hold"
            ? { reason: "Admin hold" }
            : { note: `${action.charAt(0).toUpperCase() + action.slice(1)}d by admin` }
        ),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchPayouts();
    } catch {
      // Action failed — payout list stays stale until next refresh
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Stat cards ─────────────────────────────── */
  const statCards = [
    { label: "Merchants", value: metrics?.merchants },
    { label: "Affiliates", value: metrics?.affiliates },
    { label: "Programs", value: metrics?.programs },
    { label: "Campaigns", value: metrics?.campaigns },
    { label: "Conversions", value: metrics?.conversions },
    { label: "Payouts", value: metrics?.payouts },
    { label: "Channels", value: metrics?.channels },
    { label: "Creative tools", value: metrics?.creativeTools },
  ];

  return (
    <>
      {/* ── Stat cards ───────────────────────────── */}
      <section className="grid gap-6 md:grid-cols-4">
        {metricsLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))
          : metricsError
            ? (
              <div className="md:col-span-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                <p className="text-sm text-red-400 mb-3">Failed to load metrics: {metricsError}</p>
                <button
                  onClick={fetchMetrics}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                >
                  Retry
                </button>
              </div>
            )
            : statCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm text-zinc-400">{card.label}</div>
                  <div className="mt-3 text-2xl font-semibold">{card.value ?? "—"}</div>
                </div>
              ))}
      </section>

      {/* ── Payout queue + Alerts ────────────────── */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* Payout queue */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payout queue</h2>
            <button
              onClick={fetchPayouts}
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10 transition"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            {payoutsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : payoutsError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load payouts: {payoutsError}</p>
                <button
                  onClick={fetchPayouts}
                  className="text-sm text-white underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : payouts.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No payouts in queue</p>
            ) : (
              payouts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <span>
                    {p.affiliateId} &bull; ${p.amount.toLocaleString()} &bull;{" "}
                    <span
                      className={
                        p.status === "pending"
                          ? "text-yellow-400"
                          : p.status === "approved"
                            ? "text-green-400"
                            : p.status === "held"
                              ? "text-orange-400"
                              : p.status === "rejected"
                                ? "text-red-400"
                                : "text-zinc-400"
                      }
                    >
                      {p.status}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {(p.status === "pending" || p.status === "held") && (
                      <button
                        onClick={() => payoutAction(p.id, "approve")}
                        disabled={actionLoading === `${p.id}-approve`}
                        className="rounded-full bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50"
                      >
                        {actionLoading === `${p.id}-approve` ? "..." : "Approve"}
                      </button>
                    )}
                    {p.status === "pending" && (
                      <button
                        onClick={() => payoutAction(p.id, "hold")}
                        disabled={actionLoading === `${p.id}-hold`}
                        className="rounded-full border border-white/20 px-3 py-1 text-white text-xs disabled:opacity-50"
                      >
                        {actionLoading === `${p.id}-hold` ? "..." : "Hold"}
                      </button>
                    )}
                    {p.status === "held" && (
                      <button
                        onClick={() => payoutAction(p.id, "release")}
                        disabled={actionLoading === `${p.id}-release`}
                        className="rounded-full bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50"
                      >
                        {actionLoading === `${p.id}-release` ? "..." : "Release"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts / Audit logs */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {auditLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : auditError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load logs: {auditError}</p>
                <button
                  onClick={fetchAuditLogs}
                  className="text-sm text-white underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No recent alerts</p>
            ) : (
              auditLogs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <span className="font-medium text-white">{log.action}</span>{" "}
                  on {log.resourceType} {log.resourceId}
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(log.timestamp).toLocaleString()} &bull; {log.ip}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* ── Integrations + Compliance ────────────── */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Google Analytics</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Ads Library</span>
              <span className="text-green-400">Syncing</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Crypto payouts</span>
              <span className="text-yellow-400">Pending KYC</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Compliance checklist</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Affiliate KYC review</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Payout holds enforced</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Audit logs retention</span>
              <span className="text-yellow-400">30 days</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
