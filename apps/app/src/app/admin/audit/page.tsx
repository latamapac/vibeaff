type AuditEntry = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
};

async function loadAuditLogs(): Promise<AuditEntry[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/v1/audit-logs?limit=100`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as AuditEntry[];
  } catch (_err) {
    return [];
  }
}

export default async function AuditLogsPage() {
  const logs = await loadAuditLogs();
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-lg font-semibold">Audit logs</h1>
      <p className="mt-3 text-sm text-zinc-400">
        Recent platform actions for compliance and debugging.
      </p>
      <div className="mt-6 space-y-2 text-sm">
        {logs.length === 0 && (
          <p className="text-zinc-400">No audit entries yet.</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/30 p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-white">{log.action}</span>
              <span className="ml-2 text-zinc-400">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</span>
            </div>
            <div className="text-xs text-zinc-500">
              {new Date(log.createdAt).toLocaleString()}
              {log.ipAddress ? ` · ${log.ipAddress}` : ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
