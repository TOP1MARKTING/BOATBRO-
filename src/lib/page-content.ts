import { dictionaries, type Dictionary } from "./copy";
import type { PhotoName } from "../components/photo";

export type Lang = "ar" | "en";

/** CMS-managed marketing pages (extracted from actual routes). Blog posts stay in posts collection. */
export type CmsPageId = "home" | "about" | "features" | "app" | "contact" | "shared" | "blog";

export type CmsPageImages = Record<string, PhotoName>;

export type CmsLangSlice = Record<string, unknown>;

export type CmsPageDocument = {
  ar: CmsLangSlice;
  en: CmsLangSlice;
  images: CmsPageImages;
  updatedAt: Date | null;
};

export type CmsPageDefinition = {
  id: CmsPageId;
  path: string;
  /** Top-level copy.ts namespaces owned by this page */
  namespaces: (keyof Dictionary)[];
  /** seo.* keys (partial) for this page */
  seoKeys: string[];
  defaultImages: CmsPageImages;
};

export const CMS_PAGES: CmsPageDefinition[] = [
  {
    id: "home",
    path: "/",
    namespaces: ["home"],
    seoKeys: ["homeTitle", "homeDesc"],
    defaultImages: {
      hero: "luxury-sailing",
      what: "night-yacht",
      partner: "luxury-night",
      audience0: "audience-guests",
      audience1: "audience-owners",
      audience2: "audience-marinas",
    },
  },
  {
    id: "about",
    path: "/about",
    namespaces: ["aboutPage"],
    seoKeys: ["aboutTitle", "aboutDesc"],
    defaultImages: { hero: "hero-about", story: "luxury-marina" },
  },
  {
    id: "features",
    path: "/features",
    namespaces: ["featuresPage"],
    seoKeys: ["featuresTitle", "featuresDesc"],
    defaultImages: {
      hero: "hero-features",
      guest0: "service-guest-charter",
      guest1: "service-guest-booking",
      guest2: "service-guest-options",
      owner0: "service-owner-marketing",
      owner1: "service-owner-payments",
      owner2: "service-owner-logistics",
      owner3: "service-owner-growth",
      marina0: "service-marina-owners",
      marina1: "service-marina-occupancy",
      marina2: "service-marina-booking",
      marina3: "service-marina-reach",
    },
  },
  {
    id: "app",
    path: "/app",
    namespaces: ["appPage"],
    seoKeys: ["appTitle", "appDesc"],
    defaultImages: {},
  },
  {
    id: "contact",
    path: "/contact",
    namespaces: ["contact"],
    seoKeys: ["contactTitle", "contactDesc"],
    defaultImages: { hero: "hero-contact" },
  },
  {
    id: "blog",
    path: "/blog",
    namespaces: ["blog"],
    seoKeys: [],
    defaultImages: { hero: "hero-blog" },
  },
  {
    id: "shared",
    path: "*",
    namespaces: ["nav", "footer", "cta", "stores", "crumbs"],
    seoKeys: [],
    defaultImages: {},
  },
];

export const PHOTO_NAME_OPTIONS: PhotoName[] = [
  "luxury-marina",
  "luxury-dive",
  "luxury-night",
  "luxury-sailing",
  "night-yacht",
  "audience-guests",
  "audience-owners",
  "audience-marinas",
  "service-guest-charter",
  "service-guest-booking",
  "service-guest-options",
  "service-owner-marketing",
  "service-owner-payments",
  "service-owner-logistics",
  "service-owner-growth",
  "service-marina-owners",
  "service-marina-occupancy",
  "service-marina-booking",
  "service-marina-reach",
  "hero-about",
  "hero-contact",
  "hero-blog",
  "hero-features",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-merge CMS overrides onto copy.ts defaults (arrays replaced wholesale). */
export function deepMergeContent<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) || Array.isArray(override)) return override as T;
  if (!isPlainObject(base) || !isPlainObject(override)) return override as T;
  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(override)) {
    const next = override[key];
    if (next === undefined) continue;
    const current = (base as Record<string, unknown>)[key];
    if (isPlainObject(current) && isPlainObject(next) && !Array.isArray(next)) {
      result[key] = deepMergeContent(current, next);
    } else {
      result[key] = next;
    }
  }
  return result as T;
}

