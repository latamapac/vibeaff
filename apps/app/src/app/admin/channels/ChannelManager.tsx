"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = {
  id: string;
  name: string;
  category: string;
  status: "connected" | "ready" | "planned";
  provider?: string | null;
};

const statusOptions: Channel["status"][] = ["connected", "ready", "planned"];

const statusBadge: Record<string, string> = {
  connected: "badge-success",
  ready: "badge-info",
  planned: "badge-neutral",
};

const categoryOptions = [
  "Search",
  "Social",
  "Push / Pop",
  "Native",
  "In-game / Apps",
  "B2B",
  "Other",
];

const fallbackChannels: Channel[] = [
  { id: "fallback-1", name: "Google Ads", category: "Search", status: "connected", provider: "google" },
  { id: "fallback-2", name: "Meta Ads", category: "Social", status: "connected", provider: "meta" },
  { id: "fallback-3", name: "Microsoft Ads", category: "Search", status: "ready", provider: "microsoft" },
  { id: "fallback-4", name: "PropellerAds", category: "Push / Pop", status: "ready", provider: "propellerads" },
];

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export default function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", status: "planned" as Channel["status"], provider: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const apiUrl = useMemo(() => getApiUrl(), []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/v1/channels`);
      if (!res.ok) {
        throw new Error("Failed to load channels");
      }
      const data = (await res.json()) as Channel[];
      setChannels(data.length ? data : fallbackChannels);
    } catch (err) {
      setError((err as Error).message);
      setChannels(fallbackChannels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm({ name: "", category: "", status: "planned", provider: "" });
    setEditing(null);
  };

  const createChannel = async () => {
    setError(null);
    if (!form.name || !form.category) {
      setError("Name and category are required.");
      return;
    }
    const res = await fetch(`${apiUrl}/v1/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        status: form.status,
        provider: form.provider || undefined,
      }),
    });
    if (!res.ok) {
      setError("Failed to create channel.");
      return;
    }
    resetForm();
    await load();
  };

  const updateChannel = async () => {
    if (!editing) return;
    setError(null);
    if (!form.name || !form.category) {
      setError("Name and category are required.");
      return;
    }
    const res = await fetch(`${apiUrl}/v1/channels/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        status: form.status,
        provider: form.provider || undefined,
      }),
    });
    if (!res.ok) {
      setError("Failed to update channel.");
      return;
    }
    resetForm();
    await load();
  };

  const deleteChannel = async (id: string) => {
    const res = await fetch(`${apiUrl}/v1/channels/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete channel.");
      return;
    }
    setConfirmDelete(null);
    await load();
  };

  const startEditing = (channel: Channel) => {
    setEditing(channel.id);
    setForm({
      name: channel.name,
      category: channel.category,
      status: channel.status,
      provider: channel.provider ?? "",
    });
  };

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <section className="glass-card p-6">
      <div className="flex items-center justify-between">
        <h1 className="section-header text-lg">Channels library</h1>
        <div className="flex items-center gap-2">
          {editing && (
            <button className="btn-secondary text-xs" onClick={resetForm}>
              Cancel
            </button>
          )}
          <button
            className="btn-primary text-xs"
            onClick={editing ? updateChannel : createChannel}
          >
            {editing ? "Save changes" : "Add channel"}
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-[#8B8B9E]">
        Manage major advertising channels plus push, native, and in-app traffic sources.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <input
          className="input text-sm"
          placeholder="Channel name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <select
          className="input text-sm"
          value={form.category}
          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
        >
          <option value="" disabled>
            Select category
          </option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          className="input text-sm"
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Channel["status"] }))}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          className="input text-sm"
          placeholder="Provider (optional)"
          value={form.provider}
          onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value }))}
        />
      </div>

      {error ? <p className="mt-4 text-sm text-[#fca5a5]">{error}</p> : null}
      {loading ? (
        <div className="mt-4 space-y-2">
          {[1, 2].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      ) : null}

      {/* Search / filter */}
      <div className="mt-6">
        <input
          className="input text-sm"
          placeholder="Search channels by name..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {filteredChannels.map((channel) => (
          <div
            key={channel.id}
            className={`flex items-center justify-between rounded-[10px] border p-4 cursor-pointer transition-all ${
              editing === channel.id
                ? "border-[#D7FF3B]/40 bg-[#D7FF3B]/[0.06]"
                : "border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.25)] hover:border-[rgba(255,255,255,0.2)]"
            }`}
            onClick={() => startEditing(channel)}
          >
            <div>
              <div className="text-[#F6F6F7] font-medium">{channel.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#8B8B9E]">{channel.category}</span>
                <span className={`badge text-[10px] ${statusBadge[channel.status] ?? "badge-neutral"}`}>
                  {channel.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {confirmDelete === channel.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#fca5a5]">Delete?</span>
                  <button
                    className="btn-danger text-xs"
                    onClick={() => deleteChannel(channel.id)}
                  >
                    Yes
                  </button>
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => setConfirmDelete(null)}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  className="btn-secondary text-xs"
                  onClick={() => setConfirmDelete(channel.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
