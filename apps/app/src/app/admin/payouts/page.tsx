"use client";

import { useEffect, useMemo, useState } from "react";

type Payout = {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: string;
  holdUntil: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  on_hold: "text-yellow-300 bg-yellow-500/20",
  approved: "text-sky-300 bg-sky-500/20",
  released: "text-emerald-300 bg-emerald-500/20",
  rejected: "text-red-300 bg-red-500/20",
};

const filterTabs = [
  { label: "All", value: "all" },
  { label: "On Hold", value: "on_hold" },
  { label: "Approved", value: "approved" },
  { label: "Released", value: "released" },
  { label: "Rejected", value: "rejected" },
];

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState<{ id: string; verb: string; label: string } | null>(null);
  const apiUrl = useMemo(() => getApiUrl(), []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/v1/payouts`);
      if (res.ok) setPayouts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const action = async (id: string, verb: string) => {
    await fetch(`${apiUrl}/v1/payouts/${id}/${verb}`, { method: "POST" });
    setConfirmAction(null);
    await load();
  };

  const filteredPayouts = statusFilter === "all"
    ? payouts
    : payouts.filter((p) => p.status === statusFilter);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-lg font-semibold">Payout queue</h1>
      <p className="mt-3 text-sm text-zinc-400">
        Hold, approve, release, or reject affiliate payouts.
      </p>

      {/* Status filter tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-white text-black"
                : "border border-white/20 text-zinc-400 hover:text-white hover:border-white/40"
            }`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-4 text-sm text-zinc-400">Loading...</p>}
      <div className="mt-6 space-y-3 text-sm">
        {filteredPayouts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <svg
              className="mb-4 h-12 w-12 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
              />
            </svg>
            <p className="text-base font-medium">No payouts match the current filter</p>
            <p className="mt-1 text-sm text-zinc-500">Try selecting a different status tab above.</p>
          </div>
        )}
        {filteredPayouts.map((p) => (
          <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-white">
                {p.affiliateId.slice(0, 12)}... &middot; {p.currency} {p.amount.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-400">
                {p.holdUntil ? `Hold until ${new Date(p.holdUntil).toLocaleDateString()}` : "No hold"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs ${statusColors[p.status] ?? "text-zinc-300 bg-white/10"}`}>
                {p.status}
              </span>
              {p.status === "on_hold" && (
                <button
                  className="rounded-full bg-white px-3 py-1 text-black"
                  onClick={() => setConfirmAction({ id: p.id, verb: "approve", label: "approve" })}
                >
                  Approve
                </button>
              )}
              {p.status === "approved" && (
                <button
                  className="rounded-full bg-emerald-500 px-3 py-1 text-black"
                  onClick={() => setConfirmAction({ id: p.id, verb: "release", label: "release" })}
                >
                  Release
                </button>
              )}
              {(p.status === "on_hold" || p.status === "approved") && (
                <button
                  className="rounded-full border border-white/20 px-3 py-1 text-white"
                  onClick={() => setConfirmAction({ id: p.id, verb: "reject", label: "reject" })}
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Confirm action</h2>
            <p className="mt-3 text-sm text-zinc-300">
              Are you sure you want to <span className="font-medium text-white">{confirmAction.label}</span> this payout?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-full border border-white/20 px-5 py-2 text-sm text-zinc-400 hover:text-white"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-zinc-200"
                onClick={() => action(confirmAction.id, confirmAction.verb)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
