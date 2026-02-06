"use client";

import { useEffect, useMemo, useState } from "react";

const tierBadge: Record<string, string> = {
  diamond: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  platinum: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
  gold: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
  silver: "bg-white/[0.06] text-[#F6F6F7]/70 border border-white/[0.1]",
  bronze: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
};

type LeaderboardEntry = {
  rank: number;
  affiliateId: string;
  displayName: string;
  totalEarnings: number;
  totalConversions: number;
  tier: string;
  badges: string[];
};

export default function LeaderboardPage() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("vibeaff_token");
    fetch(`${apiUrl}/v1/leaderboard`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  return (
    <section className="glass-card p-6">
      <h1 className="section-header text-lg">Affiliate leaderboard</h1>
      <p className="mt-3 text-sm text-[#8B8B9E]">
        Top affiliates ranked by total earnings.
      </p>
      <div className="mt-6 space-y-2 text-sm">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        )}
        {!loading && entries.length === 0 && (
          <p className="text-[#8B8B9E] text-center py-8">No affiliate data yet.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.affiliateId} className="table-row">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D7FF3B]/10 text-sm font-semibold text-[#D7FF3B]">
                {entry.rank}
              </div>
              <div>
                <div className="text-[#F6F6F7] font-medium">{entry.displayName}</div>
                <div className="text-xs text-[#8B8B9E]">
                  {entry.totalConversions} conversions &middot; ${entry.totalEarnings.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${tierBadge[entry.tier] ?? "badge-neutral"}`}>
                {entry.tier}
              </span>
              {entry.badges.map((badge) => (
                <span key={badge} className="badge badge-neutral">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
