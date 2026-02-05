"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vibeaff_token");
    setHasToken(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vibeaff_token");
    // Clear cookie by calling logout endpoint or setting cookie to expire
    document.cookie = "vibeaff_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  const cards = [
    {
      title: "Backoffice",
      icon: "📊",
      description: "Manage programs, payouts, channels, and compliance",
      href: "/admin",
      gradient: "from-purple-500 to-purple-700",
    },
    {
      title: "Partner Toolkit",
      icon: "🤝",
      description: "Set up programs, approve affiliates, control creatives",
      href: "/partner",
      gradient: "from-blue-500 to-blue-700",
    },
    {
      title: "Affiliate Toolkit",
      icon: "🚀",
      description: "Build audiences, select creatives, optimize traffic",
      href: "/affiliate",
      gradient: "from-pink-500 to-pink-700",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Bar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="text-2xl font-bold tracking-tight">VibeAff</div>
        {hasToken && (
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/20 px-4 py-2 text-sm transition hover:border-white/40 hover:bg-white/5"
          >
            Log out
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 pb-16">
        {/* Welcome Section */}
        <div className="mb-12 mt-8">
          {hasToken ? (
            <h1 className="text-4xl font-semibold">Welcome back</h1>
          ) : (
            <div>
              <h1 className="text-4xl font-semibold mb-4">Sign in to access your dashboard</h1>
              <Link
                href="/login"
                className="inline-block rounded-full border border-white/20 px-6 py-3 text-sm transition hover:border-white/40 hover:bg-white/5"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Three Large Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-zinc-900 p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50"
            >
              {/* Gradient Top Border */}
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${card.gradient}`} />
              
              {/* Icon */}
              <div className="mb-4 text-5xl">{card.icon}</div>
              
              {/* Title */}
              <h2 className="mb-3 text-2xl font-semibold group-hover:text-white">
                {card.title}
              </h2>
              
              {/* Description */}
              <p className="mt-auto text-sm text-zinc-400 group-hover:text-zinc-300">
                {card.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Quick Stats Strip */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 mb-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div>
              <div className="text-sm text-zinc-400">Total Programs</div>
              <div className="mt-1 text-2xl font-semibold">-</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">Active Affiliates</div>
              <div className="mt-1 text-2xl font-semibold">-</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">Monthly Revenue</div>
              <div className="mt-1 text-2xl font-semibold">-</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">Conversion Rate</div>
              <div className="mt-1 text-2xl font-semibold">-</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl border-t border-white/10 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-zinc-400">
            © {new Date().getFullYear()} VibeAff. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a
              href={process.env.NEXT_PUBLIC_LANDING_URL ?? "https://vibeaff.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              vibeaff.com
            </a>
            <a
              href="https://docs.vibeaff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              docs.vibeaff.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
