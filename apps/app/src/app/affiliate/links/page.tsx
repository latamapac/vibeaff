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

type LinkItem = {
  id: string;
  trackingCode: string;
  destination: string;
  programId: string;
  label: string | null;
  tags: string[];
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  status: string;
  createdAt: string;
};

type LinkStats = {
  totalClicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
};

type SmartRule = {
  id: string;
  conditions: Record<string, string>;
  destination: string;
  priority: number;
};

type Program = { id: string; name: string };

export default function AffiliateLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<Record<string, LinkStats>>({});
  const [showUtm, setShowUtm] = useState(false);
  const [qrOpen, setQrOpen] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState<string | null>(null);
  const [rulesData, setRulesData] = useState<Record<string, SmartRule[]>>({});
  const [ruleForm, setRuleForm] = useState({ device: "", os: "", country: "", destination: "" });

  // Form state
  const [formProgramId, setFormProgramId] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formUtmSource, setFormUtmSource] = useState("");
  const [formUtmMedium, setFormUtmMedium] = useState("");
  const [formUtmCampaign, setFormUtmCampaign] = useState("");
  const [formUtmContent, setFormUtmContent] = useState("");
  const [formUtmTerm, setFormUtmTerm] = useState("");

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchLinks = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}/links`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLinks((Array.isArray(data) ? data : []).filter((l: LinkItem) => l.status !== "archived"));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [affiliateId]);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/programs`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPrograms(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchLinks(); fetchPrograms(); }, [fetchLinks, fetchPrograms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateId) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = { programId: formProgramId, destinationUrl: formUrl, affiliateId };
      if (formLabel) body.label = formLabel;
      if (formUtmSource) body.utmSource = formUtmSource;
      if (formUtmMedium) body.utmMedium = formUtmMedium;
      if (formUtmCampaign) body.utmCampaign = formUtmCampaign;
      if (formUtmContent) body.utmContent = formUtmContent;
      if (formUtmTerm) body.utmTerm = formUtmTerm;

      const res = await fetch(`${API_URL}/v1/links`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreate(false);
        setFormProgramId(""); setFormUrl(""); setFormLabel("");
        setFormUtmSource(""); setFormUtmMedium(""); setFormUtmCampaign("");
        setFormUtmContent(""); setFormUtmTerm("");
        setShowUtm(false);
        await fetchLinks();
      }
    } catch { /* ignore */ } finally { setCreating(false); }
  };

  const archiveLink = async (id: string) => {
    try {
      await fetch(`${API_URL}/v1/links/${id}`, { method: "DELETE", headers: authHeaders() });
      await fetchLinks();
    } catch { /* ignore */ }
  };

  const loadStats = async (id: string) => {
    if (statsOpen === id) { setStatsOpen(null); return; }
    setStatsOpen(id);
    if (statsData[id]) return;
    try {
      const res = await fetch(`${API_URL}/v1/links/${id}/stats`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStatsData((prev) => ({ ...prev, [id]: data }));
      }
    } catch { /* ignore */ }
  };

  const loadRules = async (linkId: string) => {
    if (rulesOpen === linkId) { setRulesOpen(null); return; }
    setRulesOpen(linkId);
    if (rulesData[linkId]) return;
    try {
      const res = await fetch(`${API_URL}/v1/links/${linkId}/smart-rules`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRulesData((prev) => ({ ...prev, [linkId]: data }));
      }
    } catch { /* ignore */ }
  };

  const addRule = async (linkId: string) => {
    if (!ruleForm.destination) return;
    const conditions: Record<string, string> = {};
    if (ruleForm.device) conditions.device = ruleForm.device;
    if (ruleForm.os) conditions.os = ruleForm.os;
    if (ruleForm.country) conditions.country = ruleForm.country;
    if (Object.keys(conditions).length === 0) return;

    await fetch(`${API_URL}/v1/links/${linkId}/smart-rules`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ conditions, destination: ruleForm.destination, priority: (rulesData[linkId]?.length ?? 0) + 1 }),
    });
    setRuleForm({ device: "", os: "", country: "", destination: "" });
    setRulesData((prev) => ({ ...prev, [linkId]: undefined as unknown as SmartRule[] }));
    loadRules(linkId);
  };

  const deleteRule = async (ruleId: string, linkId: string) => {
    await fetch(`${API_URL}/v1/smart-rules/${ruleId}`, { method: "DELETE", headers: authHeaders() });
    setRulesData((prev) => ({ ...prev, [linkId]: prev[linkId]?.filter((r) => r.id !== ruleId) }));
  };

  const copyLink = (code: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
    navigator.clipboard.writeText(`${baseUrl}/t/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tracking Links</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
          {showCreate ? "Cancel" : "Create link"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h2 className="section-header">New tracking link</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Program</label>
              <select value={formProgramId} onChange={(e) => setFormProgramId(e.target.value)} required className="input">
                <option value="">Select a program...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id.slice(0, 8)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Label (optional)</label>
              <input type="text" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="e.g. Homepage CTA" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Destination URL</label>
            <input type="url" required value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://merchant.com/product" className="input" />
          </div>

          <button type="button" onClick={() => setShowUtm(!showUtm)} className="text-xs text-[#D7FF3B] hover:underline">
            {showUtm ? "Hide" : "Show"} UTM parameters
          </button>

          {showUtm && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[#8B8B9E] mb-1">utm_source</label>
                <input type="text" value={formUtmSource} onChange={(e) => setFormUtmSource(e.target.value)} placeholder="google" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B8B9E] mb-1">utm_medium</label>
                <input type="text" value={formUtmMedium} onChange={(e) => setFormUtmMedium(e.target.value)} placeholder="cpc" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B8B9E] mb-1">utm_campaign</label>
                <input type="text" value={formUtmCampaign} onChange={(e) => setFormUtmCampaign(e.target.value)} placeholder="spring_sale" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B8B9E] mb-1">utm_content</label>
                <input type="text" value={formUtmContent} onChange={(e) => setFormUtmContent(e.target.value)} placeholder="banner_ad" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B8B9E] mb-1">utm_term</label>
                <input type="text" value={formUtmTerm} onChange={(e) => setFormUtmTerm(e.target.value)} placeholder="running shoes" className="input" />
              </div>
            </div>
          )}

          <button type="submit" disabled={creating} className="btn-primary text-sm w-full disabled:opacity-50">
            {creating ? "Creating..." : "Create tracking link"}
          </button>
        </form>
      )}

      <div className="glass-card p-6">
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : links.length === 0 ? (
            <p className="text-[#8B8B9E] text-center py-8">No tracking links yet. Create your first one above.</p>
          ) : (
            links.map((link) => (
              <div key={link.id} className="space-y-0">
                <div className="table-row flex-col !items-start gap-2 sm:flex-row sm:!items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {link.label && <span className="text-sm font-medium text-[#F6F6F7]">{link.label}</span>}
                      <code className="text-[#D7FF3B] text-sm font-mono">/t/{link.trackingCode}</code>
                      <button onClick={() => copyLink(link.trackingCode)} className="text-[#8B8B9E] hover:text-[#F6F6F7] transition-colors" title="Copy link">
                        {copied === link.trackingCode ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        )}
                      </button>
                      {link.status === "paused" && <span className="badge badge-warning">paused</span>}
                    </div>
                    <p className="text-xs text-[#8B8B9E] mt-1 truncate">{link.destination}</p>
                    {link.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {link.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#8B8B9E]">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQrOpen(qrOpen === link.id ? null : link.id)} className="btn-secondary text-xs">QR</button>
                    <button onClick={() => loadRules(link.id)} className="btn-secondary text-xs">
                      {rulesOpen === link.id ? "Hide Rules" : "Smart Rules"}
                    </button>
                    <button onClick={() => loadStats(link.id)} className="btn-secondary text-xs">
                      {statsOpen === link.id ? "Hide" : "Stats"}
                    </button>
                    <button onClick={() => archiveLink(link.id)} className="btn-danger text-xs">Archive</button>
                    <span className="text-xs text-[#8B8B9E]">{new Date(link.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {qrOpen === link.id && (
                  <div className="px-4 pb-3 pt-1 flex justify-center">
                    <img
                      src={`${API_URL}/v1/links/${link.id}/qr?size=200`}
                      alt="QR Code"
                      className="w-[200px] h-[200px] rounded-lg"
                    />
                  </div>
                )}

                {statsOpen === link.id && statsData[link.id] && (
                  <div className="grid grid-cols-4 gap-3 px-4 pb-3 pt-1">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{statsData[link.id].totalClicks}</div>
                      <div className="text-[10px] text-[#8B8B9E] uppercase">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{statsData[link.id].conversions}</div>
                      <div className="text-[10px] text-[#8B8B9E] uppercase">Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-[#D7FF3B]">${statsData[link.id].revenue.toFixed(2)}</div>
                      <div className="text-[10px] text-[#8B8B9E] uppercase">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{statsData[link.id].conversionRate}%</div>
                      <div className="text-[10px] text-[#8B8B9E] uppercase">Conv rate</div>
                    </div>
                  </div>
                )}

                {rulesOpen === link.id && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-[#8B8B9E]">Route visitors to different destinations based on device, OS, or country.</p>
                    {(rulesData[link.id] ?? []).map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between text-xs bg-white/[0.03] rounded-lg px-3 py-2">
                        <div className="flex gap-2">
                          {Object.entries(rule.conditions).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-[#D7FF3B]/10 text-[#D7FF3B]">{k}: {v}</span>
                          ))}
                          <span className="text-[#8B8B9E]">&rarr; {rule.destination}</span>
                        </div>
                        <button onClick={() => deleteRule(rule.id, link.id)} className="text-red-400 hover:text-red-300">Remove</button>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 items-end">
                      <select value={ruleForm.device} onChange={(e) => setRuleForm({ ...ruleForm, device: e.target.value })} className="input !w-auto text-xs">
                        <option value="">Device</option>
                        <option value="mobile">Mobile</option>
                        <option value="desktop">Desktop</option>
                      </select>
                      <select value={ruleForm.os} onChange={(e) => setRuleForm({ ...ruleForm, os: e.target.value })} className="input !w-auto text-xs">
                        <option value="">OS</option>
                        <option value="ios">iOS</option>
                        <option value="android">Android</option>
                        <option value="windows">Windows</option>
                        <option value="macos">macOS</option>
                      </select>
                      <input value={ruleForm.country} onChange={(e) => setRuleForm({ ...ruleForm, country: e.target.value })} placeholder="Country (US)" className="input !w-20 text-xs" />
                      <input value={ruleForm.destination} onChange={(e) => setRuleForm({ ...ruleForm, destination: e.target.value })} placeholder="https://..." className="input flex-1 text-xs" />
                      <button onClick={() => addRule(link.id)} className="btn-primary text-xs">Add Rule</button>
                    </div>
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
