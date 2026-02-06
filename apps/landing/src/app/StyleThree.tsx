"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Play,
  Brain,
  Megaphone,
  LineChart,
  Moon,
  Users,
  Wallet,
  Globe,
  TrendingUp,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  ExternalLink,
  Check,
  Building2,
  User,
  ChevronDown,
  Zap,
  Menu,
  X,
  Quote,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.vibeaff.com";

/* ═══════════════════════════════════════════
   Ghost Mascot SVG
   ═══════════════════════════════════════════ */
function GhostMascot({
  size = 120,
  variant = "default",
  className = "",
}: {
  size?: number;
  variant?: "default" | "outline" | "glitch";
  className?: string;
}) {
  const strokeColor = variant === "outline" ? "#D7FF3B" : "none";
  const fillColor = variant === "outline" ? "transparent" : "#F6F6F7";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={`ghost-float ${className}`}>
      <path
        d="M60 10C35 10 15 30 15 55V95C15 102 20 108 27 108C34 108 39 102 39 95C39 102 44 108 51 108C58 108 63 102 63 95C63 102 68 108 75 108C82 108 87 102 87 95C87 102 92 108 99 108C106 108 111 102 111 95V55C111 30 91 10 60 10Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={variant === "outline" ? 2 : 0}
      />
      <ellipse cx="42" cy="50" rx="8" ry="10" fill="#0B0B0D" />
      <ellipse cx="78" cy="50" rx="8" ry="10" fill="#0B0B0D" />
      <path d="M50 70Q60 78 70 70" stroke="#0B0B0D" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="62" r="5" fill="#D7FF3B" opacity="0.6" />
      <circle cx="88" cy="62" r="5" fill="#D7FF3B" opacity="0.6" />
      {variant === "glitch" && (
        <>
          <rect x="20" y="45" width="80" height="3" fill="#D7FF3B" opacity="0.8" />
          <rect x="25" y="65" width="70" height="2" fill="#D7FF3B" opacity="0.6" />
          <rect x="30" y="85" width="60" height="3" fill="#D7FF3B" opacity="0.7" />
        </>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   Navigation
   ═══════════════════════════════════════════ */
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const navLinks = [
    { label: "How It Works", id: "s2-how-it-works" },
    { label: "For Affiliates", id: "s2-for-affiliates" },
    { label: "For Brands", id: "s2-for-brands" },
    { label: "Pricing", id: "s2-pricing" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#0B0B0D]/90 backdrop-blur-md py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="w-full px-6 lg:px-12 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-display font-bold text-xl tracking-tight text-[#F6F6F7] hover:text-[#D7FF3B] transition-colors"
          >
            VibeAff
          </button>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm text-[#B8B8BD] hover:text-[#F6F6F7] transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
            <Link
              href={`${appUrl}/register`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D7FF3B] text-[#0B0B0D] px-5 py-2.5 rounded-full text-sm font-semibold s2-btn-hover"
            >
              Start Earning
            </Link>
          </div>
          <button className="md:hidden text-[#F6F6F7]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#0B0B0D]/98 backdrop-blur-lg md:hidden flex flex-col items-center justify-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-2xl font-display font-semibold text-[#F6F6F7] hover:text-[#D7FF3B] transition-colors"
            >
              {link.label}
            </button>
          ))}
          <Link
            href={`${appUrl}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 bg-[#D7FF3B] text-[#0B0B0D] px-8 py-3 rounded-full text-lg font-semibold"
            onClick={() => setMobileOpen(false)}
          >
            Start Earning
          </Link>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   Section 1: Hero
   ═══════════════════════════════════════════ */
function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const loadTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      loadTl
        .fromTo(imageRef.current, { x: "-60vw", scale: 0.92, opacity: 0 }, { x: 0, scale: 1, opacity: 1, duration: 1 })
        .fromTo(
          headlineRef.current?.querySelectorAll(".word") || [],
          { x: "10vw", opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, stagger: 0.06 },
          "-=0.6"
        )
        .fromTo(subheadRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
        .fromTo(ctaRef.current?.children || [], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, "-=0.3")
        .fromTo(
          ghostRef.current,
          { y: "12vh", rotate: -8, scale: 0.85, opacity: 0 },
          { y: 0, rotate: 0, scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.6)" },
          "-=0.5"
        );

      const scrollTl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=130%", pin: true, scrub: 0.6 },
      });
      scrollTl
        .fromTo(imageRef.current, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: "-18vw", y: "10vh", scale: 0.96, opacity: 0, ease: "power2.in" }, 0.7)
        .fromTo(headlineRef.current, { x: 0, opacity: 1 }, { x: "12vw", opacity: 0, ease: "power2.in" }, 0.7)
        .fromTo(subheadRef.current, { x: 0, opacity: 1 }, { x: "12vw", opacity: 0, ease: "power2.in" }, 0.72)
        .fromTo(ctaRef.current, { x: 0, opacity: 1 }, { x: "12vw", opacity: 0, ease: "power2.in" }, 0.74)
        .fromTo(ghostRef.current, { y: 0, rotate: 0, opacity: 1 }, { y: "-18vh", rotate: 10, opacity: 0, ease: "power2.in" }, 0.7);
    }, section);
    return () => ctx.revert();
  }, []);

  const words = "DROPSHIP MARKETING".split(" ");

  return (
    <section ref={sectionRef} className="s2-section-pinned bg-[#0B0B0D] z-10">
      <div ref={imageRef} className="absolute s2-image-pill" style={{ left: "6vw", top: "18vh", width: "38vw", height: "64vh" }}>
        <img src="/hero-portrait.jpg" alt="VibeAff Hero" className="w-full h-full object-cover" />
      </div>
      <div className="absolute" style={{ left: "52vw", top: "22vh", width: "42vw" }}>
        <div ref={headlineRef} className="mb-6">
          <h1
            className="font-display font-bold text-[#F6F6F7] uppercase leading-[0.95] tracking-[-0.02em]"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
          >
            {words.map((word, i) => (
              <span key={i} className="word inline-block mr-[0.25em]">
                {word}
              </span>
            ))}
          </h1>
        </div>
        <div ref={subheadRef} className="mb-8">
          <p className="text-[#B8B8BD] text-lg lg:text-xl leading-relaxed max-w-md">
            Pick a product. Describe your audience. Pay for creatives + ads. We run everything. You earn commissions.
          </p>
        </div>
        <div ref={ctaRef} className="flex flex-wrap gap-4 mb-6">
          <Link
            href={`${appUrl}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#D7FF3B] text-[#0B0B0D] px-6 py-3 rounded-full font-semibold flex items-center gap-2 s2-btn-hover"
          >
            Start Earning <ArrowRight size={18} />
          </Link>
          <button className="border border-[#F6F6F7]/30 text-[#F6F6F7] px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-[#F6F6F7]/10 transition-colors">
            <Play size={18} /> Watch Demo
          </button>
        </div>
        <p className="text-[#B8B8BD]/60 text-sm font-mono">No skills needed &bull; Start from $50</p>
      </div>
      <div ref={ghostRef} className="absolute" style={{ left: "34vw", top: "62vh" }}>
        <GhostMascot size={140} variant="default" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 2: How It Works
   ═══════════════════════════════════════════ */
function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=130%", pin: true, scrub: 0.6 },
      });
      scrollTl
        .fromTo(ghostRef.current, { y: "-40vh", scale: 0.7, opacity: 0 }, { y: 0, scale: 1, opacity: 1, ease: "none" }, 0)
        .fromTo(headlineRef.current, { y: "18vh", opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0.05)
        .fromTo(bodyRef.current, { y: "10vh", opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0.1);
      stepsRef.current.forEach((step, i) => {
        if (step) scrollTl.fromTo(step, { y: "15vh", opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0.15 + i * 0.05);
      });
      scrollTl
        .to(ghostRef.current, { y: "-18vh", scale: 0.9, opacity: 0, ease: "power2.in" }, 0.7)
        .to(headlineRef.current, { y: "-10vh", opacity: 0, ease: "power2.in" }, 0.7)
        .to(bodyRef.current, { y: "-6vh", opacity: 0, ease: "power2.in" }, 0.72);
      stepsRef.current.forEach((step, i) => {
        if (step) scrollTl.to(step, { y: "-8vh", opacity: 0, ease: "power2.in" }, 0.74 + i * 0.02);
      });
    }, section);
    return () => ctx.revert();
  }, []);

  const steps = [
    { number: "01", title: "PICK", desc: "Choose from 1000+ products" },
    { number: "02", title: "PROMPT", desc: "Tell us who to target" },
    { number: "03", title: "PROFIT", desc: "We run everything. You earn." },
  ];

  return (
    <section ref={sectionRef} id="s2-how-it-works" className="s2-section-pinned bg-[#0B0B0D] z-20 flex items-center justify-center">
      <div className="text-center px-6" style={{ maxWidth: "980px" }}>
        <div ref={ghostRef} className="flex justify-center mb-8">
          <GhostMascot size={180} variant="outline" />
        </div>
        <h2
          ref={headlineRef}
          className="font-display font-bold text-[#F6F6F7] uppercase leading-[0.95] tracking-[-0.02em] mb-8"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          FROM ZERO TO AFFILIATE
        </h2>
        <p ref={bodyRef} className="text-[#B8B8BD] text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
          No marketing skills. No creative talent. Just type who you want to reach and let AI do the rest.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {steps.map((step, i) => (
            <div
              key={step.number}
              ref={(el) => { stepsRef.current[i] = el; }}
              className="s2-card-radius p-6 flex flex-col items-center"
              style={{ width: "200px", backgroundColor: "#151517", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="font-mono text-4xl font-bold text-[#D7FF3B] mb-3">{step.number}</span>
              <h3 className="font-display font-bold text-xl text-[#F6F6F7] mb-2 uppercase">{step.title}</h3>
              <p className="text-[#B8B8BD] text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 3: For Affiliates
   ═══════════════════════════════════════════ */
function ForAffiliatesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=130%", pin: true, scrub: 0.6 },
      });
      scrollTl
        .fromTo(imageRef.current, { x: "60vw", scale: 0.92, opacity: 0 }, { x: 0, scale: 1, opacity: 1, ease: "none" }, 0)
        .fromTo(textRef.current, { x: "-40vw", opacity: 0 }, { x: 0, opacity: 1, ease: "none" }, 0.05)
        .fromTo(ghostRef.current, { scale: 0.6, rotate: -12, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, ease: "back.out(1.6)" }, 0.1);
      scrollTl
        .to(imageRef.current, { x: "18vw", y: "10vh", scale: 0.96, opacity: 0, ease: "power2.in" }, 0.7)
        .to(textRef.current, { x: "-12vw", opacity: 0, ease: "power2.in" }, 0.7)
        .to(ghostRef.current, { y: "-16vh", rotate: 10, opacity: 0, ease: "power2.in" }, 0.7);
    }, section);
    return () => ctx.revert();
  }, []);

  const benefits = [
    { icon: Brain, text: "Zero marketing knowledge needed" },
    { icon: Megaphone, text: "AI creates all your creatives" },
    { icon: LineChart, text: "We manage and optimize ads" },
    { icon: Moon, text: "Earn while you sleep" },
  ];

  return (
    <section ref={sectionRef} id="s2-for-affiliates" className="s2-section-pinned bg-[#0B0B0D] z-30">
      <div ref={imageRef} className="absolute s2-image-pill" style={{ right: "6vw", top: "18vh", width: "38vw", height: "64vh" }}>
        <img src="/affiliate-portrait.jpg" alt="Vibe Affiliate" className="w-full h-full object-cover" />
      </div>
      <div ref={textRef} className="absolute" style={{ left: "6vw", top: "22vh", width: "44vw" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D7FF3B]/10 border border-[#D7FF3B]/30 mb-6">
          <span className="text-[#D7FF3B] text-sm font-mono">FOR AFFILIATES</span>
        </div>
        <h2
          className="font-display font-bold text-[#F6F6F7] uppercase leading-[0.95] tracking-[-0.02em] mb-6"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
        >
          NO SKILLS.
          <br />
          <span className="text-[#D7FF3B]">NO PROBLEM.</span>
        </h2>
        <p className="text-[#B8B8BD] text-lg lg:text-xl leading-relaxed max-w-md mb-8">
          If you can type, you can earn. Our AI handles everything&mdash;from creatives to campaign optimization.
        </p>
        <div className="space-y-4 mb-8">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon size={18} className="text-[#D7FF3B]" />
                </div>
                <span className="text-[#B8B8BD]">{b.text}</span>
              </div>
            );
          })}
        </div>
        <Link
          href={`${appUrl}/register`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#D7FF3B] text-[#0B0B0D] px-6 py-3 rounded-full font-semibold inline-flex items-center gap-2 s2-btn-hover"
        >
          Browse Products <ArrowRight size={18} />
        </Link>
      </div>
      <div ref={ghostRef} className="absolute" style={{ left: "44vw", top: "62vh" }}>
        <GhostMascot size={120} variant="default" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 4: For Brands
   ═══════════════════════════════════════════ */
function ForBrandsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=130%", pin: true, scrub: 0.6 },
      });
      scrollTl
        .fromTo(imageRef.current, { x: "-60vw", scale: 0.92, opacity: 0 }, { x: 0, scale: 1, opacity: 1, ease: "none" }, 0)
        .fromTo(textRef.current, { x: "40vw", opacity: 0 }, { x: 0, opacity: 1, ease: "none" }, 0.05)
        .fromTo(ghostRef.current, { scale: 0.6, rotate: 12, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, ease: "back.out(1.6)" }, 0.1);
      scrollTl
        .to(imageRef.current, { x: "-18vw", y: "10vh", scale: 0.96, opacity: 0, ease: "power2.in" }, 0.7)
        .to(textRef.current, { x: "12vw", opacity: 0, ease: "power2.in" }, 0.7)
        .to(ghostRef.current, { y: "-16vh", rotate: -10, opacity: 0, ease: "power2.in" }, 0.7);
    }, section);
    return () => ctx.revert();
  }, []);

  const benefits = [
    { icon: Users, text: "Army of AI-powered affiliates" },
    { icon: Wallet, text: "They pay for their own ads" },
    { icon: TrendingUp, text: "You only pay on sales" },
    { icon: Globe, text: "Reach new audiences" },
  ];

  return (
    <section ref={sectionRef} id="s2-for-brands" className="s2-section-pinned bg-[#0B0B0D] z-40">
      <div ref={imageRef} className="absolute s2-image-pill" style={{ left: "6vw", top: "18vh", width: "38vw", height: "64vh" }}>
        <img src="/brand-portrait.jpg" alt="Brand Partner" className="w-full h-full object-cover" />
      </div>
      <div ref={textRef} className="absolute" style={{ right: "6vw", top: "18vh", width: "44vw" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6B2B8C]/30 border border-[#6B2B8C]/50 mb-6">
          <span className="text-[#F6F6F7] text-sm font-mono">FOR BRANDS</span>
        </div>
        <h2
          className="font-display font-bold text-[#F6F6F7] uppercase leading-[0.95] tracking-[-0.02em] mb-6"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
        >
          INFINITE
          <br />
          <span className="text-[#6B2B8C]">AFFILIATES.</span>
        </h2>
        <div className="s2-glass-strong rounded-xl p-6 mb-8">
          <div className="font-display font-bold text-5xl text-[#F6F6F7] mb-2">
            10,000<span className="text-[#D7FF3B]">+</span>
          </div>
          <p className="text-[#B8B8BD]">vibe affiliates ready to promote your product</p>
        </div>
        <div className="space-y-4 mb-8">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon size={18} className="text-[#6B2B8C]" />
                </div>
                <span className="text-[#B8B8BD]">{b.text}</span>
              </div>
            );
          })}
        </div>
        <Link
          href={`${appUrl}/register`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#6B2B8C] text-[#F6F6F7] px-6 py-3 rounded-full font-semibold inline-flex items-center gap-2 s2-btn-hover hover:shadow-[0_0_30px_rgba(107,43,140,0.4)]"
        >
          Connect My Brand <ArrowRight size={18} />
        </Link>
      </div>
      <div ref={ghostRef} className="absolute" style={{ left: "34vw", top: "62vh" }}>
        <GhostMascot size={120} variant="outline" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 5: AI Demo
   ═══════════════════════════════════════════ */
function AIDemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=140%", pin: true, scrub: 0.6 },
      });
      scrollTl.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0);
      scrollTl.fromTo(demoRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0.1);
      scrollTl.fromTo(ghostRef.current, { scale: 0.7, rotate: -10, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, ease: "back.out(1.6)" }, 0.15);
      scrollTl.to(titleRef.current, { y: "-10vh", opacity: 0, ease: "power2.in" }, 0.7);
      scrollTl.to(demoRef.current, { y: "-12vh", opacity: 0, ease: "power2.in" }, 0.72);
      scrollTl.to(ghostRef.current, { y: "12vh", opacity: 0, ease: "power2.in" }, 0.74);
    }, section);
    return () => ctx.revert();
  }, []);

  const creativeTypes = [
    { icon: ImageIcon, label: "Images", count: "12 variants" },
    { icon: Video, label: "Videos", count: "4 reels" },
    { icon: FileText, label: "Copy", count: "8 headlines" },
  ];

  return (
    <section ref={sectionRef} className="s2-section-pinned bg-[#0B0B0D] z-50 flex items-center justify-center">
      <div ref={ghostRef} className="absolute" style={{ right: "8vw", top: "15vh" }}>
        <GhostMascot size={100} variant="glitch" />
      </div>
      <div className="relative z-10 w-full px-6 lg:px-12 max-w-5xl mx-auto">
        <div ref={titleRef} className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-[#F6F6F7] mb-4">
            TYPE. CLICK. <span className="text-[#D7FF3B]">DONE.</span>
          </h2>
          <p className="text-[#B8B8BD] text-lg max-w-xl mx-auto">
            Describe your audience. Our AI creates scroll-stopping creatives in seconds.
          </p>
        </div>
        <div ref={demoRef} className="s2-glass-strong rounded-2xl p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-[#D7FF3B]" size={20} />
                <span className="text-[#F6F6F7] font-medium">Your Prompt</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-[#F6F6F7] leading-relaxed">
                  &ldquo;Target <span className="text-[#D7FF3B]">Gen Z gamers</span> on{" "}
                  <span className="text-[#6B2B8C]">TikTok</span> in <span className="text-[#D7FF3B]">Brazil</span>. Energetic, meme-style vibe with
                  gaming slang.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-2 text-[#B8B8BD] text-sm">
                <div className="w-2 h-2 rounded-full bg-[#D7FF3B] animate-pulse" />
                AI analyzing audience &amp; generating...
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#6B2B8C]" />
                <span className="text-[#F6F6F7] font-medium">Generated Creatives</span>
              </div>
              <div className="space-y-3 mb-4">
                {creativeTypes.map((type, i) => {
                  const Icon = type.icon;
                  return (
                    <div key={i} className="flex items-center justify-between s2-glass rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <Icon size={16} className="text-[#D7FF3B]" />
                        </div>
                        <span className="text-[#F6F6F7] text-sm">{type.label}</span>
                      </div>
                      <span className="text-[#B8B8BD] text-sm">{type.count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["🎯", "🚀", "💰", "🔥"].map((emoji, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-gradient-to-br from-[#D7FF3B]/10 to-[#6B2B8C]/20 flex items-center justify-center border border-white/10"
                  >
                    <span className="text-2xl">{emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 6: Marketplace
   ═══════════════════════════════════════════ */
function MarketplaceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: titleRef.current, start: "top 80%", toggleActions: "play none none reverse" },
      });
      const cards = gridRef.current?.children;
      if (cards) {
        gsap.fromTo(cards, { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  const filters = [
    { id: "all", label: "All" },
    { id: "saas", label: "SaaS" },
    { id: "ecommerce", label: "E-commerce" },
    { id: "finance", label: "Finance" },
    { id: "gaming", label: "Gaming" },
  ];

  const products = [
    { name: "Notion", category: "saas", commission: "20%", payout: "$10-50/sale", icon: "📝" },
    { name: "Shopify", category: "ecommerce", commission: "$200", payout: "per signup", icon: "🛒" },
    { name: "Coinbase", category: "finance", commission: "$50", payout: "per referral", icon: "₿" },
    { name: "Discord Nitro", category: "gaming", commission: "30%", payout: "recurring", icon: "🎮" },
    { name: "Figma", category: "saas", commission: "25%", payout: "$15-100/sale", icon: "🎨" },
    { name: "Stripe", category: "finance", commission: "$100", payout: "per activation", icon: "💳" },
    { name: "Spotify", category: "saas", commission: "$7", payout: "per premium", icon: "🎵" },
    { name: "NVIDIA", category: "gaming", commission: "5%", payout: "on hardware", icon: "🖥️" },
  ];

  const filtered = activeFilter === "all" ? products : products.filter((p) => p.category === activeFilter);

  return (
    <section ref={sectionRef} className="bg-[#0B0B0D] py-20 lg:py-32 px-6 lg:px-12 relative z-[60]">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div ref={titleRef} className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#F6F6F7] mb-4">
            1000+ Products <span className="text-[#D7FF3B]">Waiting</span>
          </h2>
          <p className="text-[#B8B8BD] text-lg max-w-xl mx-auto">
            Browse top brands ready for your unique audience. New products added weekly.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === f.id ? "bg-[#D7FF3B] text-[#0B0B0D]" : "bg-white/5 text-[#B8B8BD] hover:bg-white/10 hover:text-[#F6F6F7]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product.name} className="s2-glass rounded-xl p-5 hover:border-[#D7FF3B]/50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{product.icon}</div>
                <ExternalLink size={16} className="text-white/20 group-hover:text-[#D7FF3B] transition-colors" />
              </div>
              <h3 className="font-display font-bold text-[#F6F6F7] mb-1">{product.name}</h3>
              <div className="text-[#D7FF3B] font-mono text-sm mb-1">{product.commission}</div>
              <div className="text-[#B8B8BD] text-xs">{product.payout}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 7: Success Stories
   ═══════════════════════════════════════════ */
function SuccessStoriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(statsRef.current, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: statsRef.current, start: "top 80%", toggleActions: "play none none reverse" },
      });
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(cards, { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: "power2.out",
          scrollTrigger: { trigger: cardsRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  const stats = [
    { value: "$4.2M", label: "Total affiliate earnings" },
    { value: "50K+", label: "Active vibe affiliates" },
    { value: "1,200+", label: "Connected brands" },
  ];

  const stories = [
    { quote: "Made $3,400 in my first month promoting Notion to students in Brazil.", name: "Alex", location: "São Paulo, Brazil", earnings: "$3,400", period: "First month", image: "/story-1.jpg" },
    { quote: "I just typed 'busy moms on Instagram' and the AI did the rest. Incredible.", name: "Sarah", location: "London, UK", earnings: "$8,200", period: "3 months", image: "/story-2.jpg" },
    { quote: "Zero marketing experience. $12,500 in 6 months. This changes everything.", name: "Mike", location: "Manila, Philippines", earnings: "$12,500", period: "6 months", image: "/story-3.jpg" },
  ];

  return (
    <section ref={sectionRef} className="bg-[#0B0B0D] py-20 lg:py-32 px-6 lg:px-12 relative z-[70]">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#F6F6F7] mb-4">
            Real People. <span className="text-[#D7FF3B]">Real Earnings.</span>
          </h2>
          <p className="text-[#B8B8BD] text-lg max-w-xl mx-auto">
            Join thousands of vibe affiliates already earning with AI-powered marketing.
          </p>
        </div>
        <div ref={statsRef} className="grid grid-cols-3 gap-4 lg:gap-8 mb-16">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#D7FF3B] mb-2">{s.value}</div>
              <div className="text-[#B8B8BD] text-xs sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div key={story.name} className="s2-glass rounded-2xl p-6 relative overflow-hidden">
              <Quote className="text-[#D7FF3B]/20 absolute top-4 right-4" size={40} />
              <p className="text-[#F6F6F7]/80 leading-relaxed mb-6 relative z-10">&ldquo;{story.quote}&rdquo;</p>
              <div className="flex items-center gap-4">
                <img src={story.image} alt={story.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-grow">
                  <div className="font-semibold text-[#F6F6F7]">{story.name}</div>
                  <div className="text-[#B8B8BD] text-sm">{story.location}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#D7FF3B]" />
                <span className="text-[#D7FF3B] font-mono font-bold">{story.earnings}</span>
                <span className="text-[#B8B8BD] text-sm">in {story.period}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 8: Pricing
   ═══════════════════════════════════════════ */
function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: titleRef.current, start: "top 80%", toggleActions: "play none none reverse" },
      });
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(cards, { y: 40, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out",
          scrollTrigger: { trigger: cardsRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  const plans = [
    {
      icon: User,
      title: "For Affiliates",
      subtitle: "Pay for results, nothing else",
      price: "From $50",
      period: "to start",
      features: ["AI creative generation", "Ad campaign setup", "Auto-optimization", "Real-time analytics", "Commission tracking"],
      cta: "Start Earning",
      lime: true,
    },
    {
      icon: Building2,
      title: "For Brands",
      subtitle: "Free to connect",
      price: "Commission",
      period: "only on sales",
      features: ["Free product listing", "10,000+ affiliates", "AI-powered promotion", "Fraud protection", "Detailed analytics"],
      cta: "Connect My Brand",
      lime: false,
    },
  ];

  return (
    <section ref={sectionRef} id="s2-pricing" className="bg-[#0B0B0D] py-20 lg:py-32 px-6 lg:px-12 relative z-[80]">
      <div className="relative z-10 max-w-4xl mx-auto">
        <div ref={titleRef} className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#F6F6F7] mb-4">
            Pay for <span className="text-[#D7FF3B]">Results.</span>
          </h2>
          <p className="text-[#B8B8BD] text-lg max-w-xl mx-auto">
            No monthly fees. No hidden costs. You only pay when you earn.
          </p>
        </div>
        <div ref={cardsRef} className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.title} className="s2-glass-strong rounded-2xl p-8 relative overflow-hidden">
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${plan.lime ? "bg-[#D7FF3B]/10" : "bg-[#6B2B8C]/20"}`} />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.lime ? "bg-[#D7FF3B]/20" : "bg-[#6B2B8C]/20"}`}>
                      <Icon size={20} className={plan.lime ? "text-[#D7FF3B]" : "text-[#6B2B8C]"} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#F6F6F7]">{plan.title}</h3>
                      <p className="text-[#B8B8BD] text-sm">{plan.subtitle}</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <span className={`font-display font-bold text-4xl ${plan.lime ? "text-[#D7FF3B]" : "text-[#6B2B8C]"}`}>{plan.price}</span>
                    <span className="text-[#B8B8BD] text-sm ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <Check size={16} className={plan.lime ? "text-[#D7FF3B]" : "text-[#6B2B8C]"} />
                        <span className="text-[#B8B8BD] text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`${appUrl}/register`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full py-3 rounded-full font-semibold text-center transition-all ${
                      plan.lime
                        ? "bg-[#D7FF3B] text-[#0B0B0D] s2-btn-hover"
                        : "bg-[#6B2B8C] text-[#F6F6F7] hover:opacity-90 hover:shadow-[0_0_30px_rgba(107,43,140,0.4)]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 9: FAQ
   ═══════════════════════════════════════════ */
function FAQSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const faqsRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: titleRef.current, start: "top 80%", toggleActions: "play none none reverse" },
      });
      const items = faqsRef.current?.children;
      if (items) {
        gsap.fromTo(items, { y: 30, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out",
          scrollTrigger: { trigger: faqsRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        });
      }
    }, section);
    return () => ctx.revert();
  }, []);

  const faqs = [
    { q: "Do I need marketing experience?", a: "Not at all. VibeAff is designed for complete beginners. If you can describe who you want to target, our AI handles everything else — from creative generation to ad optimization." },
    { q: "How much do I need to start?", a: "You can start with as little as $50. This covers AI creative generation and your initial ad budget. As you earn commissions, you can reinvest to scale." },
    { q: "When do I get paid?", a: "Affiliates receive payouts twice monthly (1st and 15th) via bank transfer, PayPal, or crypto. Minimum payout is $100." },
    { q: "What if my ads don't convert?", a: "Our AI continuously optimizes your campaigns. If a campaign underperforms, the system automatically adjusts targeting and creatives. You only pay for the ad spend you allocate." },
    { q: "How do brands track sales?", a: "We provide unique tracking links and discount codes. Our system tracks clicks, conversions, and attributions in real-time with detailed analytics." },
    { q: "Can I promote multiple products?", a: "Absolutely! There's no limit. Many successful affiliates run campaigns for 5-10 products simultaneously, targeting different audiences for each." },
  ];

  return (
    <section ref={sectionRef} className="bg-[#0B0B0D] py-20 lg:py-32 px-6 lg:px-12 relative z-[90]">
      <div className="relative z-10 max-w-3xl mx-auto">
        <div ref={titleRef} className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#F6F6F7] mb-4">
            Questions? <span className="text-[#D7FF3B]">Answered.</span>
          </h2>
        </div>
        <div ref={faqsRef} className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="s2-glass rounded-xl overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="font-medium text-[#F6F6F7] pr-4">{faq.q}</span>
                <ChevronDown size={20} className={`text-[#D7FF3B] flex-shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5">
                  <p className="text-[#B8B8BD] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 10: Final CTA
   ═══════════════════════════════════════════ */
function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "+=120%", pin: true, scrub: 0.6 },
      });
      scrollTl.fromTo(contentRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0);
      scrollTl.fromTo(ghostRef.current, { scale: 0.7, rotate: -10, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, ease: "back.out(1.6)" }, 0.1);
      scrollTl.to(contentRef.current, { y: "-10vh", opacity: 0, ease: "power2.in" }, 0.7);
      scrollTl.to(ghostRef.current, { y: "12vh", opacity: 0, ease: "power2.in" }, 0.72);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="s2-section-pinned z-[100] flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#6B2B8C" }}>
      <div ref={ghostRef} className="absolute" style={{ right: "10vw", bottom: "15vh" }}>
        <GhostMascot size={160} variant="default" />
      </div>
      <div ref={contentRef} className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#F6F6F7] mb-6 leading-tight uppercase">
          Your First Campaign
          <br />
          <span className="text-[#D7FF3B]">Starts Now</span>
        </h2>
        <p className="text-[#F6F6F7]/70 text-lg md:text-xl mb-10 max-w-xl mx-auto">
          Join 50,000+ vibe affiliates already earning. No skills needed. Just type and profit.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={`${appUrl}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#D7FF3B] text-[#0B0B0D] px-8 py-4 rounded-full font-semibold flex items-center gap-2 s2-btn-hover text-lg"
          >
            Start Earning <ArrowRight size={20} />
          </Link>
          <Link
            href={`${appUrl}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-[#F6F6F7] text-[#F6F6F7] px-8 py-4 rounded-full font-semibold flex items-center gap-2 hover:bg-[#F6F6F7]/10 transition-colors text-lg"
          >
            <Building2 size={20} /> Connect My Brand
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Section 11: Footer
   ═══════════════════════════════════════════ */
function FooterSection() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const footerLinks = {
    Product: [
      { label: "How It Works", id: "s2-how-it-works" },
      { label: "For Affiliates", id: "s2-for-affiliates" },
      { label: "For Brands", id: "s2-for-brands" },
      { label: "Pricing", id: "s2-pricing" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Docs", href: "https://docs.vibeaff.com" },
    ],
    Support: [
      { label: "Help Center", href: "#" },
      { label: "Contact", href: "mailto:support@vibeaff.com" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  };

  return (
    <footer className="bg-[#0A0A12] py-16 px-6 lg:px-12 relative z-[110] border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-[#D7FF3B]" size={24} />
              <span className="font-display font-bold text-xl text-[#F6F6F7]">VibeAff</span>
            </div>
            <p className="text-[#B8B8BD] mb-6 max-w-sm">
              Democratizing affiliate marketing. Anyone can earn. Any brand can grow.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-semibold text-[#F6F6F7] mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"id" in link && link.id ? (
                      <button onClick={() => scrollTo(link.id!)} className="text-[#B8B8BD] hover:text-[#D7FF3B] transition-colors text-sm">
                        {link.label}
                      </button>
                    ) : (
                      <a
                        href={"href" in link ? link.href : "#"}
                        target={("href" in link && link.href?.startsWith("http")) ? "_blank" : undefined}
                        rel={("href" in link && link.href?.startsWith("http")) ? "noopener noreferrer" : undefined}
                        className="text-[#B8B8BD] hover:text-[#D7FF3B] transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#B8B8BD]/60 text-sm">&copy; 2026 VibeAff. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-[#B8B8BD]/60">
            <a href="#" className="hover:text-[#F6F6F7] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#F6F6F7] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   Main StyleTwo Export
   ═══════════════════════════════════════════ */
export default function StyleTwo() {
  useEffect(() => {
    // Cleanup any leftover ScrollTrigger instances when unmounting (skin switch)
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div className="relative bg-[#0B0B0D] min-h-screen">
      <div className="s2-grain-overlay" />
      <Navigation />
      <main className="relative">
        <HeroSection />
        <HowItWorksSection />
        <ForAffiliatesSection />
        <ForBrandsSection />
        <AIDemoSection />
        <MarketplaceSection />
        <SuccessStoriesSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <FooterSection />
      </main>
    </div>
  );
}
