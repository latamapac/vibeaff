type Metrics = {
  merchants: number;
  affiliates: number;
  programs: number;
  campaigns: number;
  conversions: number;
  payouts: number;
  channels: number;
  creativeTools: number;
};

const alerts = [
  "Affiliate AFF-221 flagged for high conversion velocity.",
  "Program PRG-108 hit refund threshold.",
  "Payout batch PB-57 awaiting approval.",
];

async function loadMetrics(): Promise<Metrics | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/v1/metrics`, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as Metrics;
  } catch (_err) {
    return null;
  }
}

export default async function AdminDashboard() {
  const metrics = await loadMetrics();
  const statCards = [
    { label: "Merchants", value: metrics?.merchants ?? "—" },
    { label: "Affiliates", value: metrics?.affiliates ?? "—" },
    { label: "Programs", value: metrics?.programs ?? "—" },
    { label: "Campaigns", value: metrics?.campaigns ?? "—" },
    { label: "Conversions", value: metrics?.conversions ?? "—" },
    { label: "Payouts", value: metrics?.payouts ?? "—" },
    { label: "Channels", value: metrics?.channels ?? "—" },
    { label: "Creative tools", value: metrics?.creativeTools ?? "—" },
  ];
  return (
    <>
      <section className="grid gap-6 md:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-zinc-400">{card.label}</div>
            <div className="mt-3 text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payout queue</h2>
            <button className="rounded-full border border-white/20 px-4 py-2 text-sm">
              Review queue
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Affiliate AFF-102 • $4,320 • Hold ends in 2 days</span>
              <button className="rounded-full bg-white px-3 py-1 text-black">Approve</button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Affiliate AFF-208 • $2,150 • Fraud review</span>
              <button className="rounded-full border border-white/20 px-3 py-1 text-white">Hold</button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Affiliate AFF-311 • $6,050 • Ready</span>
              <button className="rounded-full bg-white px-3 py-1 text-black">Release</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {alerts.map((alert) => (
              <li key={alert} className="rounded-xl border border-white/10 bg-black/30 p-3">
                {alert}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Google Analytics</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Ads Library</span>
              <span className="text-green-400">Syncing</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Crypto payouts</span>
              <span className="text-yellow-400">Pending KYC</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Compliance checklist</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Affiliate KYC review</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Payout holds enforced</span>
              <span className="text-green-400">OK</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
              <span>Audit logs retention</span>
              <span className="text-yellow-400">30 days</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
