import fs from "node:fs";
import path from "node:path";
import { fetchPublishedBlogPosts } from "./fetch-published-blog-slugs.mjs";
import { discoverPublicRoutes } from "./public-routes.mjs";

const origin = (process.env.VITE_SITE_URL || "https://boatpro.club").replace(/\/$/, "");
const staticPaths = discoverPublicRoutes();
const locales = ["ar", "en"];

function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Matches the prerendered folders (`/ar/about/index.html`) so every URL answers 200 without a redirect. */
function localizedUrl(p, lang) {
  const encoded = p.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${origin}/${lang}${p === "/" ? "" : encoded}/`;
}

function urlEntry(p, lang, { lastmod = "", changefreq = "monthly", priority = "0.7" } = {}) {
  const lines = [`    <loc>${xmlEscape(localizedUrl(p, lang))}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
  lines.push(`    <changefreq>${changefreq}</changefreq>`);
  lines.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${lines.join("\n")}\n  </url>`;
}

const posts = (await fetchPublishedBlogPosts()).filter((post) => !post.noindex);
const latestPost = posts.map((post) => post.lastmod).filter(Boolean).sort().at(-1) ?? "";
const pageHints = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/about": { changefreq: "monthly", priority: "0.8" },
  "/features": { changefreq: "weekly", priority: "0.9" },
  "/app": { changefreq: "monthly", priority: "0.7" },
  "/contact": { changefreq: "monthly", priority: "0.85" },
  "/blog": { changefreq: "weekly", priority: "0.75" },
};
const entries = [
  ...staticPaths.flatMap((p) =>
    locales.map((lang) =>
      urlEntry(p, lang, { lastmod: p === "/blog" ? latestPost : "", ...pageHints[p] }),
    ),
  ),
  ...posts.flatMap((post) =>
    post.langs.map((lang) =>
      urlEntry(`/blog/${post.slug}`, lang, {
        lastmod: post.lastmod,
      }),
    ),
  ),
];
const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
