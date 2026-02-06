"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

type DashboardStats = {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  tier: string;
  streak: number;
  badges: string[];
  conversionRate: number;
  pendingPayouts: number;
  pendingAmount: number;
};

type RecentConversion = {
  id: string;
  orderId: string;
  orderTotal: number;
  commissionAmount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type RecentPayout = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

const tierColors: Record<string, string> = {
  bronze: "from-orange-700 to-orange-500",
  silver: "from-zinc-400 to-zinc-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-400 to-blue-300",
  diamond: "from-purple-400 to-pink-300",
};

export default function AffiliateDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [conversions, setConversions] = useState<RecentConversion[]>([]);
  const [payouts, setPayouts] = useState<RecentPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchDashboard = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, convRes, payRes] = await Promise.all([
        fetch(`${API_URL}/v1/affiliates/${affiliateId}/dashboard`, { headers: authHeaders() }),
        fetch(`${API_URL}/v1/affiliates/${affiliateId}/conversions?limit=5`, { headers: authHeaders() }),
        fetch(`${API_URL}/v1/affiliates/${affiliateId}/payouts?limit=5`, { headers: authHeaders() }),
      ]);
      if (!statsRes.ok) throw new Error(`Failed to load dashboard (${statsRes.status})`);
      setStats(await statsRes.json());
      if (convRes.ok) setConversions(await convRes.json());
      if (payRes.ok) setPayouts(await payRes.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (!affiliateId) {
    return (
      <div className="glass-card p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Welcome to VibeAff</h2>
        <p className="text-[#8B8B9E] text-sm mb-4">
          Log in or register as an affiliate to access your dashboard.
        </p>
        <a href="/login" className="btn-primary inline-block">Get started</a>
      </div>
    );
  }

  const tierGradient = tierColors[stats?.tier?.toLowerCase() ?? "bronze"] ?? tierColors.bronze;

  const statCards = [
    { label: "Total Earnings", value: stats ? `$${stats.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : null, icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Total Clicks", value: stats?.totalClicks?.toLocaleString() ?? null, icon: "M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" },
    { label: "Conversions", value: stats?.totalConversions?.toLocaleString() ?? null, icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
    { label: "Conv. Rate", value: stats ? `${stats.conversionRate.toFixed(1)}%` : null, icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
    { label: "Pending Payouts", value: stats?.pendingPayouts?.toString() ?? null, icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Pending Amount", value: stats ? `$${stats.pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : null, icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending_verification: "badge-warning",
      flagged: "badge-error",
      approved: "badge-success",
      on_hold: "badge-warning",
      released: "badge-success",
      rejected: "badge-error",
    };
    return map[status] ?? "badge-neutral";
  };

  return (
    <>
      {/* Tier + streak header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Affiliate Dashboard</h1>
            {stats && (
              <span className={`rounded-full bg-gradient-to-r ${tierGradient} px-3 py-1 text-xs font-bold uppercase text-white`}>
                {stats.tier}
              </span>
            )}
          </div>
          {stats && stats.streak > 0 && (
            <div className="flex items-center gap-2 text-sm text-[#8B8B9E]">
              <svg className="w-4 h-4 text-[#D7FF3B]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.356.067c-.206-.178-.509-.178-.714 0C8.796 2.48 4.5 7.824 4.5 12.5c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5c0-4.676-4.296-10.02-7.144-12.433z" />
              </svg>
              {stats.streak}-day streak
            </div>
          )}
        </div>
        {stats && stats.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {stats.badges.map((badge) => (
              <span key={badge} className="badge badge-info">{badge.replace(/_/g, " ")}</span>
            ))}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))
          : error
            ? (
              <div className="sm:col-span-2 lg:col-span-3 glass-card border-red-500/20 p-6 text-center">
                <p className="text-sm text-red-400 mb-3">Failed to load: {error}</p>
                <button onClick={fetchDashboard} className="btn-secondary text-sm">Retry</button>
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

      {/* Recent conversions + payouts */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Recent conversions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Recent conversions</h2>
            <a href="/affiliate/conversions" className="text-xs text-[#D7FF3B] hover:underline">View all</a>
          </div>
          <div className="space-y-2 text-sm">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : conversions.length === 0 ? (
              <p className="text-[#8B8B9E] text-center py-4">No conversions yet</p>
            ) : (
              conversions.map((c) => (
                <div key={c.id} className="table-row">
                  <div>
                    <span className="text-[#F6F6F7] font-medium">{c.orderId}</span>
                    <span className="text-[#8B8B9E] ml-2">${c.orderTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#D7FF3B] font-medium">${c.commissionAmount.toFixed(2)}</span>
                    <span className={`badge ${statusBadge(c.status)}`}>{c.status.replace(/_/g, " ")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent payouts */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Recent payouts</h2>
            <a href="/affiliate/payouts" className="text-xs text-[#D7FF3B] hover:underline">View all</a>
          </div>
          <div className="space-y-2 text-sm">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : payouts.length === 0 ? (
              <p className="text-[#8B8B9E] text-center py-4">No payouts yet</p>
            ) : (
              payouts.map((p) => (
                <div key={p.id} className="table-row">
                  <div>
                    <span className="text-[#F6F6F7] font-medium">${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    <span className="text-[#8B8B9E] ml-2">{p.currency}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${statusBadge(p.status)}`}>{p.status.replace(/_/g, " ")}</span>
                    <span className="text-xs text-[#8B8B9E]">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
