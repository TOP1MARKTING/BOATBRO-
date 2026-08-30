import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useLang } from "../lib/i18n";
import { useSiteSettings } from "../lib/site-settings-context";

function AppleMark({ className = "size-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.36 12.76c.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81ZM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z"
      />
    </svg>
  );
}

function PlayMark({ className = "size-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <path fill="#EA4335" d="M3.2 2.1v19.8L14 12 3.2 2.1Z" />
      <path fill="#FBBC04" d="M17.1 8.8 14 12l3.1 3.2 4.8-2.75c.54-.31.54-1.12 0-1.43L17.1 8.8Z" />
      <path fill="#4285F4" d="M3.2 21.9 14 12l3.1 3.2-13.9 6.7Z" />
      <path fill="#34A853" d="M14 12 3.2 2.1 17.1 8.8 14 12Z" />
    </svg>
  );
}

function StoreLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith("https://")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to="/app" aria-label={label} className={className}>
      {children}
    </Link>
  );
}

export function StoreButtons({
  tone = "page",
  size = "md",
  equal = false,
  className = "",
  appStoreUrl,
  playStoreUrl,
}: {
  tone?: "hero" | "page";
  size?: "md" | "sm" | "lg";
  /** Make both store badges the same width */
  equal?: boolean;
  className?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}) {
  const { t } = useLang();
  const { stores: siteStores } = useSiteSettings();
  const s = t.stores;
  const appStore = appStoreUrl ?? siteStores.appStore;
  const playStore = playStoreUrl ?? siteStores.playStore;
  const compact = size === "sm";
  const large = size === "lg";
  const onHero = tone === "hero";

  const badge = [
    "inline-flex items-center gap-2 rounded-full transition-all duration-300",
    equal ? "w-full justify-center" : "w-auto shrink-0",
    compact ? "h-9 px-2.5 pe-3" : large ? "h-12 gap-2.5 px-3 pe-5 sm:h-[3.75rem] sm:gap-3 sm:px-4 sm:pe-7" : "h-10 px-2.5 pe-3.5",
    onHero
      ? "border border-white/70 bg-navy-deep/55 text-white shadow-sm backdrop-blur-sm hover:border-gold hover:bg-gold"
      : "border border-gold/40 bg-card text-navy hover:border-gold hover:bg-gold hover:text-white",
  ].join(" ");

  const iconBox = compact ? "size-7" : large ? "size-9 sm:size-11" : "size-7";
  const kickerCls = compact ? "text-[9px]" : large ? "text-[10px] sm:text-xs" : "text-[9px]";
  const nameCls = compact ? "text-[13px]" : large ? "text-[15px] sm:text-[17px]" : "text-[13px]";

  const iconSvg = large ? "size-4 sm:size-5" : "size-[15px]";

  return (
    <div
      className={`${
        equal
          ? "grid max-w-md grid-cols-2 gap-2.5 sm:gap-3"
          : `flex flex-wrap items-center gap-2 ${large ? "justify-center gap-2.5 sm:gap-4" : ""}`
      } ${className}`}
    >
      <StoreLink href={appStore} label={s.appleAria} className={`${badge} group`}>
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-navy-deep text-white group-hover:bg-white/15 group-hover:text-white ${iconBox}`}
        >
          <AppleMark className={iconSvg} />
        </span>
        <span className={`min-w-0 leading-none ${equal ? "text-center" : "text-start"}`}>
          <span className={`block font-medium opacity-70 ${kickerCls}`}>{s.appleKicker}</span>
          <span dir="ltr" className={`mt-0.5 block font-semibold tracking-tight ${nameCls}`}>
            {s.appleName}
          </span>
        </span>
      </StoreLink>
      <StoreLink href={playStore} label={s.googleAria} className={`${badge} group`}>
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-navy-deep group-hover:bg-white/15 ${iconBox}`}>
          <PlayMark className={iconSvg} />
        </span>
        <span className={`min-w-0 leading-none ${equal ? "text-center" : "text-start"}`}>
          <span className={`block font-medium opacity-70 ${kickerCls}`}>{s.googleKicker}</span>
          <span dir="ltr" className={`mt-0.5 block font-semibold tracking-tight ${nameCls}`}>
            {s.googleName}
          </span>
        </span>
      </StoreLink>
    </div>
  );
}
