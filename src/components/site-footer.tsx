import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { CONTACT } from "../lib/site";
import { useLang } from "../lib/i18n";
import { NAV } from "../lib/nav";
import { Logo, SHELL } from "./brand";
import { StoreButtons } from "./store-buttons";

export function SiteFooter() {
  const { lang, t } = useLang();

  return (
    <footer className="relative overflow-hidden bg-navy-deep text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-24 top-0 size-40 rounded-full bg-gold/10 blur-3xl sm:size-72"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-16 bottom-0 size-36 rounded-full bg-sea/20 blur-3xl sm:size-64"
      />

      <div className={`${SHELL} relative py-8 sm:py-14 lg:py-16`}>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-7 text-center sm:mx-0 sm:max-w-none sm:items-stretch sm:gap-12 sm:text-start lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="flex w-full flex-col items-center sm:items-start lg:col-span-5">
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Logo size="xl" />
              <div className="text-center sm:text-start">
                <p className="font-display text-[14px] tracking-[0.2em] text-white sm:text-[15px]">BOATPRO</p>
                <p className="mt-0.5 text-[11px] text-white/60 sm:text-[12px]">{t.home.hero.tagline}</p>
              </div>
            </div>
            <p className="mt-3 max-w-sm text-[13px] leading-6 text-white/70 sm:mt-5 sm:max-w-md sm:text-sm sm:leading-7">
              {t.footer.tagline}
            </p>

            <div className="mt-4 flex w-full max-w-xs flex-col gap-2 sm:mt-7 sm:max-w-none sm:flex-row sm:flex-wrap">
              <a
                href={CONTACT.tel}
                aria-label={t.cta.callUs}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-[13px] text-white/85 transition-colors hover:border-gold hover:text-gold sm:min-h-11 sm:w-auto sm:justify-start"
              >
                <Phone size={15} aria-hidden="true" />
                <span>{t.cta.callUs}</span>
              </a>
              <a
                href={CONTACT.mailto}
                aria-label={t.contact.email}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-[13px] text-white/85 transition-colors hover:border-gold hover:text-gold sm:min-h-11 sm:w-auto sm:justify-start"
              >
                <Mail size={15} aria-hidden="true" />
                <span dir="ltr" className="truncate">
                  {CONTACT.email}
                </span>
              </a>
            </div>

            <p className="mt-4 flex items-start justify-center gap-2 text-[13px] leading-6 text-white/55 sm:mt-5 sm:justify-start sm:text-sm sm:leading-7">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <span>
                {t.contact.address}
                <br />
                {t.contact.country}
              </span>
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-7 sm:grid sm:grid-cols-2 sm:items-start sm:gap-10 lg:col-span-7 lg:gap-8">
            <div className="w-full max-w-xs sm:max-w-none">
              <p className="text-[13px] font-medium text-gold">{t.footer.links}</p>
              <div className="mx-auto mt-1 h-px w-10 bg-gold/50 sm:mx-0" />
              <nav className="mt-3 grid grid-cols-2 gap-x-3 gap-y-0 sm:mt-5 sm:gap-x-6">
                {NAV.map((item) => (
                  <Link
                    key={item.key}
                    to={item.to as never}
                    className="rounded-lg py-2 text-[13px] text-white/70 transition-colors hover:text-gold sm:py-2.5 sm:text-sm"
                  >
                    {t.nav[item.key]}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="w-full max-w-xs sm:max-w-none">
              <p className="text-[13px] font-medium text-gold">{t.footer.app}</p>
              <div className="mx-auto mt-1 h-px w-10 bg-gold/50 sm:mx-0" />
              <p className="mt-3 text-[13px] leading-6 text-white/65 sm:mt-5 sm:text-sm sm:leading-7">
                {t.footer.available}
              </p>
              <StoreButtons
                tone="hero"
                size="md"
                equal
                className="mt-3 !max-w-none !grid-cols-1 sm:mt-5 sm:!grid-cols-2"
              />
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center gap-1.5 border-t border-white/10 pt-4 text-center text-[11px] leading-5 text-white/45 sm:mt-12 sm:flex-row sm:justify-between sm:gap-3 sm:pt-6 sm:text-start sm:text-[12px] sm:leading-6">
          <p className="max-w-[18rem] sm:max-w-none">
            <Link
              to="/login"
              search={{ to: "admin" }}
              aria-label={lang === "ar" ? "دخول الإدارة" : "Staff login"}
              className="rounded-sm text-white/45 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              ©
            </Link>
            <span> {t.footer.copy.replace(/^©\s*/, "")}</span>
          </p>
          <p className="font-display tracking-[0.18em] text-white/35">BOATPRO</p>
        </div>
      </div>
    </footer>
  );
}
