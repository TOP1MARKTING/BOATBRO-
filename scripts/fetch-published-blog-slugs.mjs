/**
 * Fetches published blog posts from Firestore at build time (public read rules).
 * Used to prerender /blog/$slug pages and to write the fallback sitemap.xml
 * (on the cPanel host /sitemap.xml is normally served live by public/seo/sitemap.php).
 */
async function runPublishedPostsQuery() {
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() || "boatpro1-18c6d";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: "posts" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "published" },
          op: "EQUAL",
          value: { booleanValue: true },
        },
      },
      limit: 500,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(
        `[build] Could not fetch blog posts (${res.status}). Blog pages will rely on client-side rendering until the next build.`,
      );
      return [];
    }

    const rows = await res.json();
    return Array.isArray(rows) ? rows.filter((row) => row.document?.name) : [];
  } catch (error) {
    console.warn(
      "[build] Blog post fetch failed. Blog pages will rely on client-side rendering until the next build.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

const str = (field) => field?.stringValue ?? "";
const localized = (field, lang) => str(field?.mapValue?.fields?.[lang]).trim();
const origin = (process.env.VITE_SITE_URL || "https://boatpro.club").replace(/\/$/, "");

function absoluteImage(value) {
  const image = value.trim();
  if (!image || image.startsWith("data:")) return "";
  return /^https?:\/\//i.test(image) ? image : `${origin}${image.startsWith("/") ? image : `/${image}`}`;
}

function firstHtmlImage(html) {
  for (const match of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    const image = absoluteImage(match[1] ?? "");
    if (image) return image;
  }
  return "";
}

function shareImage(fields, id, lang) {
  const ogImage = absoluteImage(str(fields.ogImage));
  if (ogImage) return ogImage;

  const cover = lang === "en" ? str(fields.coverUrlEn).trim() || str(fields.coverUrl).trim() : str(fields.coverUrl).trim();
  if (cover.startsWith("data:image/")) {
    return `${origin}/media/covers/${encodeURIComponent(id)}-${lang}.jpg`;
  }
  const coverUrl = absoluteImage(cover);
  if (coverUrl) return coverUrl;

  return firstHtmlImage(localized(fields.contentHtml, lang)) ||
    firstHtmlImage(localized(fields.contentHtml, "ar")) ||
    firstHtmlImage(localized(fields.contentHtml, "en")) ||
    "";
}

/** Mirrors postAvailableLangs() in src/lib/post-seo.ts. */
function availableLangs(fields) {
  const langs = ["ar", "en"].filter((lang) => {
    if (!localized(fields.titleI18n, lang)) return false;
    return str(fields.contentMode) !== "html" || Boolean(localized(fields.contentHtml, lang));
  });
  return langs.length ? langs : ["ar"];
}

/** @returns {Promise<{ slug: string; noindex: boolean; lastmod: string; langs: string[]; images: Record<string, string> }[]>} */
export async function fetchPublishedBlogPosts() {
  const rows = await runPublishedPostsQuery();
  const posts = new Map();
  for (const row of rows) {
    const doc = row.document;
    const fields = doc.fields ?? {};
    const id = doc.name.split("/").pop() ?? "";
    const slug = str(fields.slug).trim() || id;
    if (!slug || posts.has(slug)) continue;
    const stamp = fields.updatedAt?.timestampValue || fields.createdAt?.timestampValue || "";
    posts.set(slug, {
      slug,
      noindex: Boolean(fields.noindex?.booleanValue),
      lastmod: stamp ? new Date(stamp).toISOString().replace(/\.\d{3}Z$/, "Z") : "",
      langs: availableLangs(fields),
      images: Object.fromEntries(availableLangs(fields).map((lang) => [lang, shareImage(fields, id, lang)])),
    });
  }
  return [...posts.values()];
}

export async function fetchPublishedBlogSlugs() {
  return (await fetchPublishedBlogPosts()).map((post) => post.slug);
}
