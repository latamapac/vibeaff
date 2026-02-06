"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AuditLogsPage() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("vibeaff_token");
    fetch(`${apiUrl}/v1/audit-logs?limit=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  return (
    <section className="glass-card p-6">
      <h1 className="section-header text-lg">Audit logs</h1>
      <p className="mt-3 text-sm text-[#8B8B9E]">
        Recent platform actions for compliance and debugging.
      </p>
      <div className="mt-6 space-y-2 text-sm">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        )}
        {!loading && logs.length === 0 && (
          <p className="text-[#8B8B9E] text-center py-8">No audit entries yet.</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="table-row flex-col gap-1 md:flex-row">
            <div>
              <span className="text-[#F6F6F7] font-medium">{log.action}</span>
              <span className="ml-2 text-[#8B8B9E]">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</span>
            </div>
            <div className="text-xs text-[#8B8B9E]/60">
              {new Date(log.createdAt).toLocaleString()}
              {log.ipAddress ? ` · ${log.ipAddress}` : ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
