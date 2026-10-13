import fs from "node:fs";
import path from "node:path";
import { fetchPublishedBlogPosts } from "./fetch-published-blog-slugs.mjs";
import { discoverPublicRoutes } from "./public-routes.mjs";

const origin = (process.env.VITE_SITE_URL || "https://boatpro.club").replace(/\/$/, "");
const staticPaths = discoverPublicRoutes();
const locales = ["ar", "en"];
const defaultLocale = "ar";

function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Matches the prerendered folders (`/ar/about/index.html`) so every URL answers 200 without a redirect. */
function localizedUrl(p, lang) {
  const encoded = p.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${origin}/${lang}${p === "/" ? "" : encoded}/`;
}

function urlEntry(p, lang, { langs = locales, lastmod = "", image = "" } = {}) {
  const alternates =
    langs.length < 2
      ? []
      : [
          ...langs.map((code) => ({ hreflang: code, href: localizedUrl(p, code) })),
          { hreflang: "x-default", href: localizedUrl(p, langs.includes(defaultLocale) ? defaultLocale : langs[0]) },
        ];
  const lines = [`    <loc>${xmlEscape(localizedUrl(p, lang))}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
  for (const alt of alternates) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${xmlEscape(alt.href)}" />`);
  }
  if (image) {
    lines.push(`    <image:image><image:loc>${xmlEscape(image)}</image:loc></image:image>`);
  }
  return `  <url>\n${lines.join("\n")}\n  </url>`;
}

const posts = (await fetchPublishedBlogPosts()).filter((post) => !post.noindex);
const latestPost = posts.map((post) => post.lastmod).sort().at(-1) ?? "";
const entries = [
  ...staticPaths.flatMap((p) =>
    locales.map((lang) => urlEntry(p, lang, { lastmod: p === "/blog" ? latestPost : "" })),
  ),
  ...posts.flatMap((post) =>
    post.langs.map((lang) =>
      urlEntry(`/blog/${post.slug}`, lang, {
        langs: post.langs,
        lastmod: post.lastmod,
        image: post.images[lang] ?? "",
      }),
    ),
  ),
];
const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>
`;

const targets = [path.resolve("dist/sitemap.xml"), path.resolve("public/sitemap.xml")];
for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body, "utf8");
  console.log(`Wrote ${target} (${entries.length} URLs)`);
}

const routeManifest = `${JSON.stringify({ routes: staticPaths }, null, 2)}\n`;
for (const target of [path.resolve("dist/seo/public-routes.json"), path.resolve("public/seo/public-routes.json")]) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, routeManifest, "utf8");
  console.log(`Wrote ${target} (${staticPaths.length} public routes)`);
}
