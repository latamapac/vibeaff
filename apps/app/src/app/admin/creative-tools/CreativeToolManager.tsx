"use client";

import { useEffect, useMemo, useState } from "react";

type CreativeTool = {
  id: string;
  name: string;
  type: "text" | "visual" | "web" | "translation";
  status: "connected" | "ready" | "planned";
};

const typeOptions: CreativeTool["type"][] = ["text", "visual", "web", "translation"];
const statusOptions: CreativeTool["status"][] = ["connected", "ready", "planned"];

const statusBadge: Record<string, string> = {
  connected: "badge-success",
  ready: "badge-info",
  planned: "badge-neutral",
};

const fallbackTools: CreativeTool[] = [
  { id: "tool-1", name: "Copy Studio", type: "text", status: "ready" },
  { id: "tool-2", name: "Visual Studio", type: "visual", status: "planned" },
  { id: "tool-3", name: "Landing Builder", type: "web", status: "planned" },
  { id: "tool-4", name: "Translation Engine", type: "translation", status: "ready" },
];

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export default function CreativeToolManager() {
  const [tools, setTools] = useState<CreativeTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "text" as CreativeTool["type"],
    status: "planned" as CreativeTool["status"],
  });

  const apiUrl = useMemo(() => getApiUrl(), []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/v1/creative-tools`);
      if (!res.ok) {
        throw new Error("Failed to load creative tools");
      }
      const data = (await res.json()) as CreativeTool[];
      setTools(data.length ? data : fallbackTools);
    } catch (err) {
      setError((err as Error).message);
      setTools(fallbackTools);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createTool = async () => {
    setError(null);
    if (!form.name) {
      setError("Tool name is required.");
      return;
    }
    const res = await fetch(`${apiUrl}/v1/creative-tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError("Failed to create tool.");
      return;
    }
    setForm({ name: "", type: "text", status: "planned" });
    await load();
  };

  const deleteTool = async (id: string) => {
    const res = await fetch(`${apiUrl}/v1/creative-tools/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete tool.");
      return;
    }
    await load();
  };

  return (
    <section className="glass-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-header text-lg">Creative tools</h2>
        <button className="btn-primary text-xs" onClick={createTool}>
          Add tool
        </button>
      </div>
      <p className="mt-3 text-sm text-[#8B8B9E]">
        Plug in tools for text, visuals, landing pages, and translations.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <input
          className="input text-sm"
          placeholder="Tool name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <select
          className="input text-sm"
          value={form.type}
          onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as CreativeTool["type"] }))}
        >
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          className="input text-sm"
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as CreativeTool["status"] }))}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="mt-4 text-sm text-[#fca5a5]">{error}</p> : null}
      {loading ? (
        <div className="mt-4 space-y-2">
          {[1, 2].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <div key={tool.id} className="table-row">
            <div>
              <div className="text-[#F6F6F7] font-medium">{tool.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#8B8B9E]">{tool.type}</span>
                <span className={`badge text-[10px] ${statusBadge[tool.status] ?? "badge-neutral"}`}>
                  {tool.status}
                </span>
              </div>
            </div>
            <button
              className="btn-danger text-xs"
              onClick={() => deleteTool(tool.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
