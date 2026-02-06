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

type DataPoint = { date: string; clicks: number; conversions: number; revenue: number; commission: number };
type Summary = { clicks: number; conversions: number; revenue: number; commission: number; conversionRate: string };
type TopAffiliate = { affiliateId: string; displayName: string; clicks: number; conversions: number; revenue: number; commission: number };

function MiniChart({ data, dataKey, color }: { data: DataPoint[]; dataKey: keyof DataPoint; color: string }) {
  if (data.length < 2) return <p className="text-xs text-[#8B8B9E] text-center py-4">Not enough data</p>;

  const values = data.map((d) => Number(d[dataKey]));
  const max = Math.max(...values, 1);
  const width = 100;
  const height = 40;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none">
      <polygon points={areaPoints} fill={color} fillOpacity="0.15" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function BarChart({ data, dataKey, color }: { data: DataPoint[]; dataKey: keyof DataPoint; color: string }) {
  if (data.length === 0) return <p className="text-xs text-[#8B8B9E] text-center py-8">No data for this period</p>;

  const values = data.map((d) => Number(d[dataKey]));
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-[2px] h-40">
      {data.map((d, i) => {
        const h = (Number(d[dataKey]) / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${Math.max(h, 2)}%`, backgroundColor: color, opacity: 0.7 }}
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-[10px] text-[#F6F6F7] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
              {d.date}: {Number(d[dataKey]).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [timeseries, setTimeseries] = useState<DataPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [groupBy, setGroupBy] = useState("day");
  const [rollingUp, setRollingUp] = useState(false);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (range === "7d") start.setDate(end.getDate() - 7);
    else if (range === "30d") start.setDate(end.getDate() - 30);
    else if (range === "90d") start.setDate(end.getDate() - 90);
    else start.setDate(end.getDate() - 365);
    return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    try {
      const [tsRes, sumRes, topRes] = await Promise.all([
        fetch(`${API_URL}/v1/analytics/timeseries?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`, { headers: authHeaders() }),
        fetch(`${API_URL}/v1/analytics/summary?startDate=${startDate}&endDate=${endDate}`, { headers: authHeaders() }),
        fetch(`${API_URL}/v1/analytics/top-affiliates?startDate=${startDate}&endDate=${endDate}&limit=10`, { headers: authHeaders() }),
      ]);
      if (tsRes.ok) setTimeseries(await tsRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
      if (topRes.ok) setTopAffiliates(await topRes.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [range, groupBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const triggerRollup = async () => {
    setRollingUp(true);
    try {
      await fetch(`${API_URL}/v1/analytics/rollup`, { method: "POST", headers: authHeaders() });
      fetchData();
    } catch { /* ignore */ } finally { setRollingUp(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-2">
          <a
            href={`${API_URL}/v1/exports/analytics.csv?startDate=${getDateRange().startDate}&endDate=${getDateRange().endDate}`}
            className="btn-secondary text-xs"
            download
          >
            Export CSV
          </a>
          <button onClick={triggerRollup} disabled={rollingUp} className="btn-secondary text-xs">
            {rollingUp ? "Processing..." : "Run Rollup"}
          </button>
          {(["7d", "30d", "90d", "1y"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                range === r
                  ? "border-[#D7FF3B]/50 bg-[#D7FF3B]/10 text-[#D7FF3B]"
                  : "border-white/10 text-[#8B8B9E] hover:border-white/20"
              }`}
            >
              {r}
            </button>
          ))}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="input text-xs !py-1.5 !px-2 !w-auto"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading || !summary ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <div className="glass-card p-4">
              <p className="text-xs text-[#8B8B9E]">Clicks</p>
              <p className="text-2xl font-semibold mt-1">{summary.clicks.toLocaleString()}</p>
              <MiniChart data={timeseries} dataKey="clicks" color="#D7FF3B" />
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-[#8B8B9E]">Conversions</p>
              <p className="text-2xl font-semibold mt-1">{summary.conversions.toLocaleString()}</p>
              <MiniChart data={timeseries} dataKey="conversions" color="#3B82F6" />
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-[#8B8B9E]">Revenue</p>
              <p className="text-2xl font-semibold mt-1">${summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <MiniChart data={timeseries} dataKey="revenue" color="#8B5CF6" />
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-[#8B8B9E]">Commission</p>
              <p className="text-2xl font-semibold mt-1">${summary.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <MiniChart data={timeseries} dataKey="commission" color="#EC4899" />
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-[#8B8B9E]">Conv. Rate</p>
              <p className="text-2xl font-semibold mt-1">{summary.conversionRate}%</p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4">Clicks</h2>
          {loading ? <Skeleton className="h-40 w-full" /> : <BarChart data={timeseries} dataKey="clicks" color="#D7FF3B" />}
        </div>
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4">Revenue</h2>
          {loading ? <Skeleton className="h-40 w-full" /> : <BarChart data={timeseries} dataKey="revenue" color="#8B5CF6" />}
        </div>
      </div>

      {/* Top affiliates */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold mb-4">Top Affiliates</h2>
        <div className="hidden sm:grid sm:grid-cols-6 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Rank</span>
          <span>Affiliate</span>
          <span>Clicks</span>
          <span>Conversions</span>
          <span>Revenue</span>
          <span>Commission</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : topAffiliates.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-6">No data yet. Run rollup to aggregate stats.</p>
          ) : (
            topAffiliates.map((a, i) => (
              <div key={a.affiliateId} className="table-row !grid !grid-cols-2 sm:!grid-cols-6 gap-4 text-sm">
                <span className="font-mono text-[#D7FF3B]">#{i + 1}</span>
                <span className="font-medium">{a.displayName}</span>
                <span className="text-[#8B8B9E]">{a.clicks.toLocaleString()}</span>
                <span className="text-[#8B8B9E]">{a.conversions.toLocaleString()}</span>
                <span>${a.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-[#D7FF3B]">${a.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
