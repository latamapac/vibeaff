"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Listing = {
  id: string;
  title: string;
  description: string;
  commissionDisplay: string;
  cookieWindowDays: number;
  tags: string[];
  logoUrl: string | null;
  verified: boolean;
  category: { name: string; slug: string };
  merchant: { name: string };
  _count: { reviews: number };
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/v1/marketplace/listings?categorySlug=${slug}&limit=50`)
      .then((r) => r.ok ? r.json() : [])
      .then(setListings)
      .finally(() => setLoading(false));
  }, [slug]);

  const categoryName = listings[0]?.category?.name ?? slug;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/marketplace" className="text-xs text-[#8B8B9E] hover:text-[#F6F6F7]">&larr; Back to Marketplace</Link>
        <h1 className="text-xl font-semibold mt-2">{categoryName}</h1>
        <p className="text-sm text-[#8B8B9E]">{listings.length} programs</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : listings.length === 0 ? (
        <p className="text-[#8B8B9E] text-center py-12">No programs in this category</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <Link key={l.id} href={`/marketplace/programs/${l.id}`} className="glass-card p-5 hover:border-white/10 transition group block">
              <div className="flex items-start gap-3">
                {l.logoUrl ? (
                  <img src={l.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D7FF3B]/20 to-[#6B2B8C]/20 flex items-center justify-center text-sm font-bold text-[#D7FF3B]">
                    {l.title[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm group-hover:text-[#D7FF3B] transition truncate">{l.title}</h3>
                    {l.verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D7FF3B]/10 text-[#D7FF3B]">Verified</span>}
                  </div>
                  <p className="text-xs text-[#8B8B9E] mt-0.5">{l.merchant.name}</p>
                  <p className="text-xs text-[#8B8B9E] mt-1 line-clamp-2">{l.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-[#D7FF3B] font-semibold">{l.commissionDisplay}</span>
                    <span className="text-[#8B8B9E]">{l.cookieWindowDays}d cookie</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
