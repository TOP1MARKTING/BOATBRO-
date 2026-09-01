import { Link } from "@tanstack/react-router";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
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
    <aside className="flex h-full w-[260px] flex-col bg-[#0b1220] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Logo size="sm" />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold tracking-wide">BoatPro</p>
          <p className="text-[11px] text-white/55">{chipLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ id, icon: Icon }) => {
          const active = tab === id;
          const badge = id === "contacts" ? contactBadge : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start text-[13px] font-medium transition-colors ${
                active
                  ? "border-s-[3px] border-s-[#C8A96A] bg-white/10 text-white"
                  : "border-s-[3px] border-s-transparent text-white/65 hover:bg-white/6 hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-[#C8A96A]" : "text-white/45"} />
              <span className="flex-1">{tabLabels[id]}</span>
              {badge > 0 ? (
                <span className="rounded-full bg-[#C8A96A] px-2 py-0.5 text-[11px] font-semibold text-[#0b1220]">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] text-white/65 transition-colors hover:bg-white/6 hover:text-white"
        >
          <ExternalLink size={18} className="text-white/45" />
          {siteLabel}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start text-[13px] text-white/65 transition-colors hover:bg-white/6 hover:text-white"
        >
          <LogOut size={18} className="text-white/45" />
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
              className="absolute inset-0 bg-black/45"
              aria-label="Close"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 start-0 shadow-2xl">{sidebar}</div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
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
                <h1 className="truncate font-display text-lg font-semibold text-navy sm:text-xl">
                  {tabLabels[tab]}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <LangToggle />
                <button
                  type="button"
                  onClick={() => setTab("profile")}
                  className="hidden items-center gap-2 rounded-full border border-border bg-surface-2 py-1.5 pe-3.5 ps-1.5 sm:flex"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-navy-deep text-[11px] font-semibold text-white">
                    {(userEmail?.[0] ?? "A").toUpperCase()}
                  </span>
                  <div className="min-w-0 max-w-[180px] text-start">
                    <p className="truncate text-[12px] font-medium text-navy" dir="ltr">
                      {userEmail}
                    </p>
                    {isSuperAdmin ? <p className="text-[10px] text-gold-ink">{superAdminLabel}</p> : null}
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
