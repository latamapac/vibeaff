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

type CommissionRule = {
  id: string;
  programId: string;
  affiliateId: string | null;
  type: string;
  value: number | null;
  tiers: unknown;
  priority: number;
  startsAt: string | null;
  expiresAt: string | null;
  program: { name: string };
  affiliate: { displayName: string } | null;
  createdAt: string;
};

type Program = { id: string; name: string };

export default function AdminCommissionsPage() {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form
  const [formProgramId, setFormProgramId] = useState("");
  const [formAffiliateId, setFormAffiliateId] = useState("");
  const [formType, setFormType] = useState("percentage");
  const [formValue, setFormValue] = useState("");
  const [formPriority, setFormPriority] = useState("10");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/commission-rules`, { headers: authHeaders() });
      if (res.ok) setRules(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/programs`, { headers: authHeaders() });
      if (res.ok) setPrograms(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRules(); fetchPrograms(); }, [fetchRules, fetchPrograms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        programId: formProgramId,
        type: formType,
        value: formValue ? parseFloat(formValue) : null,
        priority: parseInt(formPriority) || 10,
      };
      if (formAffiliateId) body.affiliateId = formAffiliateId;
      else body.affiliateId = null;

      const res = await fetch(`${API_URL}/v1/commission-rules`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreate(false);
        setFormProgramId(""); setFormAffiliateId(""); setFormType("percentage");
        setFormValue(""); setFormPriority("10");
        await fetchRules();
      }
    } catch { /* ignore */ } finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`${API_URL}/v1/commission-rules/${id}`, { method: "DELETE", headers: authHeaders() });
      await fetchRules();
    } catch { /* ignore */ } finally { setDeleting(null); }
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { percentage: "badge-success", fixed: "badge-info", tiered: "badge-warning" };
    return map[type] ?? "badge-neutral";
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Commission Rules</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
          {showCreate ? "Cancel" : "New rule"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h2 className="section-header">Create commission rule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Program</label>
              <select value={formProgramId} onChange={(e) => setFormProgramId(e.target.value)} required className="input">
                <option value="">Select program...</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Affiliate ID (optional, blank = all)</label>
              <input type="text" value={formAffiliateId} onChange={(e) => setFormAffiliateId(e.target.value)} placeholder="Leave blank for program-wide" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Type</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="input">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
                <option value="tiered">Tiered</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">
                {formType === "percentage" ? "Rate (%)" : formType === "fixed" ? "Amount ($)" : "Value (see tiers)"}
              </label>
              <input type="number" step="0.01" value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="e.g. 15" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Priority (higher = overrides)</label>
              <input type="number" value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="input" />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary text-sm w-full disabled:opacity-50">
            {creating ? "Creating..." : "Create rule"}
          </button>
        </form>
      )}

      <div className="glass-card p-6">
        <div className="hidden sm:grid sm:grid-cols-7 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Program</span>
          <span>Affiliate</span>
          <span>Type</span>
          <span>Value</span>
          <span>Priority</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : rules.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No commission rules. Merchant default rates apply.</p>
          ) : (
            rules.map((r) => (
              <div key={r.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-7 gap-4 text-sm">
                <span className="font-medium text-[#F6F6F7]">{r.program.name}</span>
                <span className="text-[#8B8B9E]">{r.affiliate?.displayName ?? "All affiliates"}</span>
                <span><span className={`badge ${typeLabel(r.type)}`}>{r.type}</span></span>
                <span className="text-[#D7FF3B] font-medium">
                  {r.type === "percentage" ? `${r.value}%` : r.type === "fixed" ? `$${r.value}` : "tiered"}
                </span>
                <span className="text-[#8B8B9E]">{r.priority}</span>
                <span className="text-[#8B8B9E]">{new Date(r.createdAt).toLocaleDateString()}</span>
                <span>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="btn-danger text-xs disabled:opacity-50"
                  >
                    {deleting === r.id ? "..." : "Delete"}
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
