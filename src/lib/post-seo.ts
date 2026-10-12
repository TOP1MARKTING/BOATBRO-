import { postPlainText, type PostInput } from "./db";
import { pickLocalized } from "./post-content";
import { PRODUCTION_ORIGIN, readingMinutes } from "./site";

export const SEO_LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descMin: 120,
  descMax: 160,
  slugMax: 75,
} as const;

export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  hint?: string | undefined;
};

export type PostSeoLabels = {
  checkTitle: string;
  checkTitleHint: string;
  checkDesc: string;
  checkDescHint: string;
  checkSlug: string;
  checkSlugHint: string;
  checkKeyword: string;
  checkKeywordHint: string;
  checkKeywordBody: string;
  checkKeywordBodyHint: string;
  checkCover: string;
  checkCoverHint: string;
  checkExcerpt: string;
  checkExcerptHint: string;
  checkBody: string;
  checkBodyHint: string;
  checkPublished: string;
  checkPublishedHint: string;
};

export function postPublicUrl(slug: string, origin = PRODUCTION_ORIGIN) {
  const clean = slug.trim() || "post";
  return `${origin.replace(/\/$/, "")}/blog/${clean}`;
}

export function resolveMetaTitle(input: PostInput, lang: "ar" | "en" = "ar") {
  const custom = pickLocalized(input.metaTitleI18n, lang);
  if (custom) return custom;
  if (input.metaTitle.trim()) return input.metaTitle.trim();
  return pickLocalized(input.titleI18n, lang, input.title);
}

export function resolveMetaDescription(input: PostInput, lang: "ar" | "en" = "ar") {
  const custom = pickLocalized(input.metaDescriptionI18n, lang);
  if (custom) return custom;
  if (input.metaDescription.trim()) return input.metaDescription.trim();
  return pickLocalized(input.excerptI18n, lang, input.excerpt);
}

export function resolveOgImage(input: Pick<PostInput, "ogImage" | "coverUrl">) {
  return (input.ogImage || input.coverUrl).trim();
}

function firstHtmlImage(html: string) {
  for (const match of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    const src = (match[1] ?? "").trim();
    if (src && !src.startsWith("data:")) return src;
  }
  return "";
}

/**
 * Absolute image for og:image / twitter:image / Article.image: dedicated share image, then the cover
 * for this language, then the first article image. Inline base64 images are never usable by crawlers.
 */
