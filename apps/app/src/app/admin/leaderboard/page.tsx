const tierColors: Record<string, string> = {
  diamond: "text-violet-300 bg-violet-500/20",
  platinum: "text-cyan-300 bg-cyan-500/20",
  gold: "text-yellow-300 bg-yellow-500/20",
  silver: "text-zinc-200 bg-zinc-400/20",
  bronze: "text-orange-300 bg-orange-500/20",
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

async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/v1/leaderboard`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as LeaderboardEntry[];
  } catch (_err) {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await loadLeaderboard();
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-lg font-semibold">Affiliate leaderboard</h1>
      <p className="mt-3 text-sm text-zinc-400">
        Top affiliates ranked by total earnings.
      </p>
      <div className="mt-6 space-y-3 text-sm">
        {entries.length === 0 && (
          <p className="text-zinc-400">No affiliate data yet.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.affiliateId} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                {entry.rank}
              </div>
              <div>
                <div className="text-white">{entry.displayName}</div>
                <div className="text-xs text-zinc-400">
                  {entry.totalConversions} conversions &middot; ${entry.totalEarnings.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs ${tierColors[entry.tier] ?? "text-zinc-300 bg-white/10"}`}>
                {entry.tier}
              </span>
              {entry.badges.map((badge) => (
                <span key={badge} className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300">
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
