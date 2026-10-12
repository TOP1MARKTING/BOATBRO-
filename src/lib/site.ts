import { DEFAULT_LOCALE, LOCALES, getUrlLang, localizePath } from "./locale-url";
import type { Lang } from "./page-content";

export const PRODUCTION_ORIGIN = "https://boatpro.club";

export const SITE_ORIGIN = (
  typeof import.meta.env["VITE_SITE_URL"] === "string" && import.meta.env["VITE_SITE_URL"]
    ? import.meta.env["VITE_SITE_URL"]
    : PRODUCTION_ORIGIN
).replace(/\/$/, "");

export const CONTACT = {
  email: "Info@boatpro.club",
  mailto: "mailto:Info@boatpro.club",
  whatsapp: "https://wa.me/966502554747",
  phoneDisplay: "00966502554747",
  tel: "tel:+966502554747",
} as const;

function envHttps(key: string) {
  const value = import.meta.env[key];
  return typeof value === "string" && value.startsWith("https://") ? value : "";
}

export type StoreApp = "guests" | "owners";
export type StoreLinks = { appStore: string; playStore: string };

/** Official store URLs per app — empty until published (badges stay "coming soon"). */
export const STORES: Record<StoreApp, StoreLinks> = {
  /** تطبيق الباحثين عن مغامرة بحرية */
  guests: {
    appStore: envHttps("VITE_GUESTS_APP_STORE_URL"),
    playStore: envHttps("VITE_GUESTS_PLAY_STORE_URL"),
  },
  /** تطبيق ملاك القوارب واليخوت ومقدمي الخدمات البحرية */
  owners: {
    appStore: envHttps("VITE_OWNERS_APP_STORE_URL"),
    playStore: envHttps("VITE_OWNERS_PLAY_STORE_URL"),
  },
};

/**
 * موقع ملاك المراسي ومحطات الوقود ومراكز الصيانة (دومين مختلف عن الموقع التسويقي).
 * يُضبط من لوحة التحكم أو عبر VITE_MARINAS_LOGIN_URL.
 */
export const SERVICE_LOGIN_URLS = {
  marinas: envHttps("VITE_MARINAS_LOGIN_URL") || "https://boatpro.club/Console/#/login",
} as const;

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  noindex?: boolean;
  /** Languages this page exists in (defaults to all); the others get no hreflang and canonicalize away. */
  langs?: readonly Lang[];
  article?: {
    publishedTime?: string | undefined;
    modifiedTime?: string | undefined;
    section?: string | undefined;
    tags?: string[] | undefined;
  };
};

const DEFAULT_OG_IMAGE = "/og.jpg";

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized === "/" ? "/" : normalized}`;
}

/** Absolute URL of a public page in the given language (`/about` → `https://…/en/about`). */
export function localizedUrl(path: string, lang: Lang) {
  return absoluteUrl(localizePath(path, lang));
}

/** Crawlers need an absolute http(s) URL; inline data URLs and empty values fall back to the site image. */
export function shareImageUrl(image?: string) {
  const value = image?.trim() ?? "";
  if (/^https?:\/\//i.test(value)) return value;
  if (!value || value.startsWith("data:")) return `${PRODUCTION_ORIGIN}${DEFAULT_OG_IMAGE}`;
  return `${PRODUCTION_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

export function pageHead({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  noindex,
  langs = LOCALES,
  article,
}: PageSeoInput) {
  const lang = getUrlLang();
  const pageLangs = langs.length ? langs : LOCALES;
  const canonicalLang = pageLangs.includes(lang) ? lang : pageLangs[0]!;
  const url = localizedUrl(path, canonicalLang);
  const alternates =
    noindex || pageLangs.length < 2
      ? []
      : [
          ...pageLangs.map((code) => ({
            rel: "alternate",
            hrefLang: code,
            href: localizedUrl(path, code),
          })),
          {
            rel: "alternate",
            hrefLang: "x-default",
            href: localizedUrl(
              path,
              pageLangs.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : pageLangs[0]!,
            ),
          },
        ];
  const img = shareImageUrl(image);
  const isDefaultImage = img === `${PRODUCTION_ORIGIN}${DEFAULT_OG_IMAGE}`;
  const alt = imageAlt?.trim() || title;
  const otherLang = pageLangs.find((code) => code !== lang);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:image:alt", content: alt },
      ...(isDefaultImage
        ? [
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
      { property: "og:locale", content: lang === "ar" ? "ar_SA" : "en_US" },
      ...(otherLang
        ? [{ property: "og:locale:alternate", content: otherLang === "ar" ? "ar_SA" : "en_US" }]
        : []),
      { property: "og:site_name", content: "BoatPro" },
      ...(type === "article" && article
        ? [
            ...(article.publishedTime
              ? [{ property: "article:published_time", content: article.publishedTime }]
              : []),
            ...(article.modifiedTime
              ? [{ property: "article:modified_time", content: article.modifiedTime }]
              : []),
            ...(article.section ? [{ property: "article:section", content: article.section }] : []),
            ...(article.tags ?? []).map((tag) => ({ property: "article:tag", content: tag })),
          ]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
      { name: "twitter:image:alt", content: alt },
    ],
    links: noindex ? [] : [{ rel: "canonical", href: url }, ...alternates],
  };
}

export function isValidPhone(raw: string) {
  const digits = raw.trim().replace(/\D/g, "");
  if (!digits) return false;
  if (/^(?:00966|966)?0?5\d{8}$/.test(digits)) return true;
  return digits.length >= 8 && digits.length <= 15;
}

/** Normalize a phone to international digits (no +), preferring Saudi (+966) when local. */
export function normalizePhoneDigits(raw: string) {
  let digits = raw.trim().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = `966${digits.slice(1)}`;
  else if (digits.length === 9 && digits.startsWith("5")) digits = `966${digits}`;
  return digits;
}

export function phoneToTelHref(raw: string) {
  const digits = normalizePhoneDigits(raw);
  return digits ? `tel:+${digits}` : `tel:${raw.trim()}`;
}

export function phoneToWhatsAppUrl(raw: string) {
  const digits = normalizePhoneDigits(raw);
  return digits ? `https://wa.me/${digits}` : "https://wa.me/";
}

export function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function formatDisplayDate(date: Date | null, lang: "ar" | "en") {
  if (!date) return "";
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
