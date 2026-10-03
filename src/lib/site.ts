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
  marinas: envHttps("VITE_MARINAS_LOGIN_URL") || "",
} as const;

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized === "/" ? "/" : normalized}`;
}

export function pageHead({
  title,
  description,
  path,
  image,
  type = "website",
  noindex,
}: PageSeoInput) {
  const url = absoluteUrl(path);
  const img =
    image && image.startsWith("http")
      ? image
      : `${PRODUCTION_ORIGIN}${image ? (image.startsWith("/") ? image : `/${image}`) : "/og.jpg"}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "ar_SA" },
      { property: "og:site_name", content: "BoatPro" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
      ...(noindex ? [{ name: "robots" as const, content: "noindex, nofollow" }] : []),
    ],
    links: noindex ? [] : [{ rel: "canonical", href: url }],
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
