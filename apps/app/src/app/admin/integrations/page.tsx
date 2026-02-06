import CreativeToolManager from "../creative-tools/CreativeToolManager";

const statusBadge: Record<string, string> = {
  connected: "badge-success",
  ready: "badge-info",
  planned: "badge-neutral",
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
    <div className="space-y-6">
      <section className="glass-card p-6">
        <h1 className="section-header text-lg">Advertising integrations</h1>
        <p className="mt-3 text-sm text-[#8B8B9E]">
          Connect major ad networks and specialized traffic sources to sync performance.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {adIntegrations.map((integration) => (
            <div key={integration.id ?? integration.name} className="table-row flex-col !items-start gap-2">
              <div className="flex items-center justify-between w-full">
                <span className="text-[#F6F6F7] font-medium">{integration.name}</span>
                <span className={`badge ${statusBadge[integration.status]}`}>
                  {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                </span>
              </div>
              <p className="text-xs text-[#8B8B9E]">{integration.description}</p>
            </div>
          ))}
        </div>
      </section>

      <CreativeToolManager />
    </div>
  );
}
