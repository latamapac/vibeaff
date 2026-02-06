"use client";

import { useState, useEffect } from "react";
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
  featured: boolean;
  verified: boolean;
  category: { name: string; slug: string };
  merchant: { name: string };
  _count: { reviews: number };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { listings: number };
};

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/marketplace/programs/${listing.id}`} className="glass-card p-5 hover:border-white/10 transition group block">
      <div className="flex items-start gap-4">
        {listing.logoUrl ? (
          <img src={listing.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D7FF3B]/20 to-[#6B2B8C]/20 flex items-center justify-center text-lg font-bold text-[#D7FF3B]">
            {listing.title[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm group-hover:text-[#D7FF3B] transition truncate">{listing.title}</h3>
            {listing.verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D7FF3B]/10 text-[#D7FF3B]">Verified</span>}
            {listing.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">Featured</span>}
          </div>
          <p className="text-xs text-[#8B8B9E] mt-0.5">{listing.merchant.name}</p>
          <p className="text-xs text-[#8B8B9E] mt-1 line-clamp-2">{listing.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06] text-xs">
        <span className="text-[#D7FF3B] font-semibold">{listing.commissionDisplay}</span>
        <span className="text-[#8B8B9E]">{listing.cookieWindowDays}d cookie</span>
        <span className="text-[#8B8B9E]">{listing.category.name}</span>
        <span className="text-[#8B8B9E] ml-auto">{listing._count.reviews} reviews</span>
      </div>
    </Link>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function MarketplacePage() {
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [trending, setTrending] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/v1/marketplace/featured`).then((r) => r.ok ? r.json() : []),
      fetch(`${API_URL}/v1/marketplace/trending`).then((r) => r.ok ? r.json() : []),
      fetch(`${API_URL}/v1/marketplace/categories`).then((r) => r.ok ? r.json() : []),
    ]).then(([f, t, c]) => {
      setFeatured(f);
      setTrending(t);
      setCategories(c);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center py-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Discover <span className="text-[#D7FF3B]">Affiliate Programs</span>
        </h1>
        <p className="text-[#8B8B9E] mt-3 max-w-xl mx-auto">
          Browse top merchant programs, compare commissions, and start earning. Join programs that match your audience.
        </p>
        <div className="mt-6 max-w-md mx-auto">
          <Link href="/marketplace/search" className="input block text-center !py-3 text-[#8B8B9E] hover:border-white/20 transition">
            Search programs, merchants, categories...
          </Link>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/marketplace/categories/${cat.slug}`}
                className="glass-card p-4 hover:border-white/10 transition group"
              >
                <h3 className="font-medium text-sm group-hover:text-[#D7FF3B] transition">{cat.name}</h3>
                <p className="text-xs text-[#8B8B9E] mt-1">{cat._count.listings} programs</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Featured Programs</h2>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-[#8B8B9E] text-center py-8">No featured programs yet</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Trending</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}
    </div>
  );
}
