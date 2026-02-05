const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/access", label: "Access matrix" },
  { href: "/admin/channels", label: "Channels library" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/audit", label: "Audit logs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold">VibeAff Backoffice</div>
        <a className="rounded-full border border-white/20 px-4 py-2 text-sm" href="/">
          View site
        </a>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 hover:border-white/30"
            >
              {item.label}
            </a>
          ))}
        </aside>
        <main className="space-y-8">{children}</main>
      </div>
    </div>
  );
}
