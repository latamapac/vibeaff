"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

/* ── Wireframe Globe ─────────────────────────────── */
function WireframeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.38;

      // Outer circle
      ctx.strokeStyle = "rgba(0, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        const ry = r * Math.cos(latRad);
        const y = cy - r * Math.sin(latRad);
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.06 + Math.abs(lat) * 0.001})`;
        ctx.beginPath();
        ctx.ellipse(cx, y, ry, ry * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines (rotating)
      for (let lon = 0; lon < 180; lon += 30) {
        const lonRad = ((lon + rotation) * Math.PI) / 180;
        ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
        ctx.beginPath();
        for (let a = 0; a <= 360; a += 5) {
          const aRad = (a * Math.PI) / 180;
          const x = cx + r * Math.cos(aRad) * Math.sin(lonRad);
          const y = cy - r * Math.sin(aRad);
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Glowing dots at intersections
      for (let lat = -60; lat <= 60; lat += 30) {
        for (let lon = 0; lon < 360; lon += 60) {
          const latRad = (lat * Math.PI) / 180;
          const lonRad = ((lon + rotation) * Math.PI) / 180;
          const x = cx + r * Math.cos(latRad) * Math.sin(lonRad);
          const y = cy - r * Math.sin(latRad);
          const z = Math.cos(latRad) * Math.cos(lonRad);
          if (z < -0.1) continue;
          const alpha = 0.3 + z * 0.5;
          ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rotation += 0.15;
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

/* ── Particle Field ──────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = { x: number; y: number; vx: number; vy: number; size: number; alpha: number };
    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.04 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" />;
}

/* ── Holographic Heading ─────────────────────────── */
function HoloText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%] ${className}`}
    >
      {children}
    </span>
  );
}

/* ── Stats counter ───────────────────────────────── */
function AnimatedStat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = value / 60;
          const animate = () => {
            start += step;
            if (start >= value) {
              setCount(value);
              return;
            }
            setCount(Math.floor(start));
            requestAnimationFrame(animate);
          };
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold tabular-nums">
        <HoloText>{count.toLocaleString()}{suffix}</HoloText>
      </div>
      <div className="text-sm text-white/50 mt-2 uppercase tracking-wider">{label}</div>
    </div>
  );
}

/* ── Feature Card ────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="s2-glass-card group p-6">
      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Main Component ──────────────────────────────── */
