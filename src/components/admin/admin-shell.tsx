import { Link } from "@tanstack/react-router";
import {
  Anchor,
  Crown,
  ExternalLink,
  FileText,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AdminTab } from "../../lib/admin-permissions";
import { Logo } from "../brand";
import { LangToggle } from "../lang-toggle";
import { ThemeToggle } from "../theme-toggle";

const ALL_NAV: { id: AdminTab; icon: LucideIcon }[] = [
  { id: "overview", icon: LayoutDashboard },
  { id: "posts", icon: FileText },
  { id: "gallery", icon: ImageIcon },
  { id: "content", icon: LayoutTemplate },
  { id: "contacts", icon: Inbox },
  { id: "users", icon: Users },
  { id: "settings", icon: Settings },
  { id: "profile", icon: UserCircle },
];

export function AdminShell({
  dir,
  tab,
  setTab,
  tabLabels,
  navItems,
  contactBadge,
  userEmail,
  isSuperAdmin,
  superAdminLabel,
  chipLabel,
  siteLabel,
  logoutLabel,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  children,
}: {
  dir: "rtl" | "ltr";
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;
  tabLabels: Record<AdminTab, string>;
  navItems: typeof ALL_NAV;
  contactBadge: number;
  userEmail?: string | null;
  isSuperAdmin: boolean;
  superAdminLabel: string;
  chipLabel: string;
  siteLabel: string;
  logoutLabel: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const sidebar = (
    <aside className="relative flex h-full w-[272px] flex-col overflow-hidden bg-navy-deep text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--gold)_12%,transparent),transparent_55%)]"
      />
      <div className="relative flex items-center gap-3 border-b border-gold/20 px-5 py-5">
        <Logo size="sm" />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold tracking-[0.12em]">BoatPro</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gold/85">
            <Anchor size={11} strokeWidth={1.75} />
            {chipLabel}
          </p>
        </div>
      </div>

      <nav className="relative min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
        {navItems.map(({ id, icon: Icon }) => {
          const active = tab === id;
          const badge = id === "contacts" ? contactBadge : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-start text-[13px] font-medium transition-all ${
                active
                  ? "border border-gold/35 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--gold)_22%,transparent),color-mix(in_oklab,var(--gold)_8%,transparent))] text-white shadow-[0_10px_24px_-16px_color-mix(in_oklab,var(--gold)_55%,transparent)]"
                  : "border border-transparent text-white/60 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span
                className={`inline-flex size-8 items-center justify-center rounded-xl ${
                  active ? "bg-gold/20 text-white" : "bg-white/[0.04] text-white/45"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <span className="flex-1">{tabLabels[id]}</span>
              {badge > 0 ? (
                <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="relative shrink-0 border-t border-gold/15 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[13px] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <ExternalLink size={16} strokeWidth={1.75} className="text-gold/70" />
          {siteLabel}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-start text-[13px] font-medium text-white/85 transition-colors hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-200"
        >
          <LogOut size={16} strokeWidth={1.75} className="text-rose-300/80" />
          {logoutLabel}
        </button>
      </div>
    </aside>
  );

  return (
    <main dir={dir} className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-svh lg:shrink-0">{sidebar}</div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              aria-label="Close"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 start-0 shadow-2xl">{sidebar}</div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-navy lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Menu"
                >
                  {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] text-gold-ink uppercase">
                    <Sparkles size={11} strokeWidth={1.75} />
                    BoatPro
                  </p>
                  <h1 className="truncate font-display text-lg font-semibold tracking-tight text-navy sm:text-xl">
                    {tabLabels[tab]}
                  </h1>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <LangToggle />
                <button
                  type="button"
                  onClick={() => setTab("profile")}
                  className="hidden items-center gap-2 rounded-full border border-gold/25 bg-card py-1.5 pe-3.5 ps-1.5 shadow-sm sm:flex"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-navy-deep text-[11px] font-semibold text-white">
                    {(userEmail?.[0] ?? "A").toUpperCase()}
                  </span>
                  <div className="min-w-0 max-w-[180px] text-start">
                    <p className="truncate text-[12px] font-medium text-navy" dir="ltr">
                      {userEmail}
                    </p>
                    {isSuperAdmin ? (
                      <p className="flex items-center gap-1 text-[10px] text-gold-ink">
                        <Crown size={10} strokeWidth={1.75} />
                        {superAdminLabel}
                      </p>
                    ) : null}
                  </div>
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
        </div>
      </div>
    </main>
  );
}

export { ALL_NAV as ADMIN_NAV_ITEMS };
