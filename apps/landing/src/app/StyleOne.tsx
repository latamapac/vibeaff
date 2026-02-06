"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.vibeaff.com";

export default function StyleOne() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [showDemo, setShowDemo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sections = document.querySelectorAll("[data-section]");

    sections.forEach((section) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("data-section");
              if (id) {
                setVisibleSections((prev) => new Set(prev).add(id));
              }
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
      );

      observer.observe(section);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const socialProofLetters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Floating Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob blob-1 absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <div className="blob blob-2 absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="blob blob-3 absolute w-[550px] h-[550px] rounded-full blur-[120px] opacity-20 bg-gradient-to-r from-orange-500 to-pink-500"></div>
        <div className="blob blob-4 absolute w-[450px] h-[450px] rounded-full blur-[120px] opacity-25 bg-gradient-to-r from-blue-500 to-orange-500"></div>
      </div>

      <div className="fixed inset-0 bg-gradient-hero z-0 pointer-events-none"></div>

      <div className="relative z-10">
        <header className="border-b border-white/10 backdrop-blur-sm bg-[#0a0a0a]/80 sticky top-0 z-50">
          <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              VibeAff
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="hover:text-purple-400 transition-colors">How it works</Link>
              <Link href="#benefits" className="hover:text-purple-400 transition-colors">Benefits</Link>
              <Link href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</Link>
              <Link href="https://docs.vibeaff.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Developers</Link>
              <Link href="https://app.vibeaff.com" target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium">Launch App</Link>
            </div>
            <button className="md:hidden flex flex-col justify-center items-center gap-1.5 w-10 h-10 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen((prev) => !prev)} aria-label="Toggle menu">
              <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
          </nav>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm px-6 py-4 space-y-3">
              <Link href="#how-it-works" className="block py-2 hover:text-purple-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>How it works</Link>
              <Link href="#benefits" className="block py-2 hover:text-purple-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>Benefits</Link>
              <Link href="#pricing" className="block py-2 hover:text-purple-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="https://docs.vibeaff.com" target="_blank" rel="noopener noreferrer" className="block py-2 hover:text-purple-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>Developers</Link>
              <Link href="https://app.vibeaff.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium" onClick={() => setMobileMenuOpen(false)}>Launch App</Link>
            </div>
          )}
        </header>

        <section className="container mx-auto px-6 py-32 text-center relative z-10">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 max-w-5xl mx-auto leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 via-orange-400 to-blue-400 bg-clip-text text-transparent animate-gradient">Affiliate marketing, democratized.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">Launch affiliate programs fast, generate channel-specific creatives, and pay only for verified sales.</p>
          <div className="flex gap-6 justify-center mb-16">
            <Link href="https://app.vibeaff.com/register" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all font-semibold text-lg transform hover:scale-105">Get started free</Link>
            <button className="px-8 py-4 border-2 border-purple-500/50 rounded-xl hover:bg-purple-500/10 transition-all font-semibold text-lg" onClick={() => setShowDemo(true)}>Watch demo</button>
          </div>
          <div className="flex flex-wrap justify-center gap-12 md:gap-16">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">10K+</div>
              <div className="text-gray-400">Affiliates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-gray-400">Merchants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mb-2">$2M+</div>
              <div className="text-gray-400">Payouts</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" data-section="how-it-works" className={`container mx-auto px-6 py-24 transition-all duration-1000 ${visibleSections.has("how-it-works") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16"><span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">How it works</span></h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: "🚀", color: "purple", title: "Set up your program", desc: "Configure your affiliate program with custom commission rates and tracking parameters." },
              { emoji: "🎯", color: "blue", title: "Target affiliates", desc: "Use data-backed targeting to find and recruit the right affiliates for your brand." },
              { emoji: "🎨", color: "pink", title: "Generate creatives", desc: "Create channel-specific marketing materials tailored to each affiliate\u2019s audience." },
              { emoji: "💰", color: "orange", title: "Track & pay", desc: "Monitor performance in real-time and pay only for verified sales with automated payouts." },
            ].map((step, i) => (
              <div key={i} className={`group relative rounded-2xl p-8 bg-gradient-to-br from-${step.color}-500/10 to-transparent border-t-4 border-${step.color}-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-${step.color}-500/20 transition-all duration-300`}>
                <div className="text-6xl mb-4">{step.emoji}</div>
                <div className={`text-2xl font-bold mb-2 text-${step.color}-400`}>{i + 1}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-section="wizard" className={`container mx-auto px-6 py-24 transition-all duration-1000 ${visibleSections.has("wizard") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16"><span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Get started in 3 clicks</span></h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 -z-10"></div>
            {[{ label: "Sign up", colors: "from-purple-500 to-pink-500", shadow: "shadow-purple-500/50" }, { label: "Configure", colors: "from-pink-500 to-orange-500", shadow: "shadow-pink-500/50" }, { label: "Launch", colors: "from-orange-500 to-blue-500", shadow: "shadow-orange-500/50" }].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${s.colors} flex items-center justify-center text-3xl font-bold mb-4 shadow-lg ${s.shadow}`}>{i + 1}</div>
                <div className="text-lg font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="benefits" data-section="benefits" className={`container mx-auto px-6 py-24 transition-all duration-1000 ${visibleSections.has("benefits") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16"><span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Built for every role</span></h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Merchants", color: "purple", desc: "Launch and manage affiliate programs effortlessly. Get insights into performance, optimize campaigns, and scale your revenue.", items: ["Program management dashboard", "Performance analytics", "Automated payouts"] },
              { title: "Affiliates", color: "blue", desc: "Discover opportunities, access marketing materials, and track your earnings all in one place.", items: ["Program discovery", "Creative asset library", "Earnings dashboard"] },
              { title: "Operations", color: "orange", desc: "Streamline affiliate operations with automated workflows, fraud detection, and comprehensive reporting.", items: ["Automated workflows", "Fraud detection", "Comprehensive reporting"] },
            ].map((role, i) => (
              <div key={i} className={`relative rounded-2xl p-8 bg-gradient-to-br from-${role.color}-500/10 via-transparent to-transparent border-l-4 border-${role.color}-500`}>
                <h3 className={`text-2xl font-semibold mb-4 text-${role.color}-400`}>{role.title}</h3>
                <p className="text-gray-400 mb-6">{role.desc}</p>
                <ul className="space-y-3 text-gray-300">{role.items.map((item, j) => <li key={j}>• {item}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" data-section="pricing" className={`container mx-auto px-6 py-24 transition-all duration-1000 ${visibleSections.has("pricing") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16"><span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Pricing</span></h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-zinc-900/50 to-transparent border border-white/10">
              <h3 className="text-2xl font-semibold mb-2">Starter</h3>
              <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">3%</div>
              <p className="text-gray-400 mb-6">Perfect for getting started with affiliate marketing.</p>
              <ul className="space-y-3 text-gray-300 mb-8"><li>• Basic program setup</li><li>• Standard tracking</li><li>• Email support</li></ul>
              <Link href={`${appUrl}/register`} target="_blank" rel="noopener noreferrer" className="block w-full px-6 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors font-semibold text-center">Get started</Link>
            </div>
            <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
              <div className="bg-[#0a0a0a] rounded-2xl p-8 h-full">
                <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold">Popular</div>
                <h3 className="text-2xl font-semibold mb-2">Growth</h3>
                <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Custom</div>
                <p className="text-gray-400 mb-6">Scale your affiliate program with advanced features.</p>
                <ul className="space-y-3 text-gray-300 mb-8"><li>• Advanced targeting</li><li>• Custom creatives</li><li>• Priority support</li></ul>
                <a href="mailto:sales@vibeaff.com" className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold text-center">Contact sales</a>
              </div>
            </div>
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-zinc-900/50 to-transparent border border-white/10">
              <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
              <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">Custom</div>
              <p className="text-gray-400 mb-6">Enterprise-grade solutions for large organizations.</p>
              <ul className="space-y-3 text-gray-300 mb-8"><li>• Dedicated account manager</li><li>• Custom integrations</li><li>• 24/7 support</li></ul>
              <a href="mailto:sales@vibeaff.com" className="block w-full px-6 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors font-semibold text-center">Contact sales</a>
            </div>
          </div>
        </section>

        <section data-section="social-proof" className={`container mx-auto px-6 py-24 transition-all duration-1000 ${visibleSections.has("social-proof") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-300">Trusted by teams worldwide</h2>
          <div className="flex justify-center gap-8 mb-16 flex-wrap">
            {socialProofLetters.map((letter) => (
              <div key={letter} className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-2xl font-bold text-purple-300">{letter}</div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl md:text-2xl text-gray-300 italic mb-4">&quot;VibeAff transformed our affiliate program. We saw a 300% increase in conversions within the first month.&quot;</p>
            <p className="text-gray-400">&mdash; Sarah Chen, Marketing Director at TechCorp</p>
          </div>
        </section>

        <footer className="border-t-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-border mt-24">
          <div className="border-t-2 border-transparent bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-orange-500/50">
            <div className="container mx-auto px-6 py-12 bg-[#0a0a0a]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-gray-400">&copy; 2026 VibeAff. All rights reserved.</p>
                <div className="flex gap-6 flex-wrap justify-center">
                  <Link href="#how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors">How it works</Link>
                  <Link href="#benefits" className="text-gray-400 hover:text-purple-400 transition-colors">Benefits</Link>
                  <Link href="#pricing" className="text-gray-400 hover:text-purple-400 transition-colors">Pricing</Link>
                  <Link href="https://docs.vibeaff.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">Developers</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {showDemo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowDemo(false)}>
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors" onClick={() => setShowDemo(false)} aria-label="Close">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">See VibeAff in action</h2>
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-800 border border-white/5">
              <svg className="h-16 w-16 text-zinc-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <p className="mt-4 text-center text-sm text-zinc-400">Coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
