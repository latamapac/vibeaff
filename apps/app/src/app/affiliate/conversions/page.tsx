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

type Conversion = {
  id: string;
  programId: string;
  orderId: string;
  orderTotal: number;
  commissionPct: number;
  commissionAmount: number;
  currency: string;
  status: string;
  createdAt: string;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending_verification: "badge-warning",
    flagged: "badge-error",
    approved: "badge-success",
    rejected: "badge-error",
  };
  return map[status] ?? "badge-neutral";
};

export default function AffiliateConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchConversions = useCallback(async (reset = false) => {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (!reset && cursor) params.set("cursor", cursor);
      const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}/conversions?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        if (reset) {
          setConversions(items);
        } else {
          setConversions((prev) => [...prev, ...items]);
        }
        setHasMore(items.length === 20);
        if (items.length > 0) setCursor(items[items.length - 1].id);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [affiliateId, cursor]);

  useEffect(() => { fetchConversions(true); }, [affiliateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCommission = conversions.reduce((sum, c) => sum + c.commissionAmount, 0);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conversions</h1>
        <div className="text-sm text-[#8B8B9E]">
          Total commission: <span className="text-[#D7FF3B] font-semibold">${totalCommission.toFixed(2)}</span>
        </div>
      </div>

      <div className="glass-card p-6">
        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-6 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Order ID</span>
          <span>Order total</span>
          <span>Commission %</span>
          <span>Commission</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        <div className="space-y-2 mt-2">
          {loading && conversions.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : conversions.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No conversions yet</p>
          ) : (
            conversions.map((c) => (
              <div key={c.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-6 gap-4 text-sm">
                <span className="font-mono text-[#F6F6F7]">{c.orderId}</span>
                <span>${c.orderTotal.toLocaleString()}</span>
                <span className="text-[#8B8B9E]">{c.commissionPct}%</span>
                <span className="text-[#D7FF3B] font-medium">${c.commissionAmount.toFixed(2)}</span>
                <span><span className={`badge ${statusBadge(c.status)}`}>{c.status.replace(/_/g, " ")}</span></span>
                <span className="text-[#8B8B9E]">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        {hasMore && (
          <div className="mt-4 text-center">
            <button onClick={() => fetchConversions(false)} disabled={loading} className="btn-secondary text-sm disabled:opacity-50">
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
