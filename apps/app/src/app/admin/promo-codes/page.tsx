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
  programId: string;
  affiliateId: string | null;
  discountType: string;
  discountValue: number;
  currentUses: number;
  maxUses: number | null;
  status: string;
  expiresAt: string | null;
  program: { name: string };
  affiliate: { displayName: string } | null;
  createdAt: string;
};

type Program = { id: string; name: string };

const statusBadge = (status: string) => {
  const map: Record<string, string> = { active: "badge-success", paused: "badge-warning", expired: "badge-error", exhausted: "badge-error" };
  return map[status] ?? "badge-neutral";
};

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formCode, setFormCode] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formDiscountType, setFormDiscountType] = useState("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/promo-codes`, { headers: authHeaders() });
      if (res.ok) setCodes(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/programs`, { headers: authHeaders() });
      if (res.ok) setPrograms(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCodes(); fetchPrograms(); }, [fetchCodes, fetchPrograms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        code: formCode.toUpperCase(),
        programId: formProgramId,
        discountType: formDiscountType,
        discountValue: parseFloat(formDiscountValue),
      };
      if (formMaxUses) body.maxUses = parseInt(formMaxUses);

      const res = await fetch(`${API_URL}/v1/promo-codes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreate(false);
        setFormCode(""); setFormProgramId(""); setFormDiscountValue(""); setFormMaxUses("");
        await fetchCodes();
      }
    } catch { /* ignore */ } finally { setCreating(false); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await fetch(`${API_URL}/v1/promo-codes/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchCodes();
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Promo Codes</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
          {showCreate ? "Cancel" : "Create code"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h2 className="section-header">New promo code</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Code</label>
              <input type="text" required value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="SPRING2026" className="input font-mono uppercase" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Program</label>
              <select value={formProgramId} onChange={(e) => setFormProgramId(e.target.value)} required className="input">
                <option value="">Select program...</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Discount type</label>
              <select value={formDiscountType} onChange={(e) => setFormDiscountType(e.target.value)} className="input">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Discount value</label>
              <input type="number" step="0.01" required value={formDiscountValue} onChange={(e) => setFormDiscountValue(e.target.value)} placeholder="e.g. 20" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Max uses (optional)</label>
              <input type="number" value={formMaxUses} onChange={(e) => setFormMaxUses(e.target.value)} placeholder="Unlimited" className="input" />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary text-sm w-full disabled:opacity-50">
            {creating ? "Creating..." : "Create promo code"}
          </button>
        </form>
      )}

      <div className="glass-card p-6">
        <div className="hidden sm:grid sm:grid-cols-7 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Code</span>
          <span>Program</span>
          <span>Discount</span>
          <span>Uses</span>
          <span>Affiliate</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : codes.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No promo codes yet</p>
          ) : (
            codes.map((c) => (
              <div key={c.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-7 gap-4 text-sm">
                <code className="font-mono text-[#D7FF3B]">{c.code}</code>
                <span className="text-[#8B8B9E]">{c.program.name}</span>
                <span className="font-medium">
                  {c.discountType === "percentage" ? `${c.discountValue}%` : `$${c.discountValue}`}
                </span>
                <span className="text-[#8B8B9E]">{c.currentUses}{c.maxUses ? `/${c.maxUses}` : ""}</span>
                <span className="text-[#8B8B9E]">{c.affiliate?.displayName ?? "—"}</span>
                <span><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></span>
                <span>
                  <button onClick={() => toggleStatus(c.id, c.status)} className="btn-secondary text-xs">
                    {c.status === "active" ? "Pause" : "Activate"}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
