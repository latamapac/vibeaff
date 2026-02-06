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

type PromoCode = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  currentUses: number;
  maxUses: number | null;
  status: string;
  expiresAt: string | null;
  program: { name: string };
  createdAt: string;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = { active: "badge-success", paused: "badge-warning", expired: "badge-error", exhausted: "badge-error" };
  return map[status] ?? "badge-neutral";
};

export default function AffiliatePromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchCodes = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}/promo-codes`, { headers: authHeaders() });
      if (res.ok) setCodes(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [affiliateId]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <h1 className="text-xl font-semibold">My Promo Codes</h1>

      <div className="glass-card p-6">
        <div className="hidden sm:grid sm:grid-cols-6 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Code</span>
          <span>Program</span>
          <span>Discount</span>
          <span>Uses</span>
          <span>Status</span>
          <span>Expires</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : codes.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No promo codes assigned to you yet</p>
          ) : (
            codes.map((c) => (
              <div key={c.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-6 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[#D7FF3B]">{c.code}</code>
                  <button onClick={() => copyCode(c.code)} className="text-[#8B8B9E] hover:text-[#F6F6F7]" title="Copy">
                    {copied === c.code ? (
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    )}
                  </button>
                </div>
                <span className="text-[#8B8B9E]">{c.program.name}</span>
                <span className="font-medium">{c.discountType === "percentage" ? `${c.discountValue}%` : `$${c.discountValue}`}</span>
                <span className="text-[#8B8B9E]">{c.currentUses}{c.maxUses ? `/${c.maxUses}` : ""}</span>
                <span><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></span>
                <span className="text-[#8B8B9E]">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
