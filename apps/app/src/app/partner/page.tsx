const partnerModules = [
  { name: "Program setup", detail: "Set commissions, attribution, and offers." },
  { name: "Affiliate approvals", detail: "Review and accept top partners." },
  { name: "Creative governance", detail: "Approve assets before launch." },
  { name: "Payout controls", detail: "Hold, approve, and reconcile payouts." },
];

export default function PartnerToolkit() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold">Partner Toolkit</div>
        <a className="rounded-full border border-white/20 px-4 py-2 text-sm" href="/">
          Back to site
        </a>
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-6 pb-16">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold">Manage your affiliate program</h1>
          <p className="mt-3 text-zinc-300">
            Control offers, affiliates, and payouts with full visibility into performance.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {partnerModules.map((item) => (
            <div key={item.name} className="rounded-xl border border-white/10 bg-black/30 p-5">
              <div className="text-white">{item.name}</div>
              <div className="mt-2 text-sm text-zinc-300">{item.detail}</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
