import { Link } from "@tanstack/react-router";
import { ExternalLink, Mail, MapPin, Phone, Shield, X } from "lucide-react";
import { useEffect, useId, useState, type CSSProperties } from "react";
import { listLicenses, type License } from "../lib/db";
import { useLang } from "../lib/i18n";
import { useSiteSettings } from "../lib/site-settings-context";
import { NAV } from "../lib/nav";
import { Logo, SHELL } from "./brand";
import { SocialLinksRow } from "./social-links";
import { StoreAppRow } from "./store-buttons";

function ProtectedLicenseImage({
  src,
  alt,
  watermark,
  className,
  fit = "contain",
  showWatermark = true,
}: {
  src: string;
  alt: string;
  watermark?: string;
  className?: string;
  fit?: "contain" | "cover";
  showWatermark?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden select-none ${className ?? ""}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`pointer-events-none h-full w-full select-none ${fit === "cover" ? "object-cover" : "object-contain"}`}
        style={{ WebkitUserDrag: "none", userSelect: "none" } as CSSProperties}
      />
      <div aria-hidden="true" className="absolute inset-0 z-[1]" />
      {showWatermark && watermark ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-navy-deep/75 to-transparent px-2 py-1.5 text-center text-[10px] font-medium tracking-wide text-white/75"
        >
          {watermark}
        </div>
      ) : null}
    </div>
  );
}

