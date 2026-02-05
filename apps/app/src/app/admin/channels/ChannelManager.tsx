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
    setForm({ name: "", category: "", status: "planned", provider: "" });
    await load();
  };

  const deleteChannel = async (id: string) => {
    const res = await fetch(`${apiUrl}/v1/channels/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete channel.");
      return;
    }
    await load();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Channels library</h1>
        <button
          className="rounded-full border border-white/20 px-4 py-2 text-sm"
          onClick={createChannel}
        >
          Add channel
        </button>
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        Manage major advertising channels plus push, native, and in-app traffic sources.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <input
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="Channel name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="Category"
          value={form.category}
          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
        />
        <select
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
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
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="Provider (optional)"
          value={form.provider}
          onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value }))}
        />
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-zinc-400">Loading...</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4"
          >
            <div>
              <div className="text-white">{channel.name}</div>
              <div className="text-xs text-zinc-400">
                {channel.category} · {channel.status}
              </div>
            </div>
            <button
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white"
              onClick={() => deleteChannel(channel.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
