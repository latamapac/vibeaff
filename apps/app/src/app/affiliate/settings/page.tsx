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

type AffiliateProfile = {
  id: string;
  displayName: string;
  payoutMethod: string;
  walletAddress: string | null;
  createdAt: string;
};

export default function AffiliateSettingsPage() {
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<{ referredName: string; bonusPct: number; totalBonusEarned: number; joinedAt: string }[]>([]);
  const [totalBonus, setTotalBonus] = useState(0);
  const [copiedRef, setCopiedRef] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("fiat");
  const [walletAddress, setWalletAddress] = useState("");

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  const fetchProfile = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setDisplayName(data.displayName);
        setPayoutMethod(data.payoutMethod);
        setWalletAddress(data.walletAddress ?? "");
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [affiliateId]);

  const fetchReferrals = useCallback(async () => {
    if (!affiliateId) return;
    try {
      const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}/referrals`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode);
        setReferrals(data.referrals ?? []);
        setTotalBonus(data.totalBonusEarned ?? 0);
      }
    } catch { /* ignore */ }
  }, [affiliateId]);

  const generateReferralCode = async () => {
    if (!affiliateId) return;
    const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}/referral-code`, { method: "POST", headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setReferralCode(data.referralCode);
    }
  };

  const copyReferralLink = () => {
    if (referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralCode}`);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  useEffect(() => { fetchProfile(); fetchReferrals(); }, [fetchProfile, fetchReferrals]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/v1/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          displayName,
          payoutMethod,
          walletAddress: walletAddress || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.fieldErrors ? "Validation failed" : `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-full" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Settings</h1>

      <form onSubmit={handleSave} className="glass-card p-6 space-y-5">
        <h2 className="section-header">Profile</h2>

        <div>
          <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Display name</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Payout method</label>
          <select
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value)}
            className="input"
          >
            <option value="fiat">Fiat (Bank transfer)</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>

        {payoutMethod === "crypto" && (
          <div>
            <label className="block text-xs font-medium text-[#8B8B9E] mb-1.5">Wallet address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="input font-mono"
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {saved && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            Profile updated successfully
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary text-sm w-full disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {profile && (
        <div className="glass-card p-6">
          <h2 className="section-header mb-4">Account info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8B8B9E]">Affiliate ID</span>
              <code className="text-[#D7FF3B] font-mono text-xs">{profile.id}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B8B9E]">Member since</span>
              <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Referral Program */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="section-header">Referral Program</h2>
        <p className="text-xs text-[#8B8B9E]">Invite other affiliates and earn 5% of their commissions.</p>

        {referralCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-black/30 px-3 py-2 rounded flex-1">{referralCode}</code>
              <button onClick={copyReferralLink} className="btn-primary text-xs">
                {copiedRef ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{referrals.length}</div>
                <div className="text-[10px] text-[#8B8B9E] uppercase">Referrals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-[#D7FF3B]">${totalBonus.toFixed(2)}</div>
                <div className="text-[10px] text-[#8B8B9E] uppercase">Bonus Earned</div>
              </div>
            </div>
            {referrals.length > 0 && (
              <div className="space-y-2 mt-2">
                {referrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white/[0.03] rounded-lg px-3 py-2">
                    <span>{r.referredName}</span>
                    <span className="text-[#8B8B9E]">{r.bonusPct}% bonus</span>
                    <span className="text-[#D7FF3B]">${r.totalBonusEarned.toFixed(2)}</span>
                    <span className="text-[#8B8B9E]">{new Date(r.joinedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={generateReferralCode} className="btn-primary text-sm">
            Generate Referral Code
          </button>
        )}
      </div>
    </>
  );
}