/**
 * Cloud Firestore does not support nested arrays (an array containing another array).
 * This recursively converts nested arrays into `{ _tuple: [...] }` objects before saving,
 * and strips any `undefined` properties.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (Array.isArray(item)) {
        return { _tuple: sanitizeForFirestore(item) };
      }
      return sanitizeForFirestore(item);
    }) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = sanitizeForFirestore(v);
      }
    }
    return out as T;
  }
  return value;
}

/**
 * Reconstructs nested arrays encoded with `{ _tuple: [...] }` when loading from Firestore.
 */
export function restoreFromFirestore<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (
        isPlainObject(item) &&
        "_tuple" in item &&
        Array.isArray((item as { _tuple: unknown })._tuple)
      ) {
        return restoreFromFirestore((item as { _tuple: unknown })._tuple);
      }
      return restoreFromFirestore(item);
    }) as unknown as T;
  }
  if (isPlainObject(value)) {
    const obj = value as Record<string, unknown>;
    if ("_tuple" in obj && Array.isArray(obj["_tuple"])) {
      return restoreFromFirestore(obj["_tuple"]) as T;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = restoreFromFirestore(v);
    }
    return out as T;
  }
  return value;
}

function pickSeoSlice(dict: Dictionary, seoKeys: string[]) {
  if (!seoKeys.length) return {};
  const slice: Record<string, string> = {};
  for (const key of seoKeys) {
    const value = dict.seo[key as keyof typeof dict.seo];
    if (typeof value === "string") slice[key] = value;
  }
  return { seo: slice };
}

export function defaultPageSlice(pageId: CmsPageId, lang: Lang): CmsLangSlice {
  const page = CMS_PAGES.find((p) => p.id === pageId);
  if (!page) return {};
  const dict = dictionaries[lang];
  const slice: CmsLangSlice = {};
  for (const ns of page.namespaces) {
    slice[ns] = structuredClone(dict[ns]) as unknown;
  }
  Object.assign(slice, pickSeoSlice(dict, page.seoKeys));
  return slice;
}

export function defaultPageImages(pageId: CmsPageId): CmsPageImages {
  const page = CMS_PAGES.find((p) => p.id === pageId);
  return page ? { ...page.defaultImages } : {};
}

export function mergePageDocument(
  pageId: CmsPageId,
  stored: Partial<CmsPageDocument> | null | undefined,
): CmsPageDocument {
  const arBase = defaultPageSlice(pageId, "ar");
  const enBase = defaultPageSlice(pageId, "en");
  return {
    ar: deepMergeContent(arBase, stored?.ar),
    en: deepMergeContent(enBase, stored?.en),
    images: { ...defaultPageImages(pageId), ...(stored?.images ?? {}) },
    updatedAt: stored?.updatedAt ?? null,
  };
}

export function buildCmsDictionary(
  lang: Lang,
  store: Partial<Record<CmsPageId, CmsPageDocument>>,
): Dictionary {
  let merged = structuredClone(dictionaries[lang]) as Dictionary;
  for (const page of CMS_PAGES) {
    const doc = store[page.id];
    if (!doc) continue;
    const slice = doc[lang];
    merged = deepMergeContent(merged, slice);
  }
  return merged;
}

export function emptyCmsStore(): Record<CmsPageId, CmsPageDocument> {
  return Object.fromEntries(
    CMS_PAGES.map((page) => [page.id, mergePageDocument(page.id, null)]),
  ) as Record<CmsPageId, CmsPageDocument>;
}

export function cmsPageLabel(pageId: CmsPageId, t: Dictionary): string {
  const labels: Record<CmsPageId, string> = {
    home: t.admin.cmsPageHome,
    about: t.admin.cmsPageAbout,
    features: t.admin.cmsPageFeatures,
    app: t.admin.cmsPageApp,
    contact: t.admin.cmsPageContact,
    blog: t.admin.cmsPageBlog,
    shared: t.admin.cmsPageShared,
  };
  return labels[pageId];
}

export function isPhotoName(value: string): value is PhotoName {
  return (PHOTO_NAME_OPTIONS as string[]).includes(value);
}

export function resolveCmsImage(
  store: Partial<Record<CmsPageId, CmsPageDocument>>,
  pageId: CmsPageId,
  key: string,
  fallback: PhotoName,
): PhotoName {
  const value = store[pageId]?.images?.[key];
  return value && isPhotoName(value) ? value : fallback;
}
