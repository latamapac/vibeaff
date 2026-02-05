"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Floating Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob blob-1 absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <div className="blob blob-2 absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="blob blob-3 absolute w-[550px] h-[550px] rounded-full blur-[120px] opacity-20 bg-gradient-to-r from-orange-500 to-pink-500"></div>
        <div className="blob blob-4 absolute w-[450px] h-[450px] rounded-full blur-[120px] opacity-25 bg-gradient-to-r from-blue-500 to-orange-500"></div>
      </div>

      {/* Animated Gradient Hero Background */}
      <div className="fixed inset-0 bg-gradient-hero z-0 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm bg-[#0a0a0a]/80 sticky top-0 z-50">
          <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              VibeAff
            </Link>
            <div className="flex items-center gap-8">
              <Link href="#how-it-works" className="hover:text-purple-400 transition-colors">
                How it works
              </Link>
              <Link href="#benefits" className="hover:text-purple-400 transition-colors">
                Benefits
              </Link>
              <Link href="#pricing" className="hover:text-purple-400 transition-colors">
                Pricing
              </Link>
              <Link
                href="https://docs.vibeaff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-400 transition-colors"
              >
                Developers
              </Link>
              <Link
                href="https://app.vibeaff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium"
              >
                Launch App
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-32 text-center relative z-10">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 max-w-5xl mx-auto leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 via-orange-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              Affiliate marketing, democratized.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Launch affiliate programs fast, generate channel-specific creatives, and pay only for verified sales.
          </p>
          <div className="flex gap-6 justify-center mb-16">
            <Link
              href="https://app.vibeaff.com/register"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all font-semibold text-lg transform hover:scale-105"
            >
              Get started free
            </Link>
            <button className="px-8 py-4 border-2 border-purple-500/50 rounded-xl hover:bg-purple-500/10 transition-all font-semibold text-lg">
              Watch demo
            </button>
          </div>
          
          {/* Animated Counters */}
          <div className="flex flex-wrap justify-center gap-12 md:gap-16">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                10K+
              </div>
              <div className="text-gray-400">Affiliates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <div className="text-gray-400">Merchants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mb-2">
                $2M+
              </div>
              <div className="text-gray-400">Payouts</div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section
          id="how-it-works"
          data-section="how-it-works"
          className={`container mx-auto px-6 py-24 transition-all duration-1000 ${
            visibleSections.has("how-it-works")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              How it works
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative rounded-2xl p-8 bg-gradient-to-br from-purple-500/10 to-transparent border-t-4 border-purple-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <div className="text-6xl mb-4">🚀</div>
              <div className="text-2xl font-bold mb-2 text-purple-400">1</div>
              <h3 className="text-xl font-semibold mb-3">Set up your program</h3>
              <p className="text-gray-400">
                Configure your affiliate program with custom commission rates and tracking parameters.
              </p>
            </div>
            <div className="group relative rounded-2xl p-8 bg-gradient-to-br from-blue-500/10 to-transparent border-t-4 border-blue-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-2xl font-bold mb-2 text-blue-400">2</div>
              <h3 className="text-xl font-semibold mb-3">Target affiliates</h3>
              <p className="text-gray-400">
                Use data-backed targeting to find and recruit the right affiliates for your brand.
              </p>
            </div>
            <div className="group relative rounded-2xl p-8 bg-gradient-to-br from-pink-500/10 to-transparent border-t-4 border-pink-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300">
              <div className="text-6xl mb-4">🎨</div>
              <div className="text-2xl font-bold mb-2 text-pink-400">3</div>
              <h3 className="text-xl font-semibold mb-3">Generate creatives</h3>
              <p className="text-gray-400">
                Create channel-specific marketing materials tailored to each affiliate&apos;s audience.
              </p>
            </div>
            <div className="group relative rounded-2xl p-8 bg-gradient-to-br from-orange-500/10 to-transparent border-t-4 border-orange-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
              <div className="text-6xl mb-4">💰</div>
              <div className="text-2xl font-bold mb-2 text-orange-400">4</div>
              <h3 className="text-xl font-semibold mb-3">Track & pay</h3>
              <p className="text-gray-400">
                Monitor performance in real-time and pay only for verified sales with automated payouts.
              </p>
            </div>
          </div>
        </section>

        {/* Wizard Section */}
        <section
          data-section="wizard"
          className={`container mx-auto px-6 py-24 transition-all duration-1000 ${
            visibleSections.has("wizard")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Get started in 3 clicks
            </span>
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 max-w-4xl mx-auto relative">
            {/* Connecting Gradient Line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 -z-10"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-purple-500/50">
                1
              </div>
              <div className="text-lg font-semibold">Sign up</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-pink-500/50">
                2
              </div>
              <div className="text-lg font-semibold">Configure</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-500 to-blue-500 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-orange-500/50">
                3
              </div>
              <div className="text-lg font-semibold">Launch</div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section
          id="benefits"
          data-section="benefits"
          className={`container mx-auto px-6 py-24 transition-all duration-1000 ${
            visibleSections.has("benefits")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Built for every role
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent border-l-4 border-purple-500">
              <h3 className="text-2xl font-semibold mb-4 text-purple-400">Merchants</h3>
              <p className="text-gray-400 mb-6">
                Launch and manage affiliate programs effortlessly. Get insights into performance, optimize campaigns, and scale your revenue.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li>• Program management dashboard</li>
                <li>• Performance analytics</li>
                <li>• Automated payouts</li>
              </ul>
            </div>
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border-l-4 border-blue-500">
              <h3 className="text-2xl font-semibold mb-4 text-blue-400">Affiliates</h3>
              <p className="text-gray-400 mb-6">
                Discover opportunities, access marketing materials, and track your earnings all in one place.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li>• Program discovery</li>
                <li>• Creative asset library</li>
                <li>• Earnings dashboard</li>
              </ul>
            </div>
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent border-l-4 border-orange-500">
              <h3 className="text-2xl font-semibold mb-4 text-orange-400">Operations</h3>
              <p className="text-gray-400 mb-6">
                Streamline affiliate operations with automated workflows, fraud detection, and comprehensive reporting.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li>• Automated workflows</li>
                <li>• Fraud detection</li>
                <li>• Comprehensive reporting</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          data-section="pricing"
          className={`container mx-auto px-6 py-24 transition-all duration-1000 ${
            visibleSections.has("pricing")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-zinc-900/50 to-transparent border border-white/10">
              <h3 className="text-2xl font-semibold mb-2">Starter</h3>
              <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                3%
              </div>
              <p className="text-gray-400 mb-6">Perfect for getting started with affiliate marketing.</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li>• Basic program setup</li>
                <li>• Standard tracking</li>
                <li>• Email support</li>
              </ul>
              <button className="w-full px-6 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors font-semibold">
                Get started
              </button>
            </div>
            <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
              <div className="bg-[#0a0a0a] rounded-2xl p-8 h-full">
                <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold">
                  Popular
                </div>
                <h3 className="text-2xl font-semibold mb-2">Growth</h3>
                <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Custom
                </div>
                <p className="text-gray-400 mb-6">Scale your affiliate program with advanced features.</p>
                <ul className="space-y-3 text-gray-300 mb-8">
                  <li>• Advanced targeting</li>
                  <li>• Custom creatives</li>
                  <li>• Priority support</li>
                </ul>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold">
                  Contact sales
                </button>
              </div>
            </div>
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-zinc-900/50 to-transparent border border-white/10">
              <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
              <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                Custom
              </div>
              <p className="text-gray-400 mb-6">Enterprise-grade solutions for large organizations.</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li>• Dedicated account manager</li>
                <li>• Custom integrations</li>
                <li>• 24/7 support</li>
              </ul>
              <button className="w-full px-6 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors font-semibold">
                Contact sales
              </button>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section
          data-section="social-proof"
          className={`container mx-auto px-6 py-24 transition-all duration-1000 ${
            visibleSections.has("social-proof")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-300">
            Trusted by teams worldwide
          </h2>
          <div className="flex justify-center gap-8 mb-16 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-2xl font-bold"
              >
                {i}
              </div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl md:text-2xl text-gray-300 italic mb-4">
              &quot;VibeAff transformed our affiliate program. We saw a 300% increase in conversions within the first month.&quot;
            </p>
            <p className="text-gray-400">— Sarah Chen, Marketing Director at TechCorp</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-border mt-24">
          <div className="border-t-2 border-transparent bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-orange-500/50">
            <div className="container mx-auto px-6 py-12 bg-[#0a0a0a]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-gray-400">© 2026 VibeAff. All rights reserved.</p>
                <div className="flex gap-6 flex-wrap justify-center">
                  <Link href="#how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors">
                    How it works
                  </Link>
                  <Link href="#benefits" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Benefits
                  </Link>
                  <Link href="#pricing" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Pricing
                  </Link>
                  <Link
                    href="https://docs.vibeaff.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    Developers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
