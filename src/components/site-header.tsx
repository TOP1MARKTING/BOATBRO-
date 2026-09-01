import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "../lib/i18n";
import { NAV } from "../lib/nav";
import { useSiteSettings } from "../lib/site-settings-context";
import { Logo, SHELL } from "./brand";
import { LangToggle } from "./lang-toggle";
import { ThemeToggle } from "./theme-toggle";

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SiteHeader() {
  const { lang, t } = useLang();
  const { contact } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, lang]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-md ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className={`${SHELL} flex h-14 items-center justify-between gap-2 sm:h-16 lg:h-[72px] lg:gap-3`}>
          <Link to="/" aria-label="BoatPro" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo size="sm" className="!h-11 !w-11 shrink-0 sm:!h-12 sm:!w-12 lg:!h-16 lg:!w-16" />
            <span className="hidden truncate font-display text-[15px] tracking-[0.16em] text-navy md:block">
              BOATPRO
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.key}
                  to={item.to as never}
                  className={`rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
                    active ? "bg-secondary text-navy" : "text-foreground/70 hover:text-gold-ink"
                  }`}
                >
                  {t.nav[item.key]}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <LangToggle />
            <a
              href={contact.tel}
              className="hidden rounded-full border border-gold/55 px-5 py-2.5 text-[13px] font-medium text-gold-ink transition-colors hover:bg-gold hover:text-white lg:inline-flex"
              aria-label={t.cta.callUs}
            >
              {t.cta.callUs}
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t.cta.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 bg-card text-navy transition-colors hover:border-gold/45 sm:size-10 lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[70] ${menuOpen ? "pointer-events-auto" : "pointer-events-none invisible"}`}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-navy-deep/55 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          id="mobile-nav"
          className={`absolute inset-y-0 end-0 flex w-[min(20rem,88vw)] flex-col bg-background pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Logo size="sm" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={lang === "ar" ? "إغلاق" : "Close"}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-1">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to as never}
                onClick={() => setMenuOpen(false)}
                className={`block border-b border-border/80 py-3.5 text-[16px] font-medium transition-colors ${
                  isActive(pathname, item.to) ? "text-gold" : "text-foreground hover:text-gold"
                }`}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <a
              href={contact.tel}
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-medium text-white hover:bg-gold/85"
            >
              <Phone size={16} aria-hidden="true" />
              {t.cta.callUs}
            </a>
            <Link
              to="/app"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/50 text-sm font-medium text-gold-ink hover:bg-gold hover:text-white"
            >
              {t.cta.download}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
