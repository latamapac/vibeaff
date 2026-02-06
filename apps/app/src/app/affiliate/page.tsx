"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TABS = ["Audience Builder", "Creative Packs", "Traffic Planner", "Performance Hub"] as const;
type Tab = (typeof TABS)[number];

const CHANNELS = ["Google Ads", "Meta Ads", "TikTok Ads", "YouTube Ads", "Email", "Native Ads"] as const;

/* ---------- sub-types ---------- */
interface Audience {
  region: string;
  description: string;
  interests: string[];
}

interface CopyVariant {
  headline: string;
  body: string;
  cta: string;
}

interface ChannelBudget {
  channel: string;
  budget: number;
}

interface Stats {
  tier: string;
  totalEarnings: number;
  totalConversions: number;
  totalClicks: number;
  badges: string[];
}

/* ---------- Skeleton loader ---------- */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-800 ${className}`} />;
}

/* ====================================================================== */
export default function AffiliateToolkit() {
  const [activeTab, setActiveTab] = useState<Tab>("Audience Builder");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold">VibeAffiliates Toolkit</div>
        <a className="rounded-full border border-white/20 px-4 py-2 text-sm" href="/">
          Back to site
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold">Launch winning affiliate campaigns</h1>
          <p className="mt-2 text-zinc-400">
            Access your tools to build audiences, select creatives, and optimize traffic spend.
          </p>
        </section>

        {/* Tab bar */}
        <div className="mb-8 flex gap-1 overflow-x-auto border-b border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Audience Builder" && <AudienceBuilder />}
        {activeTab === "Creative Packs" && <CreativePacks />}
        {activeTab === "Traffic Planner" && <TrafficPlanner />}
        {activeTab === "Performance Hub" && <PerformanceHub />}
      </main>
    </div>
  );
}

/* ====================================================================== */
/* Audience Builder                                                        */
/* ====================================================================== */
function AudienceBuilder() {
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [interests, setInterests] = useState("");
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const entry: Audience = {
      region,
      description,
      interests: interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setAudiences((prev) => [...prev, entry]);
    setRegion("");
    setDescription("");
    setInterests("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-white/10 bg-black/30 p-6">
        <h2 className="text-lg font-semibold">Define your audience</h2>

        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Region</label>
          <input
            type="text"
            required
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g. North America"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Target audience description</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors resize-none"
            placeholder="Describe your ideal customer..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Interests (comma-separated)</label>
          <input
            type="text"
            required
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
            placeholder="fitness, nutrition, wellness"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Save Audience
        </button>

        {saved && <p className="text-center text-sm text-green-400">Audience saved!</p>}
      </form>

      {audiences.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Saved audiences</h3>
          {audiences.map((a, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{a.region}</p>
                  <p className="mt-1 text-sm text-zinc-400">{a.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.interests.map((tag) => (
                  <span key={tag} className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/* Creative Packs                                                          */
/* ====================================================================== */
function CreativePacks() {
  const [channel, setChannel] = useState<string>(CHANNELS[0]);
  const [productName, setProductName] = useState("");
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVariants([]);
    try {
      const res = await fetch(`${API_URL}/v1/creatives/generate-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, productName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setVariants(Array.isArray(data) ? data : data.variants ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerate} className="space-y-5 rounded-2xl border border-white/10 bg-black/30 p-6">
        <h2 className="text-lg font-semibold">Generate channel-specific copy</h2>

        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
          >
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-zinc-400">Product name</label>
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g. ProFit Tracker"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Copy"
          )}
        </button>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
      </form>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/50 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {variants.map((v, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
              <h3 className="text-base font-semibold text-white">{v.headline}</h3>
              <p className="mt-2 text-sm text-zinc-400">{v.body}</p>
              <span className="mt-3 inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
                {v.cta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/* Traffic Planner                                                         */
/* ====================================================================== */
function TrafficPlanner() {
  const [budgets, setBudgets] = useState<ChannelBudget[]>(
    CHANNELS.map((ch) => ({ channel: ch, budget: 0 }))
  );

  const total = budgets.reduce((sum, b) => sum + b.budget, 0);

  function updateBudget(index: number, value: string) {
    setBudgets((prev) =>
      prev.map((b, i) => (i === index ? { ...b, budget: parseFloat(value) || 0 } : b))
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
      <h2 className="mb-5 text-lg font-semibold">Allocate budget by channel</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500">
              <th className="pb-3 font-medium">Channel</th>
              <th className="pb-3 font-medium text-right">Budget ($)</th>
              <th className="pb-3 font-medium text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b, i) => (
              <tr key={b.channel} className="border-b border-white/5">
                <td className="py-3 text-white">{b.channel}</td>
                <td className="py-3 text-right">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={b.budget || ""}
                    onChange={(e) => updateBudget(i, e.target.value)}
                    className="w-28 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-right text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="0"
                  />
                </td>
                <td className="py-3 text-right text-zinc-400">
                  {total > 0 ? `${((b.budget / total) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10">
              <td className="pt-4 font-semibold text-white">Total</td>
              <td className="pt-4 text-right font-semibold text-white">
                ${total.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </td>
              <td className="pt-4 text-right text-zinc-400">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Performance Hub                                                         */
/* ====================================================================== */
function PerformanceHub() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/affiliates/demo/stats`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        <button
          onClick={fetchStats}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const tierColors: Record<string, string> = {
    bronze: "from-orange-700 to-orange-500",
    silver: "from-zinc-400 to-zinc-300",
    gold: "from-yellow-500 to-yellow-300",
    platinum: "from-cyan-400 to-blue-300",
  };
  const tierGradient = tierColors[stats.tier.toLowerCase()] ?? "from-blue-500 to-purple-500";

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-black/30 p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Performance overview</h2>
        <span
          className={`rounded-full bg-gradient-to-r ${tierGradient} px-3 py-1 text-xs font-bold uppercase text-white`}
        >
          {stats.tier}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-500">Total Earnings</p>
          <p className="mt-1 text-2xl font-bold text-white">
            ${stats.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-500">Total Conversions</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats.totalConversions.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-500">Total Clicks</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats.totalClicks.toLocaleString()}</p>
        </div>
      </div>

      {stats.badges.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
