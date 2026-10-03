import type { ReactNode } from "react";
import { useLang } from "../lib/i18n";
import { useSiteSettings } from "../lib/site-settings-context";
import type { StoreApp } from "../lib/site";

export function AppleMark({ className = "size-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.36 12.76c.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81ZM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z"
      />
    </svg>
  );
}

export function PlayMark({ className = "size-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <path fill="#EA4335" d="M3.2 2.1v19.8L14 12 3.2 2.1Z" />
      <path fill="#FBBC04" d="M17.1 8.8 14 12l3.1 3.2 4.8-2.75c.54-.31.54-1.12 0-1.43L17.1 8.8Z" />
      <path fill="#4285F4" d="M3.2 21.9 14 12l3.1 3.2-13.9 6.7Z" />
      <path fill="#34A853" d="M14 12 3.2 2.1 17.1 8.8 14 12Z" />
    </svg>
  );
}

function StoreBadge({
  label,
  href,
  className,
  children,
}: {
  label: string;
  href?: string | undefined;
  className: string;
  children: ReactNode;
}) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={`${className} transition-colors hover:border-gold`}
      >
        {children}
      </a>
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      aria-disabled="true"
      className={`${className} pointer-events-none cursor-not-allowed select-none`}
    >
      {children}
    </span>
  );
}

