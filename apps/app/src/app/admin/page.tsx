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
  return <div className={`skeleton ${className}`} />;
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
    { label: "Merchants", value: metrics?.merchants, icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0020.25 9.35m-16.5 0c0-.713.248-1.37.661-1.886l1.589-2.024A2.25 2.25 0 017.787 4.5h8.426a2.25 2.25 0 011.787.896l1.589 2.024c.413.515.661 1.173.661 1.886" },
    { label: "Affiliates", value: metrics?.affiliates, icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
    { label: "Programs", value: metrics?.programs, icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
    { label: "Campaigns", value: metrics?.campaigns, icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" },
    { label: "Conversions", value: metrics?.conversions, icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
    { label: "Payouts", value: metrics?.payouts, icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" },
    { label: "Channels", value: metrics?.channels, icon: "M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" },
    { label: "Creative tools", value: metrics?.creativeTools, icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" },
  ];

  return (
    <>
      {/* ── Stat cards ───────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricsLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))
          : metricsError
            ? (
              <div className="sm:col-span-2 lg:col-span-4 glass-card border-red-500/20 p-6 text-center">
                <p className="text-sm text-red-400 mb-3">Failed to load metrics: {metricsError}</p>
                <button onClick={fetchMetrics} className="btn-secondary text-sm">
                  Retry
                </button>
              </div>
            )
            : statCards.map((card) => (
                <div key={card.label} className="glass-card p-5 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D7FF3B]/10 flex items-center justify-center group-hover:bg-[#D7FF3B]/20 transition-colors">
                      <svg className="w-4 h-4 text-[#D7FF3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">{card.label}</span>
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">{card.value ?? "—"}</div>
                </div>
              ))}
      </section>

      {/* ── Payout queue + Alerts ────────────────── */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Payout queue */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-header">Payout queue</h2>
            <button onClick={fetchPayouts} className="btn-secondary text-xs">
              Refresh
            </button>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {payoutsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : payoutsError ? (
              <div className="glass-card border-red-500/20 p-4 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load payouts: {payoutsError}</p>
                <button onClick={fetchPayouts} className="text-sm text-[#D7FF3B] hover:underline">
                  Retry
                </button>
              </div>
            ) : payouts.length === 0 ? (
              <p className="text-[#8B8B9E] text-center py-4">No payouts in queue</p>
            ) : (
              payouts.map((p) => (
                <div key={p.id} className="table-row">
                  <span className="text-[#F6F6F7]">
                    {p.affiliateId} &bull; ${p.amount.toLocaleString()} &bull;{" "}
                    <span
                      className={
                        p.status === "pending"
                          ? "text-[#fcd34d]"
                          : p.status === "approved"
                            ? "text-[#6ee7b7]"
                            : p.status === "held"
                              ? "text-[#fdba74]"
                              : p.status === "rejected"
                                ? "text-[#fca5a5]"
                                : "text-[#8B8B9E]"
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
                        className="btn-primary text-xs disabled:opacity-50"
                      >
                        {actionLoading === `${p.id}-approve` ? "..." : "Approve"}
                      </button>
                    )}
                    {p.status === "pending" && (
                      <button
                        onClick={() => payoutAction(p.id, "hold")}
                        disabled={actionLoading === `${p.id}-hold`}
                        className="btn-secondary text-xs disabled:opacity-50"
                      >
                        {actionLoading === `${p.id}-hold` ? "..." : "Hold"}
                      </button>
                    )}
                    {p.status === "held" && (
                      <button
                        onClick={() => payoutAction(p.id, "release")}
                        disabled={actionLoading === `${p.id}-release`}
                        className="btn-primary text-xs disabled:opacity-50"
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
        <div className="glass-card p-6">
          <h2 className="section-header">Alerts</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {auditLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : auditError ? (
              <div className="glass-card border-red-500/20 p-4 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load logs: {auditError}</p>
                <button onClick={fetchAuditLogs} className="text-sm text-[#D7FF3B] hover:underline">
                  Retry
                </button>
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-[#8B8B9E] text-center py-4">No recent alerts</p>
            ) : (
              auditLogs.map((log) => (
                <li key={log.id} className="table-row flex-col !items-start gap-1">
                  <span className="font-medium text-[#F6F6F7]">{log.action}</span>{" "}
                  <span className="text-[#8B8B9E]">on {log.resourceType} {log.resourceId}</span>
                  <div className="text-xs text-[#8B8B9E]/60 mt-1">
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
        <div className="glass-card p-6">
          <h2 className="section-header">Integrations</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="table-row">
              <span>Google Analytics</span>
              <span className="badge badge-success">Connected</span>
            </div>
            <div className="table-row">
              <span>Ads Library</span>
              <span className="badge badge-success">Syncing</span>
            </div>
            <div className="table-row">
              <span>Crypto payouts</span>
              <span className="badge badge-warning">Pending KYC</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="section-header">Compliance checklist</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="table-row">
              <span>Affiliate KYC review</span>
              <span className="badge badge-success">OK</span>
            </div>
            <div className="table-row">
              <span>Payout holds enforced</span>
              <span className="badge badge-success">OK</span>
            </div>
            <div className="table-row">
              <span>Audit logs retention</span>
              <span className="badge badge-warning">30 days</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
