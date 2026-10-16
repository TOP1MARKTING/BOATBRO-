import type { LocationRewrite } from "@tanstack/react-router";
import type { Lang } from "./page-content";

export const LOCALES = ["ar", "en"] as const satisfies readonly Lang[];
export const DEFAULT_LOCALE: Lang = "ar";
export const LANG_STORAGE_KEY = "boatpro-lang";

/** Staff-only screens keep a single URL; their language comes from the stored preference. */
const UNLOCALIZED_PATH = /^\/(admin|login)(\/|$)/;
const LOCALE_PREFIX = /^\/(ar|en)(?=\/|$)/;

let currentUrlLang: Lang | null = null;

export function readStoredLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY) === "en" ? "en" : "ar";
  } catch {
    return DEFAULT_LOCALE;
  }
}

function trimTrailingSlash(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

export function splitLocale(pathname: string): { lang: Lang | null; path: string } {
  const match = LOCALE_PREFIX.exec(pathname);
  if (!match) return { lang: null, path: pathname };
  return { lang: match[1] as Lang, path: trimTrailingSlash(pathname.slice(match[0].length)) };
}

export function isLocalizedPath(path: string) {
  return !UNLOCALIZED_PATH.test(path);
}

/**
 * `/about` + `en` → `/en/about/`; `/` + `ar` → `/ar/`.
 * The trailing slash matches the prerendered `…/index.html` folders, so the server never redirects.
 */
export function localizePath(path: string, lang: Lang) {
  const clean = trimTrailingSlash(path.startsWith("/") ? path : `/${path}`);
  if (!isLocalizedPath(clean)) return clean;
  return clean === "/" ? `/${lang}/` : `/${lang}${clean}/`;
}

/** Language of the URL the router is currently on (defaults to Arabic for staff screens). */
export function getUrlLang(): Lang {
  return currentUrlLang ?? DEFAULT_LOCALE;
}

/**
 * The router works with unprefixed paths (`/about`); the browser shows `/ar/about` or `/en/about`.
 * `input` strips the prefix and remembers the language, `output` adds it back to every link.
 */
export const localeRewrite: LocationRewrite = {
  input: ({ url }) => {
    const { lang, path } = splitLocale(url.pathname);
    currentUrlLang = lang;
    if (!lang) return undefined;
    url.pathname = path;
    return url;
  },
  output: ({ url }) => {
    if (!isLocalizedPath(url.pathname)) return undefined;
    url.pathname = localizePath(url.pathname, currentUrlLang ?? readStoredLang());
    return url;
  },
};

/** Old unprefixed URLs (`/about`) move to the preferred language before the router boots. */
export function ensureLocalePrefix() {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  if (splitLocale(pathname).lang || !isLocalizedPath(pathname)) return;
  window.history.replaceState(
    window.history.state,
    "",
    `${localizePath(pathname, readStoredLang())}${search}${hash}`,
  );
}