export function resolveShareImage(
  input: Pick<PostInput, "ogImage" | "coverUrl" | "coverUrlEn" | "contentHtml">,
  lang: "ar" | "en",
  origin = PRODUCTION_ORIGIN,
) {
  const candidates = [
    input.ogImage,
    lang === "en" ? input.coverUrlEn : "",
    input.coverUrl,
    firstHtmlImage(input.contentHtml[lang]),
    firstHtmlImage(input.contentHtml.ar),
    firstHtmlImage(input.contentHtml.en),
  ];
  const pick = candidates
    .map((value) => value.trim())
    .find((value) => value && !value.startsWith("data:"));
  if (!pick) return "";
  if (/^https?:\/\//i.test(pick)) return pick;
  return `${origin.replace(/\/$/, "")}${pick.startsWith("/") ? pick : `/${pick}`}`;
}

/** Languages with their own title and body; the other URL would only repeat the fallback language. */
export function postAvailableLangs(
  input: Pick<PostInput, "titleI18n" | "contentMode" | "contentHtml" | "title">,
): ("ar" | "en")[] {
  const langs = (["ar", "en"] as const).filter((lang) => {
    if (!input.titleI18n[lang].trim()) return false;
    return input.contentMode !== "html" || Boolean(input.contentHtml[lang].trim());
  });
  return langs.length ? [...langs] : ["ar"];
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function keywordInText(keyword: string, text: string) {
  if (!keyword.trim()) return false;
  return text.toLowerCase().includes(keyword.trim().toLowerCase());
}

export function analyzePostSeo(
  input: PostInput,
  labels: PostSeoLabels,
  lang: "ar" | "en" = "ar",
): { score: number; checks: SeoCheck[] } {
  const metaTitle = resolveMetaTitle(input, lang);
  const metaDesc = resolveMetaDescription(input, lang);
  const slug = input.slug.trim();
  const keyword = pickLocalized(input.focusKeywordI18n, lang, input.focusKeyword);
  const bodyText = postPlainText(input, lang);
  const excerpt = pickLocalized(input.excerptI18n, lang, input.excerpt);
  const title = pickLocalized(input.titleI18n, lang, input.title);
  const bodyWords = countWords(`${excerpt} ${bodyText}`);
  const checks: SeoCheck[] = [];

  const titleLen = metaTitle.length;
  if (titleLen >= SEO_LIMITS.titleMin && titleLen <= SEO_LIMITS.titleMax) {
    checks.push({ id: "title", label: labels.checkTitle, status: "pass" });
  } else if (titleLen > 0) {
    checks.push({
      id: "title",
      label: labels.checkTitle,
      status: "warn",
      hint: labels.checkTitleHint,
    });
  } else {
    checks.push({
      id: "title",
      label: labels.checkTitle,
      status: "fail",
      hint: labels.checkTitleHint,
    });
  }

  const descLen = metaDesc.length;
  if (descLen >= SEO_LIMITS.descMin && descLen <= SEO_LIMITS.descMax) {
    checks.push({ id: "desc", label: labels.checkDesc, status: "pass" });
  } else if (descLen > 0) {
    checks.push({
      id: "desc",
      label: labels.checkDesc,
      status: "warn",
      hint: labels.checkDescHint,
    });
  } else {
    checks.push({
      id: "desc",
      label: labels.checkDesc,
      status: "fail",
      hint: labels.checkDescHint,
    });
  }

  if (slug && slug.length <= SEO_LIMITS.slugMax && /^[\w-]+$/.test(slug)) {
    checks.push({ id: "slug", label: labels.checkSlug, status: "pass" });
  } else if (slug) {
    checks.push({
      id: "slug",
      label: labels.checkSlug,
      status: "warn",
      hint: labels.checkSlugHint,
    });
  } else {
    checks.push({
      id: "slug",
      label: labels.checkSlug,
      status: "fail",
      hint: labels.checkSlugHint,
    });
  }

  if (keyword) {
    checks.push({
      id: "keyword-title",
      label: labels.checkKeyword,
      status: keywordInText(keyword, metaTitle) ? "pass" : "warn",
      hint: keywordInText(keyword, metaTitle) ? undefined : labels.checkKeywordHint,
    });
    checks.push({
      id: "keyword-body",
      label: labels.checkKeywordBody,
      status: keywordInText(keyword, `${title} ${excerpt} ${bodyText}`) ? "pass" : "warn",
      hint: keywordInText(keyword, `${title} ${excerpt} ${bodyText}`)
        ? undefined
        : labels.checkKeywordBodyHint,
    });
  }

  checks.push({
    id: "cover",
    label: labels.checkCover,
    status: resolveOgImage(input) ? "pass" : "warn",
    hint: resolveOgImage(input) ? undefined : labels.checkCoverHint,
  });

  checks.push({
    id: "excerpt",
    label: labels.checkExcerpt,
    status: excerpt.length >= 80 ? "pass" : "warn",
    hint: excerpt.length >= 80 ? undefined : labels.checkExcerptHint,
  });

  checks.push({
    id: "body",
    label: labels.checkBody,
    status: bodyWords >= 300 ? "pass" : bodyWords >= 150 ? "warn" : "fail",
    hint: bodyWords >= 300 ? undefined : labels.checkBodyHint,
  });

  checks.push({
    id: "published",
    label: labels.checkPublished,
    status: input.published ? "pass" : "warn",
    hint: input.published ? undefined : labels.checkPublishedHint,
  });

  const score = checks.length
    ? Math.round((checks.filter((c) => c.status === "pass").length / checks.length) * 100)
    : 0;

  return { score, checks };
}

export function postReadingStats(input: PostInput) {
  const text = `${pickLocalized(input.excerptI18n, "ar")} ${postPlainText(input, "ar")}`;
  return {
    words: countWords(text),
    minutes: readingMinutes(text),
  };
}

export function charCountTone(len: number, min: number, max: number) {
  if (len >= min && len <= max) return "text-emerald-600";
  if (len === 0) return "text-muted-foreground";
  if (len > max) return "text-destructive";
  return "text-amber-600";
}
