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
    <section className="glass-card p-6">
      <div className="flex items-center justify-between">
        <h1 className="section-header text-lg">Backoffice access matrix</h1>
        <button className="btn-secondary text-xs">
          Export policy
        </button>
      </div>
      <p className="mt-3 text-sm text-[#8B8B9E]">
        Control what VibeAff, partners, and affiliates can do in the platform.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead className="text-left text-[#8B8B9E] text-xs uppercase tracking-wider">
            <tr>
              <th className="py-2 pl-3">Role</th>
              {permissions.map((permission) => (
                <th key={permission.key} className="py-2 px-3">
                  {permission.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.name} className="group">
                <td className="px-3 py-3 rounded-l-[10px] bg-[rgba(0,0,0,0.25)] border-y border-l border-[rgba(255,255,255,0.08)] group-hover:border-[rgba(255,255,255,0.2)] transition-colors">
                  <div className="text-[#F6F6F7] font-medium">{role.name}</div>
                  <div className="text-xs text-[#8B8B9E]">{role.scope}</div>
                </td>
                {permissions.map((permission, index) => {
                  const allowed = matrix[role.name][index];
                  const isLast = index === permissions.length - 1;
                  return (
                    <td
                      key={permission.key}
                      className={`px-3 py-3 bg-[rgba(0,0,0,0.25)] border-y border-[rgba(255,255,255,0.08)] group-hover:border-[rgba(255,255,255,0.2)] transition-colors ${isLast ? "rounded-r-[10px] border-r" : ""}`}
                    >
                      <span className={`badge ${allowed ? "badge-success" : "badge-neutral"}`}>
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
