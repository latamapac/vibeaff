"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface MerchantData {
  id: string;
  name: string;
  websiteUrl: string;
  defaultCommission: number;
}

interface ProgramData {
  id: string;
  name: string;
  attributionWindowDays: number;
}

const STEPS = ["Create merchant", "Create program", "Review"] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, idx) => (
        <div key={label} className="flex items-center">
          {idx > 0 && (
            <div
              className={`h-0.5 w-12 sm:w-20 transition-colors duration-300 ${
                idx <= current ? "bg-blue-500" : "bg-zinc-700"
              }`}
            />
          )}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                idx < current
                  ? "border-blue-500 bg-blue-500 text-white"
                  : idx === current
                  ? "border-blue-500 bg-blue-500/20 text-blue-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-500"
              }`}
            >
              {idx < current ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                idx <= current ? "text-blue-400" : "text-zinc-500"
              }`}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PartnerToolkit() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Step 1 fields
  const [merchantName, setMerchantName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [defaultCommission, setDefaultCommission] = useState("10");

  // Step 2 fields
  const [programName, setProgramName] = useState("");
  const [attributionWindow, setAttributionWindow] = useState("30");

  // Created resources
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [program, setProgram] = useState<ProgramData | null>(null);

  async function handleCreateMerchant(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/merchants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: merchantName,
          websiteUrl,
          defaultCommission: parseFloat(defaultCommission),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMerchant(data);
      setStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/merchants/${merchant.id}/programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: programName,
          attributionWindowDays: parseInt(attributionWindow, 10),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setProgram(data);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleLaunch() {
    setCompleted(true);
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="text-xl font-semibold">Partner Toolkit</div>
          <a className="rounded-full border border-white/20 px-4 py-2 text-sm" href="/">
            Back to site
          </a>
        </header>
        <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Program launched!</h1>
          <p className="mt-3 text-zinc-400">
            Your merchant <span className="text-white font-medium">{merchant?.name}</span> and program{" "}
            <span className="text-white font-medium">{program?.name}</span> are live.
          </p>
          <a
            href="/admin"
            className="mt-8 inline-block rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Go to Admin Dashboard
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold">Partner Toolkit</div>
        <a className="rounded-full border border-white/20 px-4 py-2 text-sm" href="/">
          Back to site
        </a>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-16">
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold">Program Setup Wizard</h1>
          <p className="mt-2 text-zinc-400">Set up your affiliate program in three simple steps.</p>
        </section>

        <StepIndicator current={step} />

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Create Merchant */}
        {step === 0 && (
          <form onSubmit={handleCreateMerchant} className="space-y-5 rounded-2xl border border-white/10 bg-black/30 p-6">
            <h2 className="text-lg font-semibold">Create merchant</h2>

            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Merchant name</label>
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Website URL</label>
              <input
                type="url"
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
                placeholder="https://acme.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Default commission (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
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
                  Creating...
                </span>
              ) : (
                "Create Merchant"
              )}
            </button>
          </form>
        )}

        {/* Step 2: Create Program */}
        {step === 1 && (
          <form onSubmit={handleCreateProgram} className="space-y-5 rounded-2xl border border-white/10 bg-black/30 p-6">
            <h2 className="text-lg font-semibold">Create program</h2>

            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Program name</label>
              <input
                type="text"
                required
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
                placeholder="Summer Launch 2026"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Attribution window (days)</label>
              <select
                value={attributionWindow}
                onChange={(e) => setAttributionWindow(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
              >
                {Array.from({ length: 90 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d} day{d > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
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
                  Creating...
                </span>
              ) : (
                "Create Program"
              )}
            </button>
          </form>
        )}

        {/* Step 3: Review */}
        {step === 2 && merchant && program && (
          <div className="space-y-5 rounded-2xl border border-white/10 bg-black/30 p-6">
            <h2 className="text-lg font-semibold">Review &amp; Launch</h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Merchant</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Name</dt>
                    <dd className="font-medium text-white">{merchant.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Website</dt>
                    <dd className="font-medium text-white">{merchant.websiteUrl}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Commission</dt>
                    <dd className="font-medium text-white">{merchant.defaultCommission}%</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Program</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Name</dt>
                    <dd className="font-medium text-white">{program.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Attribution window</dt>
                    <dd className="font-medium text-white">{program.attributionWindowDays} days</dd>
                  </div>
                </dl>
              </div>
            </div>

            <button
              onClick={handleLaunch}
              className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-500"
            >
              Launch Program
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