export function SiteFooter() {
  const { lang, t } = useLang();
  const { settings, contact, stores } = useSiteSettings();
  const storesAllLive = Object.values(stores).every((links) => Boolean(links.appStore && links.playStore));
  const [licensesOpen, setLicensesOpen] = useState(false);
  const [licenses, setLicenses] = useState<License[] | null>(null);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licensesError, setLicensesError] = useState(false);
  const licensesTitleId = useId();

  useEffect(() => {
    if (!licensesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLicensesOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [licensesOpen]);

  useEffect(() => {
    if (licenses !== null) return;

    let cancelled = false;
    setLicensesLoading(true);
    setLicensesError(false);

    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      setLicensesError(true);
      setLicenses([]);
      setLicensesLoading(false);
    }, 8000);

    void listLicenses()
      .then((items) => {
        if (cancelled) return;
        window.clearTimeout(timeout);
        setLicenses(items);
        setLicensesLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        window.clearTimeout(timeout);
        setLicensesError(true);
        setLicenses([]);
        setLicensesLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
    // Prefetch once when the footer mounts so the modal opens ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className={`${SHELL} relative py-5 sm:py-6 lg:py-7`}>
        <div className="grid grid-cols-1 gap-5 text-center sm:grid-cols-2 sm:gap-6 sm:text-start lg:grid-cols-4 lg:items-start lg:gap-6">
          <div className="flex flex-col items-center sm:items-start">
            <Logo size="xl" />
            <div className="mt-2.5 text-center sm:text-start">
              <p className="font-display text-[16px] tracking-[0.2em] text-white sm:text-[17px]">BOATPRO</p>
              <p className="mt-1.5 text-[12px] leading-5 text-white/65 sm:text-[13px]">{t.home.hero.tagline}</p>
            </div>
            <button
              type="button"
              onClick={() => setLicensesOpen(true)}
              className="mt-3.5 inline-flex min-h-9 items-center justify-center rounded-full border border-gold/45 bg-gold/10 px-4 text-[13px] font-medium text-gold transition-colors hover:border-gold hover:bg-gold/20 sm:min-h-10 sm:px-5 sm:text-[14px]"
            >
              {t.footer.viewLicenses}
            </button>
          </div>

          <div className="flex flex-col items-center sm:col-span-2 lg:col-span-2">
            <p className="text-[14px] font-medium text-gold sm:text-[15px]">{t.footer.links}</p>
            <div className="mt-1.5 h-px w-11 bg-gold/50" />
            <div className="mt-4 flex items-start justify-center gap-10 sm:gap-14">
              <nav className="flex w-[8rem] flex-col items-center gap-0.5 text-center sm:w-[9rem]">
                {NAV.slice(0, 3).map((item) => (
                  <Link
                    key={item.key}
                    to={item.to as never}
                    className="rounded-md py-2 text-[14px] text-white/75 transition-colors hover:text-gold sm:py-2.5 sm:text-[15px]"
                  >
                    {t.nav[item.key]}
                  </Link>
                ))}
              </nav>
              <nav className="flex w-[8rem] flex-col items-center gap-0.5 text-center sm:w-[9rem]">
                {NAV.slice(3).map((item) => (
                  <Link
                    key={item.key}
                    to={item.to as never}
                    className="rounded-md py-2 text-[14px] text-white/75 transition-colors hover:text-gold sm:py-2.5 sm:text-[15px]"
                  >
                    {t.nav[item.key]}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gold sm:text-[12px]">{t.footer.app}</p>
            <div className="mx-auto mt-1 h-px w-8 bg-gold/50 sm:mx-0" />
            <div className="mt-2.5 w-full min-w-0 rounded-lg border border-white/15 bg-white/[0.06] p-3 text-start">
              {storesAllLive ? null : (
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-gold/35 bg-gold/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gold">
                    {t.stores.comingChip}
                  </span>
                  <p className="font-display text-[12px] font-semibold leading-5 text-white">{t.stores.appsTitle}</p>
                </div>
              )}
              <div className="space-y-2">
                <StoreAppRow app="guests" label={t.stores.guestsApp} />
                <StoreAppRow app="owners" label={t.stores.ownersApp} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-3 border-t border-white/10 pt-4 text-center sm:mt-6">
          <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-2.5">
            <p className="text-[11px] font-medium text-gold sm:text-[12px]">{t.contact.office}</p>
            <a
              href={contact.tel}
              aria-label={t.cta.callUs}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-[12px] text-white/85 transition-colors hover:border-gold hover:text-gold"
            >
              <Phone size={13} aria-hidden="true" />
              <span>{t.cta.callUs}</span>
            </a>
            <a
              href={contact.mailto}
              aria-label={t.contact.email}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-[12px] text-white/85 transition-colors hover:border-gold hover:text-gold"
            >
              <Mail size={13} aria-hidden="true" />
              <span dir="ltr" className="truncate">
                {contact.email}
              </span>
            </a>
            <SocialLinksRow social={settings.social} className="justify-center [&_a]:size-8" />
          </div>
          <p className="flex max-w-xl items-center justify-center gap-1.5 text-[11px] leading-5 text-white/55 sm:text-[12px]">
            <MapPin size={13} className="shrink-0 text-gold" aria-hidden="true" />
            <span>
              {t.contact.address} — {t.contact.country}
            </span>
          </p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-white/10 pt-3.5 text-center text-[10px] leading-5 text-white/45 sm:mt-5 sm:pt-4 sm:text-[11px]">
          <p className="max-w-xl px-2">
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
          <a
            href="https://www.top1markting.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.footer.designedBy} Top1Markting`}
            className="group mt-1 inline-flex items-center gap-2.5 rounded-full border border-white/70 bg-white py-1.5 ps-2.5 pe-4 text-[#0b2a5b] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <img src="/top1-mark.png" alt="" width={112} height={81} className="h-7 w-auto" loading="lazy" decoding="async" />
            <span className="text-[12px] font-medium text-slate-500 sm:text-[13px]">{t.footer.designedBy}</span>
            <span dir="ltr" className="text-[14px] font-extrabold tracking-tight sm:text-[15px]">
              Top<span className="text-[#f5a623]">1</span>Markting
            </span>
            <ExternalLink size={14} aria-hidden="true" className="text-slate-500 transition-colors group-hover:text-[#0b2a5b]" />
          </a>
        </div>
      </div>

      {licensesOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label={t.footer.licensesClose}
            className="absolute inset-0 bg-[#020a14]/72 backdrop-blur-md"
            onClick={() => setLicensesOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={licensesTitleId}
            className="relative max-h-[min(90vh,40rem)] w-full max-w-[26rem] overflow-hidden rounded-[1.75rem] border border-white/12 bg-gradient-to-b from-[#0b1c30] via-[#071526] to-[#050f1c] shadow-[0_40px_80px_-28px_rgba(0,0,0,0.75)] sm:max-w-lg"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-16 -top-20 size-48 rounded-full bg-gold/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -start-10 bottom-0 size-40 rounded-full bg-sea/20 blur-3xl"
            />

            <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10 text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Shield size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 id={licensesTitleId} className="font-display text-lg font-semibold tracking-wide text-gold sm:text-xl">
                    {t.footer.licensesTitle}
                  </h2>
                  <div className="mt-1.5 h-px w-12 bg-gradient-to-l from-gold to-transparent" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLicensesOpen(false)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/65 transition-colors hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                aria-label={t.footer.licensesClose}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="relative max-h-[min(70vh,30rem)] space-y-3 overflow-y-auto px-4 py-4 sm:space-y-3.5 sm:px-5 sm:py-5">
              {licensesLoading ? (
                <>
                  <div className="h-[5.5rem] animate-pulse rounded-2xl bg-white/[0.06]" />
                  <div className="h-[5.5rem] animate-pulse rounded-2xl bg-white/[0.06]" />
                </>
              ) : null}

              {!licensesLoading && (licensesError || !licenses?.length) ? (
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center text-[13px] leading-6 text-white/65">
                  {t.footer.licensesEmpty}
                </p>
              ) : null}

              {!licensesLoading && licenses?.length
                ? licenses.map((item) => {
                    const title = lang === "ar" ? item.name.ar || item.name.en : item.name.en || item.name.ar;
                    return (
                      <article
                        key={item.id}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] text-start shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-gold/30 hover:bg-white/[0.05]"
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-y-3 start-0 w-0.5 rounded-full bg-gradient-to-b from-gold/80 via-gold/35 to-transparent opacity-80"
                        />
                        <div className="flex items-stretch gap-3 p-3.5 sm:gap-4 sm:p-4">
                          <div className="flex size-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.55)] sm:size-[4.75rem]">
                            {item.authorityIconUrl ? (
                              <ProtectedLicenseImage
                                src={item.authorityIconUrl}
                                alt={title}
                                className="size-full scale-[1.28]"
                                fit="cover"
                                showWatermark={false}
                              />
                            ) : (
                              <Shield size={26} className="text-[#0a1628]/45" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 py-0.5">
                            <p className="text-[13px] font-semibold leading-6 text-white sm:text-[14px] sm:leading-6">
                              {title || "—"}
                            </p>
                            <div className="flex items-center gap-2.5 rounded-xl border border-gold/20 bg-gradient-to-l from-gold/15 to-gold/[0.05] px-3 py-2">
                              <span className="size-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.55)]" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium leading-none tracking-wide text-white/50">
                                  {t.footer.licensesNumberLabel}
                                </p>
                                <p
                                  dir="ltr"
                                  className="mt-1 font-mono text-[13px] font-semibold tracking-[0.08em] text-gold sm:text-[14px]"
                                >
                                  {item.number || "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
