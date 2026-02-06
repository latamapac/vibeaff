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

type Program = {
  id: string;
  name: string;
  merchantId: string;
  attributionWindowDays: number;
  approvalMode: string;
  merchant?: { name: string; defaultCommissionPct: number; website: string };
};

type Enrollment = {
  id: string;
  programId: string;
  status: string;
  appliedAt: string;
  program: { name: string };
};

const enrollmentBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-error",
    suspended: "badge-error",
  };
  return map[status] ?? "badge-neutral";
};

export default function AffiliateProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchData = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const [progRes, enrollRes] = await Promise.all([
        fetch(`${API_URL}/v1/programs`, { headers: authHeaders() }),
        fetch(`${API_URL}/v1/affiliates/${affiliateId}/enrollments`, { headers: authHeaders() }),
      ]);
      if (progRes.ok) setPrograms(await progRes.json());
      if (enrollRes.ok) setEnrollments(await enrollRes.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [affiliateId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const enrollmentStatus = (programId: string) => {
    return enrollments.find((e) => e.programId === programId);
  };

  const applyToProgram = async (programId: string) => {
    if (!affiliateId) return;
    setApplying(programId);
    try {
      const res = await fetch(`${API_URL}/v1/programs/${programId}/apply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ affiliateId }),
      });
      if (res.ok) await fetchData();
    } catch { /* ignore */ } finally { setApplying(null); }
  };

  return (
    <>
      <h1 className="text-xl font-semibold">Programs</h1>

      {/* My enrollments */}
      {enrollments.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="section-header mb-4">My enrollments</h2>
          <div className="space-y-2">
            {enrollments.map((e) => (
              <div key={e.id} className="table-row">
                <span className="font-medium text-[#F6F6F7]">{e.program.name}</span>
                <div className="flex items-center gap-3">
                  <span className={`badge ${enrollmentBadge(e.status)}`}>{e.status}</span>
                  <span className="text-xs text-[#8B8B9E]">{new Date(e.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All available programs */}
      <div className="glass-card p-6">
        <h2 className="section-header mb-4">Available programs</h2>
        <div className="hidden sm:grid sm:grid-cols-6 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Program</span>
          <span>Merchant</span>
          <span>Commission</span>
          <span>Window</span>
          <span>Approval</span>
          <span>Action</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : programs.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No programs available</p>
          ) : (
            programs.map((p) => {
              const enrollment = enrollmentStatus(p.id);
              return (
                <div key={p.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-6 gap-4 text-sm">
                  <span className="font-semibold text-[#F6F6F7]">{p.name}</span>
                  <span className="text-[#8B8B9E]">{p.merchant?.name ?? p.merchantId.slice(0, 8)}</span>
                  <span className="text-[#D7FF3B] font-medium">{p.merchant?.defaultCommissionPct ?? 0}%</span>
                  <span className="text-[#8B8B9E]">{p.attributionWindowDays}d</span>
                  <span className="text-[#8B8B9E] capitalize">{p.approvalMode ?? "auto"}</span>
                  <span>
                    {enrollment ? (
                      <span className={`badge ${enrollmentBadge(enrollment.status)}`}>{enrollment.status}</span>
                    ) : (
                      <button
                        onClick={() => applyToProgram(p.id)}
                        disabled={applying === p.id}
                        className="btn-primary text-xs disabled:opacity-50"
                      >
                        {applying === p.id ? "..." : "Join"}
                      </button>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