/** Compact per-app row: app name + round App Store / Google Play icons (disabled until linked). */
export function StoreAppRow({
  app,
  label,
  tone = "hero",
  large = false,
}: {
  app: StoreApp;
  label: string;
  tone?: "hero" | "page";
  large?: boolean;
}) {
  const { t } = useLang();
  const { stores } = useSiteSettings();
  const s = t.stores;
  const links = stores[app];
  const onHero = tone === "hero";
  const icon = `inline-flex shrink-0 items-center justify-center rounded-full border bg-navy-deep ${large ? "size-10" : "size-8"}`;
  const items = [
    { href: links.appStore, aria: s.appleAria, mark: <AppleMark className={`text-white ${large ? "size-[18px]" : "size-[15px]"}`} /> },
    { href: links.playStore, aria: s.googleAria, mark: <PlayMark className={large ? "size-[17px]" : "size-[14px]"} /> },
  ];

  return (
    <div
      className={`flex items-center justify-between gap-2 border ${
        large ? "rounded-xl px-4 py-3" : "rounded-md px-2.5 py-2"
      } ${onHero ? "border-white/15 bg-white/[0.05]" : "border-border bg-card"}`}
    >
      <span
        className={`min-w-0 text-start font-medium ${large ? "text-[14px] leading-6" : "text-[12px] leading-5"} ${
          onHero ? "text-white/90" : "text-navy dark:text-white"
        }`}
      >
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        {items.map(({ href, aria, mark }) =>
          href ? (
            <a
              key={aria}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${aria} — ${label}`}
              className={`${icon} ${onHero ? "border-white/40" : "border-navy/30"} transition-colors hover:border-gold`}
            >
              {mark}
            </a>
          ) : (
            <span
              key={aria}
              role="img"
              aria-label={`${aria} — ${label} — ${s.comingChip}`}
              title={s.comingChip}
              className={`${icon} ${onHero ? "border-white/20" : "border-navy/15"} cursor-not-allowed opacity-60`}
            >
              {mark}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export function StoreButtons({
  tone = "page",
  size = "md",
  equal = false,
  className = "",
  app,
  showNotice = false,
}: {
  tone?: "hero" | "page";
  size?: "md" | "sm" | "lg";
  /** Make both store badges the same width */
  equal?: boolean;
  className?: string;
  /** Which app's store links to use; omit to show both apps (labelled) once any link is set */
  app?: StoreApp;
  /** Show coming-soon title above the store badges */
  showNotice?: boolean;
}) {
  const { t } = useLang();
  const { stores } = useSiteSettings();
  const s = t.stores;

  if (!app) {
    const allLive = (["guests", "owners"] as const).every(
      (key) => Boolean(stores[key].appStore && stores[key].playStore),
    );
    const onHero = tone === "hero";
    const large = size === "lg";
    const centered = large || className.includes("justify-center");
    const rows = (
      <div className={`grid w-full gap-2 ${size === "sm" ? "" : "sm:grid-cols-2 sm:gap-3"}`}>
        <StoreAppRow app="guests" label={s.guestsApp} tone={tone} large={large} />
        <StoreAppRow app="owners" label={s.ownersApp} tone={tone} large={large} />
      </div>
    );
    const chip = (
      <span
        className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${
          onHero ? "border-gold/40 bg-gold/15 text-gold" : "border-gold/40 bg-gold/10 text-gold-ink dark:text-gold"
        }`}
      >
        {s.comingChip}
      </span>
    );
    const titleCls = onHero ? "text-white" : "text-navy dark:text-white";
    const bodyCls = onHero ? "text-white/75" : "text-navy/70 dark:text-white/75";

    if (!showNotice || allLive) {
      return <div className={`w-full ${large ? "max-w-2xl" : "max-w-xl"} ${centered ? "mx-auto" : ""} ${className}`}>{rows}</div>;
    }

    if (size === "sm") {
      return (
        <div
          className={`w-full rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${
            onHero ? "border-white/20 bg-white/[0.08]" : "border-border bg-surface-2"
          } ${className}`}
        >
          <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="min-w-0 flex-1 text-start">
              <div className="flex flex-wrap items-center gap-1.5">
                {chip}
                <p className={`font-display text-[12px] font-semibold leading-5 sm:text-[13px] ${titleCls}`}>{s.appsTitle}</p>
              </div>
              <p className={`mt-1 text-[11px] leading-4 sm:text-[12px] sm:leading-5 ${bodyCls}`}>{s.comingBody}</p>
            </div>
            <div className="grid w-full shrink-0 gap-2 sm:grid-cols-2 md:w-auto md:min-w-[25rem]">
              <StoreAppRow app="guests" label={s.guestsApp} tone={tone} />
              <StoreAppRow app="owners" label={s.ownersApp} tone={tone} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex w-full flex-col gap-3 ${large ? "max-w-2xl" : "max-w-xl"} ${centered ? "mx-auto" : ""} ${className}`}>
        <div className={centered ? "text-center" : "text-start"}>
          <div className={`flex flex-wrap items-center gap-1.5 ${centered ? "justify-center" : ""}`}>
            {chip}
            <p className={`font-display text-[15px] font-semibold leading-6 sm:text-base ${titleCls}`}>{s.appsTitle}</p>
          </div>
          <p className={`mt-1 text-[12px] leading-5 sm:text-[13px] sm:leading-6 ${bodyCls}`}>{s.comingBody}</p>
        </div>
        {rows}
      </div>
    );
  }

  const links = stores[app ?? "guests"];
  const appleHref = links.appStore || undefined;
  const googleHref = links.playStore || undefined;
  const bothLive = Boolean(appleHref && googleHref);
  const compact = size === "sm";
  const large = size === "lg";
  const onHero = tone === "hero";

  const badge = [
    "inline-flex items-center gap-2 rounded-full",
    equal ? "w-full justify-center" : "w-auto shrink-0",
    compact ? "h-9 px-2.5 pe-3" : large ? "h-12 gap-2.5 px-3 pe-5 sm:h-[3.75rem] sm:gap-3 sm:px-4 sm:pe-7" : "h-10 px-2.5 pe-3.5",
    onHero
      ? "border border-white/55 bg-navy-deep/45 text-white/85 opacity-90"
      : "border border-gold/35 bg-card text-navy/80 opacity-90",
  ].join(" ");

  const iconBox = compact ? "size-7" : large ? "size-9 sm:size-11" : "size-7";
  const kickerCls = compact ? "text-[9px]" : large ? "text-[10px] sm:text-xs" : "text-[9px]";
  const nameCls = compact ? "text-[13px]" : large ? "text-[15px] sm:text-[17px]" : "text-[13px]";

  const iconSvg = large ? "size-4 sm:size-5" : "size-[15px]";

  const buttons = (
    <div
      className={
        equal
          ? "grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3"
          : `flex flex-wrap items-center gap-2 ${large ? "justify-center gap-2.5 sm:gap-4" : ""}`
      }
    >
      <StoreBadge
        label={appleHref ? s.appleAria : `${s.appleAria} — ${s.comingChip}`}
        href={appleHref}
        className={badge}
      >
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-navy-deep text-white ${iconBox}`}>
          <AppleMark className={iconSvg} />
        </span>
        <span className={`min-w-0 leading-none ${equal ? "text-center" : "text-start"}`}>
          <span className={`block font-medium opacity-70 ${kickerCls}`}>{s.appleKicker}</span>
          <span dir="ltr" className={`mt-0.5 block font-semibold tracking-tight ${nameCls}`}>
            {s.appleName}
          </span>
        </span>
      </StoreBadge>
      <StoreBadge
        label={googleHref ? s.googleAria : `${s.googleAria} — ${s.comingChip}`}
        href={googleHref}
        className={badge}
      >
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-navy-deep ${iconBox}`}>
          <PlayMark className={iconSvg} />
        </span>
        <span className={`min-w-0 leading-none ${equal ? "text-center" : "text-start"}`}>
          <span className={`block font-medium opacity-70 ${kickerCls}`}>{s.googleKicker}</span>
          <span dir="ltr" className={`mt-0.5 block font-semibold tracking-tight ${nameCls}`}>
            {s.googleName}
          </span>
        </span>
      </StoreBadge>
    </div>
  );

  if (!showNotice || bothLive) {
    return <div className={className}>{buttons}</div>;
  }

  if (onHero && compact) {
    return (
      <div
        className={`w-full rounded-xl border border-white/20 bg-white/[0.08] px-3 py-2.5 sm:px-4 sm:py-3 ${className}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex shrink-0 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold leading-none text-gold">
                {s.comingChip}
              </span>
              <p className="font-display text-[12px] font-semibold leading-5 text-white sm:text-[13px]">
                {s.comingTitle}
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-white/75 sm:text-[12px] sm:leading-5">{s.comingBody}</p>
          </div>
          <div className="shrink-0 sm:ms-1">{buttons}</div>
        </div>
      </div>
    );
  }

  const noticeAlign = equal || large || className.includes("justify-center") ? "text-center" : "text-start";
  const titleCls = onHero
    ? "font-display text-[15px] font-semibold leading-6 text-white sm:text-base"
    : "font-display text-[15px] font-semibold leading-6 text-navy dark:text-white sm:text-base";
  const bodyCls = onHero
    ? "mt-1 text-[12px] leading-5 text-white/80 sm:text-[13px] sm:leading-6"
    : "mt-1 text-[12px] leading-5 text-navy/70 dark:text-white/75 sm:text-[13px] sm:leading-6";
  const chipCls = onHero
    ? "text-[11px] font-semibold text-gold"
    : "text-[11px] font-semibold text-gold-ink dark:text-gold";

  return (
    <div className={`flex w-full flex-col gap-3 ${className}`}>
      <div className={noticeAlign}>
        <p className={chipCls}>{s.comingChip}</p>
        <p className={`mt-1 ${titleCls}`}>{s.comingTitle}</p>
        <p className={bodyCls}>{s.comingBody}</p>
      </div>
      <div className={equal || large || className.includes("justify-center") ? "flex justify-center" : ""}>
        {buttons}
      </div>
    </div>
  );
}
