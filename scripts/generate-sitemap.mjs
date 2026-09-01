import fs from "node:fs";
import path from "node:path";
import { fetchPublishedBlogSlugs } from "./fetch-published-blog-slugs.mjs";

const origin = (process.env.VITE_SITE_URL || "https://boatpro.club").replace(/\/$/, "");
const staticPaths = ["/", "/about", "/features", "/app", "/contact", "/blog"];

function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlEntry(loc) {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n  </url>`;
}

const slugs = await fetchPublishedBlogSlugs();
const paths = [
  ...new Set([...staticPaths, ...slugs.map((slug) => `/blog/${slug}`)]),
];
const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => urlEntry(`${origin}${p === "/" ? "/" : p}`)).join("\n")}
</urlset>
`;

const targets = [path.resolve("dist/sitemap.xml"), path.resolve("public/sitemap.xml")];
for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body, "utf8");
  console.log(`Wrote ${target} (${paths.length} URLs)`);
}