export default function StyleTwo() {
  return (
    <div className="relative bg-[#030308] text-white min-h-screen overflow-hidden">
      {/* Particle background */}
      <ParticleField />

      {/* ═══ HERO ═══════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-xs text-cyan-400 font-mono tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AFFILIATE MARKETING v2.0
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight">
              <HoloText>The future</HoloText>
              <br />
              <span className="text-white">of affiliate</span>
              <br />
              <span className="text-white/60">marketing.</span>
            </h1>

            <p className="text-lg text-white/40 max-w-md leading-relaxed">
              AI-powered campaigns, real-time fraud detection, and crypto payouts.
              Built for the next generation of performance marketers.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={`${appUrl}/register`}
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all"
              >
                Start free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/10 text-white/70 text-sm hover:border-white/30 hover:text-white transition-all"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Globe */}
          <div className="relative w-full aspect-square max-w-[500px] mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
            <WireframeGlobe />
            {/* Floating stat pills */}
            <div className="absolute top-[15%] -left-4 px-3 py-1.5 rounded-full bg-black/60 border border-cyan-500/20 backdrop-blur text-xs text-cyan-400 font-mono s2-float-anim">
              +234% ROI
            </div>
            <div className="absolute bottom-[20%] -right-4 px-3 py-1.5 rounded-full bg-black/60 border border-purple-500/20 backdrop-blur text-xs text-purple-400 font-mono s2-float-anim [animation-delay:1s]">
              $4.2M paid
            </div>
            <div className="absolute top-[60%] -left-8 px-3 py-1.5 rounded-full bg-black/60 border border-blue-500/20 backdrop-blur text-xs text-blue-400 font-mono s2-float-anim [animation-delay:2s]">
              12K affiliates
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ══════════════════════════════ */}
      <section className="relative z-10 border-y border-white/[0.06] bg-black/40 backdrop-blur-xl py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
          <AnimatedStat value={12400} label="Active Affiliates" suffix="+" />
          <AnimatedStat value={4200000} label="Commissions Paid" />
          <AnimatedStat value={98} label="Uptime %" suffix="%" />
          <AnimatedStat value={500} label="Brand Partners" suffix="+" />
        </div>
      </section>

      {/* ═══ FEATURES ═══════════════════════════════ */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-4">Core Platform</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              <HoloText>Built different.</HoloText>
            </h2>
            <p className="text-white/40 mt-4 max-w-lg mx-auto">
              Every feature designed for scale. Every pixel optimized for conversion.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
              title="AI Creative Engine"
              desc="Generate ad copy, landing pages, and visual creatives in seconds. Optimized for every channel."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
              title="Fraud Shield"
              desc="Real-time velocity checks, self-referral detection, and ML-powered fraud scoring protect every transaction."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              title="Crypto Payouts"
              desc="Pay affiliates in crypto or fiat. Multi-currency, instant settlements, full audit trail."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>}
              title="Live Analytics"
              desc="Real-time dashboards with conversion funnels, attribution modeling, and cohort analysis."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" /></svg>}
              title="Multi-Channel"
              desc="Google, Meta, TikTok, push, native, in-app — all traffic sources unified in one platform."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" /></svg>}
              title="Gamification"
              desc="Leaderboards, tier badges, and performance incentives to keep affiliates engaged and competing."
            />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════ */}
      <section className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-4">Process</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              Three steps to <HoloText>liftoff.</HoloText>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect", desc: "Sign up, create your program, set commission rules. Live in under 5 minutes." },
              { step: "02", title: "Launch", desc: "AI generates creatives, links are tracked, affiliates start promoting instantly." },
              { step: "03", title: "Scale", desc: "Monitor performance, optimize with AI insights, pay out automatically." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-cyan-500/10 font-mono mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOR AFFILIATES / FOR BRANDS ════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Affiliates */}
          <div className="s2-glass-card p-8">
            <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-4">For Affiliates</p>
            <h3 className="text-3xl font-bold mb-4">
              No skills?
              <br />
              <span className="text-white/50">No problem.</span>
            </h3>
            <p className="text-sm text-white/40 mb-6 leading-relaxed">
              AI handles the creatives, optimization, and reporting. You focus on traffic. We handle the rest.
            </p>
            <ul className="space-y-3 text-sm text-white/60">
              {["AI-generated ad copy & landing pages", "Real-time commission tracking", "Instant crypto or fiat payouts", "Gamified leaderboard & tier rewards"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={`${appUrl}/register`}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all"
            >
              Join as affiliate
            </Link>
          </div>

          {/* Brands */}
          <div className="s2-glass-card p-8">
            <p className="text-xs font-mono text-purple-400 tracking-widest uppercase mb-4">For Brands</p>
            <h3 className="text-3xl font-bold mb-4">
              Infinite
              <br />
              <span className="text-white/50">affiliates.</span>
            </h3>
            <p className="text-sm text-white/40 mb-6 leading-relaxed">
              Launch your affiliate program and tap into a global network of performance marketers — all managed by AI.
            </p>
            <ul className="space-y-3 text-sm text-white/60">
              {["Custom commission structures", "Fraud detection & compliance", "Multi-channel creative automation", "Real-time analytics & attribution"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={`${appUrl}/register`}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-purple-500/30 text-purple-300 text-sm font-semibold hover:bg-purple-500/10 transition-all"
            >
              Launch your program
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════ */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Ready to <HoloText>dominate?</HoloText>
          </h2>
          <p className="text-white/40 mt-6 text-lg max-w-lg mx-auto">
            Join thousands of affiliates and brands already scaling with VibeAff.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={`${appUrl}/register`}
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-[0_0_40px_rgba(0,255,255,0.3)] transition-all"
            >
              Get started free
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="font-semibold text-sm">VibeAff</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-white/30">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
          <p className="text-xs text-white/20">&copy; 2025 VibeAff. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
