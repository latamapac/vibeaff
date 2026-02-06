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

type ApiKeyItem = {
  id: string;
  merchantId: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  status: string;
  createdAt: string;
  rawKey?: string;
};

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ merchantId: "", name: "" });
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/api-keys`, { headers: authHeaders() });
      if (res.ok) setKeys(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    if (!form.merchantId || !form.name) return;
    const res = await fetch(`${API_URL}/v1/api-keys`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKeyRaw(data.rawKey);
      setShowCreate(false);
      setForm({ merchantId: "", name: "" });
      fetchKeys();
    }
  };

  const revokeKey = async (id: string) => {
    await fetch(`${API_URL}/v1/api-keys/${id}/revoke`, { method: "POST", headers: authHeaders() });
    fetchKeys();
  };

  const deleteKey = async (id: string) => {
    await fetch(`${API_URL}/v1/api-keys/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchKeys();
  };

  const copyKey = () => {
    if (newKeyRaw) {
      navigator.clipboard.writeText(newKeyRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">API Keys</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-xs">
          {showCreate ? "Cancel" : "+ New Key"}
        </button>
      </div>

      {newKeyRaw && (
        <div className="glass-card p-4 border border-[#D7FF3B]/30 bg-[#D7FF3B]/5">
          <p className="text-sm font-medium text-[#D7FF3B] mb-2">New API key created — copy it now, it won't be shown again!</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-black/30 px-3 py-2 rounded flex-1 break-all">{newKeyRaw}</code>
            <button onClick={copyKey} className="btn-primary text-xs shrink-0">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKeyRaw(null)} className="text-xs text-[#8B8B9E] mt-2 hover:text-[#F6F6F7]">Dismiss</button>
        </div>
      )}

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
              placeholder="Key name (e.g. Production S2S)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <button onClick={createKey} className="btn-primary text-xs">Generate Key</button>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="hidden sm:grid sm:grid-cols-6 gap-4 px-4 pb-3 text-xs font-medium text-[#8B8B9E] uppercase tracking-wider border-b border-white/[0.06]">
          <span>Name</span>
          <span>Prefix</span>
          <span>Merchant</span>
          <span>Status</span>
          <span>Last Used</span>
          <span>Actions</span>
        </div>
        <div className="space-y-2 mt-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : keys.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No API keys created yet</p>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="table-row !grid !grid-cols-2 sm:!grid-cols-6 gap-4 text-sm">
                <span className="font-medium">{k.name}</span>
                <code className="text-xs text-[#D7FF3B]">{k.prefix}...</code>
                <span className="text-[#8B8B9E] text-xs">{k.merchantId.slice(0, 12)}...</span>
                <span>
                  <span className={`badge ${k.status === "active" ? "badge-success" : "badge-error"}`}>{k.status}</span>
                </span>
                <span className="text-[#8B8B9E] text-xs">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}</span>
                <div className="flex gap-2">
                  {k.status === "active" && (
                    <button onClick={() => revokeKey(k.id)} className="text-xs text-yellow-400 hover:text-yellow-300">Revoke</button>
                  )}
                  <button onClick={() => deleteKey(k.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">S2S Postback Usage</h2>
        <p className="text-xs text-[#8B8B9E]">
          Send server-to-server conversion events using the postback endpoint. Include your API key in the <code className="text-[#D7FF3B]">X-API-Key</code> header.
        </p>
        <div className="bg-black/30 rounded-lg p-4">
          <code className="text-xs text-[#8B8B9E] whitespace-pre">{`POST /v1/postback
Headers: X-API-Key: vba_...

Body (JSON):
{
  "order_id": "ORD-123",
  "amount": 99.99,
  "currency": "USD",
  "click_id": "clk_abc...",     // or
  "promo_code": "SAVE20"        // for attribution
}`}</code>
        </div>
      </div>
    </>
  );
}
