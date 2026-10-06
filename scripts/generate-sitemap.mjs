import fs from "node:fs";
import path from "node:path";
import { fetchPublishedBlogSlugs } from "./fetch-published-blog-slugs.mjs";

const origin = (process.env.VITE_SITE_URL || "https://boatpro.club").replace(/\/$/, "");
const staticPaths = ["/", "/about", "/features", "/app", "/contact", "/blog"];
const locales = ["ar", "en"];
const defaultLocale = "ar";

function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Matches the prerendered folders (`/ar/about/index.html`) so every URL answers 200 without a redirect. */
function localizedUrl(p, lang) {
  return `${origin}/${lang}${p === "/" ? "" : p}/`;
}

function urlEntry(p, lang) {
  const alternates = [
    ...locales.map((code) => ({ hreflang: code, href: localizedUrl(p, code) })),
    { hreflang: "x-default", href: localizedUrl(p, defaultLocale) },
  ]
    .map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${xmlEscape(alt.href)}" />`)
    .join("\n");
  return `  <url>\n    <loc>${xmlEscape(localizedUrl(p, lang))}</loc>\n${alternates}\n  </url>`;
}

const slugs = await fetchPublishedBlogSlugs();
const paths = [...new Set([...staticPaths, ...slugs.map((slug) => `/blog/${slug}`)])];
const entries = paths.flatMap((p) => locales.map((lang) => urlEntry(p, lang)));
const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;

const targets = [path.resolve("dist/sitemap.xml"), path.resolve("public/sitemap.xml")];
for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body, "utf8");
  console.log(`Wrote ${target} (${entries.length} URLs)`);
}
