const roles = [
  { name: "VibeAff Admin", scope: "Platform owner", label: "VibeAff" },
  { name: "Partner Admin", scope: "Merchant/business", label: "Partner" },
  { name: "Affiliate", scope: "VibeAffiliates", label: "Affiliate" },
];

const permissions = [
  { key: "programs", label: "Manage programs" },
  { key: "affiliates", label: "Approve affiliates" },
  { key: "campaigns", label: "Create campaigns" },
  { key: "payouts", label: "Approve payouts" },
  { key: "integrations", label: "Manage integrations" },
  { key: "analytics", label: "View analytics" },
  { key: "creatives", label: "Create creatives" },
  { key: "risk", label: "Risk review" },
];

const matrix: Record<string, boolean[]> = {
  "VibeAff Admin": [true, true, true, true, true, true, true, true],
  "Partner Admin": [true, true, true, true, true, true, true, false],
  Affiliate: [false, false, true, false, false, true, true, false],
};

export default function AccessMatrix() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Backoffice access matrix</h1>
        <button className="rounded-full border border-white/20 px-4 py-2 text-sm">
          Export policy
        </button>
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        Control what VibeAff, partners, and affiliates can do in the platform.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead className="text-left text-zinc-400">
            <tr>
              <th className="py-2">Role</th>
              {permissions.map((permission) => (
                <th key={permission.key} className="py-2">
                  {permission.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.name} className="rounded-xl border border-white/10 bg-black/30">
                <td className="px-3 py-3">
                  <div className="text-white">{role.name}</div>
                  <div className="text-xs text-zinc-400">{role.scope}</div>
                </td>
                {permissions.map((permission, index) => {
                  const allowed = matrix[role.name][index];
                  return (
                    <td key={permission.key} className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          allowed
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-zinc-400"
                        }`}
                      >
                        {allowed ? "Allowed" : "Restricted"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
