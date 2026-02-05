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

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
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
    await load();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-lg font-semibold">Payout queue</h1>
      <p className="mt-3 text-sm text-zinc-400">
        Hold, approve, release, or reject affiliate payouts.
      </p>
      {loading && <p className="mt-4 text-sm text-zinc-400">Loading...</p>}
      <div className="mt-6 space-y-3 text-sm">
        {payouts.length === 0 && !loading && (
          <p className="text-zinc-400">No payouts yet.</p>
        )}
        {payouts.map((p) => (
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
                <button className="rounded-full bg-white px-3 py-1 text-black" onClick={() => action(p.id, "approve")}>
                  Approve
                </button>
              )}
              {p.status === "approved" && (
                <button className="rounded-full bg-emerald-500 px-3 py-1 text-black" onClick={() => action(p.id, "release")}>
                  Release
                </button>
              )}
              {(p.status === "on_hold" || p.status === "approved") && (
                <button className="rounded-full border border-white/20 px-3 py-1 text-white" onClick={() => action(p.id, "reject")}>
                  Reject
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
