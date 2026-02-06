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

type Endpoint = {
  id: string;
  merchantId: string;
  url: string;
  secret: string;
  events: string[];
  status: string;
  _count: { deliveries: number };
  createdAt: string;
};

type Delivery = {
  id: string;
  event: string;
  statusCode: number | null;
  attempts: number;
  status: string;
  lastError: string | null;
  createdAt: string;
};

const EVENTS = ["conversion.created", "conversion.flagged", "payout.released", "affiliate.enrolled"];

export default function AdminWebhooksPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ merchantId: "", url: "", events: [] as string[] });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [delLoading, setDelLoading] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/webhooks`, { headers: authHeaders() });
      if (res.ok) setEndpoints(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);

  const createEndpoint = async () => {
    if (!form.merchantId || !form.url || form.events.length === 0) return;
    const res = await fetch(`${API_URL}/v1/webhooks`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ merchantId: "", url: "", events: [] });
      fetchEndpoints();
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    await fetch(`${API_URL}/v1/webhooks/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    fetchEndpoints();
  };

  const deleteEndpoint = async (id: string) => {
    await fetch(`${API_URL}/v1/webhooks/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchEndpoints();
  };

  const rollSecret = async (id: string) => {
    const res = await fetch(`${API_URL}/v1/webhooks/${id}/roll-secret`, { method: "POST", headers: authHeaders() });
    if (res.ok) fetchEndpoints();
  };

  const loadDeliveries = async (endpointId: string) => {
    if (expandedId === endpointId) { setExpandedId(null); return; }
    setExpandedId(endpointId);
    setDelLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/webhooks/${endpointId}/deliveries?limit=20`, { headers: authHeaders() });
      if (res.ok) setDeliveries(await res.json());
    } catch { /* ignore */ } finally { setDelLoading(false); }
  };

  const retryDelivery = async (deliveryId: string) => {
    await fetch(`${API_URL}/v1/webhook-deliveries/${deliveryId}/retry`, { method: "POST", headers: authHeaders() });
    if (expandedId) loadDeliveries(expandedId);
  };

  const toggleEvent = (event: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Webhooks</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-xs">
          {showCreate ? "Cancel" : "+ New Endpoint"}
        </button>
      </div>

      {showCreate && (
        <div className="glass-card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Merchant ID"
              value={form.merchantId}
              onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
            />
            <input
              className="input"
              placeholder="https://example.com/webhooks"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div>
            <p className="text-xs text-[#8B8B9E] mb-2">Events</p>
            <div className="flex flex-wrap gap-2">
              {EVENTS.map((event) => (
                <button
                  key={event}
                  onClick={() => toggleEvent(event)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    form.events.includes(event)
                      ? "border-[#D7FF3B]/50 bg-[#D7FF3B]/10 text-[#D7FF3B]"
                      : "border-white/10 text-[#8B8B9E] hover:border-white/20"
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
          <button onClick={createEndpoint} className="btn-primary text-xs">Create Endpoint</button>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : endpoints.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No webhook endpoints configured</p>
          ) : (
            endpoints.map((ep) => (
              <div key={ep.id} className="space-y-0">
                <div className="table-row !block">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${ep.status === "active" ? "badge-success" : "badge-warning"}`}>{ep.status}</span>
                        <code className="text-xs text-[#D7FF3B] truncate">{ep.url}</code>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {ep.events.map((e) => (
                          <span key={e} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#8B8B9E]">{e}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#8B8B9E]">
                        <span>Merchant: {ep.merchantId.slice(0, 8)}...</span>
                        <span>{ep._count.deliveries} deliveries</span>
                        <button
                          onClick={() => setRevealedSecret(revealedSecret === ep.id ? null : ep.id)}
                          className="hover:text-[#F6F6F7] transition"
                        >
                          {revealedSecret === ep.id ? "Hide secret" : "Show secret"}
                        </button>
                      </div>
                      {revealedSecret === ep.id && (
                        <code className="block mt-1 text-xs text-[#8B8B9E] break-all">{ep.secret}</code>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => loadDeliveries(ep.id)} className="btn-secondary text-xs">
                        {expandedId === ep.id ? "Hide" : "Logs"}
                      </button>
                      <button onClick={() => toggleStatus(ep.id, ep.status)} className="btn-secondary text-xs">
                        {ep.status === "active" ? "Pause" : "Resume"}
                      </button>
                      <button onClick={() => rollSecret(ep.id)} className="btn-secondary text-xs">Roll Secret</button>
                      <button onClick={() => deleteEndpoint(ep.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </div>
                </div>

                {expandedId === ep.id && (
                  <div className="ml-4 border-l border-white/[0.06] pl-4 space-y-2 py-2">
                    {delLoading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : deliveries.length === 0 ? (
                      <p className="text-xs text-[#8B8B9E]">No deliveries yet</p>
                    ) : (
                      deliveries.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-xs gap-4 py-1">
                          <div className="flex items-center gap-3">
                            <span className={`badge ${d.status === "delivered" ? "badge-success" : d.status === "failed" ? "badge-error" : "badge-warning"}`}>
                              {d.status}
                            </span>
                            <span className="text-[#8B8B9E]">{d.event}</span>
                            {d.statusCode && <span className="text-[#8B8B9E]">HTTP {d.statusCode}</span>}
                            {d.lastError && <span className="text-red-400 truncate max-w-[200px]">{d.lastError}</span>}
                            <span className="text-[#8B8B9E]">x{d.attempts}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#8B8B9E]">{new Date(d.createdAt).toLocaleString()}</span>
                            {d.status === "failed" && (
                              <button onClick={() => retryDelivery(d.id)} className="text-[#D7FF3B] hover:underline">Retry</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
