"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vibeaff_token");
}
function authHeaders(): Record<string, string> {
  const token = getToken();
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

type Payout = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  holdUntil: string | null;
  createdAt: string;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    on_hold: "badge-warning",
    approved: "badge-info",
    released: "badge-success",
    rejected: "badge-error",
  };
  return map[status] ?? "badge-neutral";
};

export default function AffiliatePayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchPayouts = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}/payouts`, { headers: authHeaders() });
      if (res.ok) setPayouts(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [affiliateId]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const totalReleased = payouts.filter((p) => p.status === "released").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payouts.filter((p) => p.status === "on_hold" || p.status === "approved").reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <h1 className="text-xl font-semibold">Payouts</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <span className="text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">Total released</span>
          <div className="text-2xl font-semibold text-[#D7FF3B] mt-2">${totalReleased.toFixed(2)}</div>
        </div>
        <div className="glass-card p-5">
          <span className="text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">Pending / On hold</span>
          <div className="text-2xl font-semibold text-[#fcd34d] mt-2">${totalPending.toFixed(2)}</div>
        </div>
        <div className="glass-card p-5">
          <span className="text-xs font-medium text-[#8B8B9E] uppercase tracking-wider">Total payouts</span>
          <div className="text-2xl font-semibold mt-2">{payouts.length}</div>
        </div>
      </div>

      {/* Payout list */}
      <div className="glass-card p-6">
        <div className="hidden sm:grid sm:grid-cols-5 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Amount</span>
          <span>Currency</span>
          <span>Status</span>
          <span>Hold until</span>
          <span>Date</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : payouts.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No payouts yet</p>
          ) : (
            payouts.map((p) => (
              <div key={p.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-5 gap-4 text-sm">
                <span className="font-semibold text-[#F6F6F7]">${p.amount.toFixed(2)}</span>
                <span className="text-[#8B8B9E]">{p.currency}</span>
                <span><span className={`badge ${statusBadge(p.status)}`}>{p.status.replace(/_/g, " ")}</span></span>
                <span className="text-[#8B8B9E]">{p.holdUntil ? new Date(p.holdUntil).toLocaleDateString() : "—"}</span>
                <span className="text-[#8B8B9E]">{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
