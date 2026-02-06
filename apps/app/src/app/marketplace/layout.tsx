"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const chars = "01アイウエオカキクケコサシスセソ";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -100);
    function draw() {
      ctx!.fillStyle = "rgba(5, 5, 8, 0.15)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx!.fillStyle = "#D7FF3B";
      ctx!.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx!.globalAlpha = 0.4 + Math.random() * 0.6;
        ctx!.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas!.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.5 + Math.random() * 0.5;
      }
      requestAnimationFrame(draw);
    }
    const raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="matrix-rain" />;
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] text-[#F6F6F7] relative">
      <MatrixRain />
      <div className="grain-overlay" />
      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050508]/80 border-b border-white/[0.06]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/marketplace" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D7FF3B] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#050508]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="text-base font-semibold tracking-tight">VibeAff</span>
              <span className="text-[10px] font-mono text-[#8B8B9E] uppercase tracking-widest ml-1">Marketplace</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/marketplace/search" className="btn-secondary text-xs">Search</Link>
              <Link href="/affiliate" className="btn-secondary text-xs">Dashboard</Link>
              <Link href="/admin" className="btn-secondary text-xs">Admin</Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 pb-16 pt-6">{children}</main>
      </div>
    </div>
  );
}
