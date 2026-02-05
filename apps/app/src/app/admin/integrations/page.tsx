import CreativeToolManager from "../creative-tools/CreativeToolManager";

const statusStyles: Record<string, string> = {
  connected: "text-emerald-300 bg-emerald-500/20",
  ready: "text-sky-300 bg-sky-500/20",
  planned: "text-zinc-300 bg-white/10",
};

type IntegrationItem = {
  id?: string;
  name: string;
  status: "connected" | "ready" | "planned";
  description: string;
};

const fallbackIntegrations: IntegrationItem[] = [
  { name: "Google Ads", status: "connected", description: "Sync campaign performance and keywords." },
  { name: "Meta Ads", status: "connected", description: "Import creative insights and ROAS." },
  { name: "Microsoft Ads", status: "ready", description: "Enable search network tracking." },
  { name: "PropellerAds", status: "ready", description: "Push and pop traffic automation." },
  { name: "In-game DSP", status: "planned", description: "Acquire in-app and game placements." },
];

export default function Integrations() {
  const adIntegrations = fallbackIntegrations;
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-lg font-semibold">Advertising integrations</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Connect major ad networks and specialized traffic sources to sync performance.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {adIntegrations.map((integration) => (
            <div key={integration.id ?? integration.name} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">{integration.name}</div>
                <span className={`rounded-full px-3 py-1 text-xs ${statusStyles[integration.status]}`}>
                  {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{integration.description}</p>
            </div>
          ))}
        </div>
      </section>

      <CreativeToolManager />
    </div>
  );
}
