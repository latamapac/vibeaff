"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vibeaff_token");
}
function authHeaders(): Record<string, string> {
  const token = getToken();
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  affiliate: { displayName: string };
  createdAt: string;
};

type ListingDetail = {
  id: string;
  title: string;
  description: string;
  longDescription: string | null;
  commissionDisplay: string;
  cookieWindowDays: number;
  tags: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
  featured: boolean;
  verified: boolean;
  avgEpc: number | null;
  avgConversionRate: number | null;
  payoutFrequency: string | null;
  minPayout: number | null;
  supportedRegions: string[];
  supportedChannels: string[];
  avgRating: number | null;
  category: { name: string; slug: string };
  merchant: { name: string; website: string };
  program: { name: string; attributionWindowDays: number; approvalMode: string };
  reviews: Review[];
  _count: { reviews: number };
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? "text-[#D7FF3B]" : "text-[#8B8B9E]/30"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProgramDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const affiliateId = typeof window !== "undefined" ? localStorage.getItem("vibeaff_affiliate_id") : null;

  useEffect(() => {
    fetch(`${API_URL}/v1/marketplace/listings/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setListing(data); })
      .finally(() => setLoading(false));
  }, [id]);

  const apply = async () => {
    if (!affiliateId || !listing) return;
    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/v1/marketplace/listings/${listing.id}/apply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ affiliateId }),
      });
      if (res.ok || res.status === 409) setApplied(true);
    } catch { /* ignore */ } finally { setApplying(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-48 w-full rounded-xl" />
        <div className="skeleton h-8 w-1/2" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  if (!listing) {
    return <p className="text-[#8B8B9E] text-center py-16">Listing not found</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/marketplace" className="text-xs text-[#8B8B9E] hover:text-[#F6F6F7]">&larr; Back to Marketplace</Link>

      {/* Banner */}
      {listing.bannerUrl && (
        <div className="h-48 rounded-xl overflow-hidden">
          <img src={listing.bannerUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-6">
        {listing.logoUrl ? (
          <img src={listing.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#D7FF3B]/20 to-[#6B2B8C]/20 flex items-center justify-center text-2xl font-bold text-[#D7FF3B]">
            {listing.title[0]}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            {listing.verified && <span className="badge badge-success">Verified</span>}
          </div>
          <p className="text-[#8B8B9E] mt-1">{listing.merchant.name}</p>
          {listing.avgRating && (
            <div className="flex items-center gap-2 mt-2">
              <Stars rating={Math.round(listing.avgRating)} />
              <span className="text-xs text-[#8B8B9E]">{listing.avgRating.toFixed(1)} ({listing._count.reviews} reviews)</span>
            </div>
          )}
        </div>
        <button
          onClick={apply}
          disabled={applying || applied || !affiliateId}
          className="btn-primary"
        >
          {applied ? "Applied!" : applying ? "Applying..." : "Join Program"}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-[#8B8B9E]">Commission</p>
          <p className="text-lg font-semibold text-[#D7FF3B] mt-1">{listing.commissionDisplay}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-[#8B8B9E]">Cookie Window</p>
          <p className="text-lg font-semibold mt-1">{listing.cookieWindowDays} days</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-[#8B8B9E]">Avg EPC</p>
          <p className="text-lg font-semibold mt-1">{listing.avgEpc ? `$${listing.avgEpc.toFixed(2)}` : "N/A"}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-[#8B8B9E]">Conv Rate</p>
          <p className="text-lg font-semibold mt-1">{listing.avgConversionRate ? `${listing.avgConversionRate.toFixed(1)}%` : "N/A"}</p>
        </div>
      </div>

      {/* Description */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold mb-3">About</h2>
            <p className="text-sm text-[#8B8B9E] leading-relaxed">{listing.longDescription ?? listing.description}</p>
          </div>

          {/* Reviews */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold mb-4">Reviews ({listing._count.reviews})</h2>
            {listing.reviews.length === 0 ? (
              <p className="text-xs text-[#8B8B9E]">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {listing.reviews.map((r) => (
                  <div key={r.id} className="border-b border-white/[0.06] pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <Stars rating={r.rating} />
                      <span className="text-xs font-medium">{r.affiliate.displayName}</span>
                      <span className="text-xs text-[#8B8B9E]">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.title && <p className="text-sm font-medium mt-2">{r.title}</p>}
                    {r.body && <p className="text-xs text-[#8B8B9E] mt-1">{r.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase text-[#8B8B9E] tracking-wider">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8B8B9E]">Category</span>
                <Link href={`/marketplace/categories/${listing.category.slug}`} className="text-[#D7FF3B] hover:underline">{listing.category.name}</Link>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B8B9E]">Approval</span>
                <span className="capitalize">{listing.program.approvalMode}</span>
              </div>
              {listing.payoutFrequency && (
                <div className="flex justify-between">
                  <span className="text-[#8B8B9E]">Payout</span>
                  <span>{listing.payoutFrequency}</span>
                </div>
              )}
              {listing.minPayout && (
                <div className="flex justify-between">
                  <span className="text-[#8B8B9E]">Min Payout</span>
                  <span>${listing.minPayout}</span>
                </div>
              )}
            </div>
          </div>

          {listing.tags.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold uppercase text-[#8B8B9E] tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-[#8B8B9E]">{t}</span>
                ))}
              </div>
            </div>
          )}

          {listing.supportedRegions.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold uppercase text-[#8B8B9E] tracking-wider mb-2">Regions</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.supportedRegions.map((r) => (
                  <span key={r} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-[#8B8B9E]">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
