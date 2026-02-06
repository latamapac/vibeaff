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

type Enrollment = {
  id: string;
  programId: string;
  affiliateId: string;
  status: string;
  note: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  affiliate: { displayName: string };
  program: { name: string; merchantId: string };
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-error",
    suspended: "badge-error",
  };
  return map[status] ?? "badge-neutral";
};

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : "";
      const res = await fetch(`${API_URL}/v1/enrollments${params}`, { headers: authHeaders() });
      if (res.ok) setEnrollments(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const handleAction = async (id: string, action: "approve" | "reject" | "suspend") => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`${API_URL}/v1/enrollments/${id}/${action}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) await fetchEnrollments();
    } catch { /* ignore */ } finally { setActionLoading(null); }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Enrollment Review</h1>
        <div className="flex gap-2">
          {["pending", "approved", "rejected", ""].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filter === f ? "bg-[#D7FF3B]/15 text-[#D7FF3B] border border-[#D7FF3B]/30" : "btn-secondary"
              }`}
            >
              {f || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="hidden sm:grid sm:grid-cols-6 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Affiliate</span>
          <span>Program</span>
          <span>Status</span>
          <span>Note</span>
          <span>Applied</span>
          <span>Actions</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : enrollments.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No enrollments found</p>
          ) : (
            enrollments.map((e) => (
              <div key={e.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-6 gap-4 text-sm">
                <span className="font-medium text-[#F6F6F7]">{e.affiliate.displayName}</span>
                <span className="text-[#8B8B9E]">{e.program.name}</span>
                <span><span className={`badge ${statusBadge(e.status)}`}>{e.status}</span></span>
                <span className="text-[#8B8B9E] truncate">{e.note ?? "—"}</span>
                <span className="text-[#8B8B9E]">{new Date(e.appliedAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1.5">
                  {e.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAction(e.id, "approve")}
                        disabled={actionLoading === `${e.id}-approve`}
                        className="btn-primary text-xs disabled:opacity-50"
                      >
                        {actionLoading === `${e.id}-approve` ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(e.id, "reject")}
                        disabled={actionLoading === `${e.id}-reject`}
                        className="btn-danger text-xs disabled:opacity-50"
                      >
                        {actionLoading === `${e.id}-reject` ? "..." : "Reject"}
                      </button>
                    </>
                  )}
                  {e.status === "approved" && (
                    <button
                      onClick={() => handleAction(e.id, "suspend")}
                      disabled={actionLoading === `${e.id}-suspend`}
                      className="btn-danger text-xs disabled:opacity-50"
                    >
                      {actionLoading === `${e.id}-suspend` ? "..." : "Suspend"}
                    </button>
                  )}
                  {e.status === "rejected" && (
                    <button
                      onClick={() => handleAction(e.id, "approve")}
                      disabled={actionLoading === `${e.id}-approve`}
                      className="btn-primary text-xs disabled:opacity-50"
                    >
                      {actionLoading === `${e.id}-approve` ? "..." : "Approve"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
