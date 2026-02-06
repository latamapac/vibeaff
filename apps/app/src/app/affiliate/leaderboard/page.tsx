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

type LeaderboardEntry = {
  rank: number;
  affiliateId: string;
  displayName: string;
  totalEarnings: number;
  totalConversions: number;
  tier: string;
  badges: string[];
};

const tierColors: Record<string, string> = {
  bronze: "from-orange-700 to-orange-500",
  silver: "from-zinc-400 to-zinc-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-400 to-blue-300",
  diamond: "from-purple-400 to-pink-300",
};

const rankMedals: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

export default function AffiliateLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/leaderboard`, { headers: authHeaders() });
      if (res.ok) setEntries(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  return (
    <>
      <h1 className="text-xl font-semibold">Leaderboard</h1>

      <div className="glass-card p-6">
        <div className="hidden sm:grid sm:grid-cols-5 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Rank</span>
          <span>Affiliate</span>
          <span>Tier</span>
          <span>Conversions</span>
          <span className="text-right">Earnings</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : entries.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No leaderboard data yet</p>
          ) : (
            entries.map((e) => {
              const isMe = e.affiliateId === affiliateId;
              const tierGradient = tierColors[e.tier?.toLowerCase()] ?? tierColors.bronze;
              const medalColor = rankMedals[e.rank];

              return (
                <div
                  key={e.affiliateId}
                  className={`table-row !grid !grid-cols-2 sm:!grid-cols-5 gap-4 text-sm ${isMe ? "!border-[#D7FF3B]/30 !bg-[#D7FF3B]/5" : ""}`}
                >
                  <span className="font-semibold flex items-center gap-2">
                    {medalColor ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={medalColor}>
                        <circle cx="12" cy="12" r="10" />
                        <text x="12" y="16" textAnchor="middle" fill="#050508" fontSize="12" fontWeight="bold">{e.rank}</text>
                      </svg>
                    ) : (
                      <span className="text-[#8B8B9E] w-5 text-center">#{e.rank}</span>
                    )}
                  </span>
                  <span className={`font-medium ${isMe ? "text-[#D7FF3B]" : "text-[#F6F6F7]"}`}>
                    {e.displayName}{isMe ? " (you)" : ""}
                  </span>
                  <span>
                    <span className={`rounded-full bg-gradient-to-r ${tierGradient} px-2.5 py-0.5 text-[10px] font-bold uppercase text-white`}>
                      {e.tier}
                    </span>
                  </span>
                  <span className="text-[#8B8B9E]">{e.totalConversions.toLocaleString()}</span>
                  <span className="text-right font-semibold text-[#D7FF3B]">
                    ${e.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
