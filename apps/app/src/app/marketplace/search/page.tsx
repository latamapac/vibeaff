"use client";

import { useState, useEffect, useCallback } from "react";
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

type Category = { id: string; name: string; slug: string; _count: { listings: number } };

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function MarketplaceSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/v1/marketplace/categories`)
      .then((r) => r.ok ? r.json() : [])
      .then(setCategories);
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      let url: string;
      if (query.trim()) {
        url = `${API_URL}/v1/marketplace/search?q=${encodeURIComponent(query)}`;
      } else {
        url = `${API_URL}/v1/marketplace/listings?limit=50`;
      }
      if (selectedCategory) url += `&categorySlug=${selectedCategory}`;
      const res = await fetch(url);
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [query, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Search Programs</h1>

      <div className="flex gap-3">
        <input
          className="input flex-1"
          placeholder="Search programs, merchants..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <select
          className="input !w-auto"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name} ({c._count.listings})</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : results.length === 0 ? (
          <p className="text-[#8B8B9E] text-center py-12">
            {query ? "No programs found. Try different keywords." : "No programs available."}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {results.map((l) => (
              <Link key={l.id} href={`/marketplace/programs/${l.id}`} className="glass-card p-5 hover:border-white/10 transition group block">
                <div className="flex items-start gap-4">
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
                    <p className="text-xs text-[#8B8B9E] mt-0.5">{l.merchant.name} &middot; {l.category.name}</p>
                    <p className="text-xs text-[#8B8B9E] mt-1 line-clamp-2">{l.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-[#D7FF3B] font-semibold">{l.commissionDisplay}</span>
                      <span className="text-[#8B8B9E]">{l.cookieWindowDays}d cookie</span>
                      <span className="text-[#8B8B9E]">{l._count.reviews} reviews</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
