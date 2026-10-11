/**
 * Post-build static prerender for Apache/cPanel.
 * Saves route HTML as dist/<route>/index.html so crawlers and hard refreshes get content.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { fetchPublishedBlogSlugs } from "./fetch-published-blog-slugs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const port = Number(process.env.PRERENDER_PORT || 4173);

const PUBLIC_ROUTES = ["/", "/about", "/features", "/app", "/contact", "/blog"];
const LOCALES = ["ar", "en"];

/** `/about` → `/ar/about/`, `/` → `/ar/` (dist/index.html stays the SPA shell for /admin and fallbacks). */
function localize(route, lang) {
  return route === "/" ? `/${lang}/` : `/${lang}${route}/`;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function createStaticServer() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0] || "/");
    let filePath = path.join(distDir, urlPath === "/" ? "index.html" : urlPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, "index.html");
    }

    res.writeHead(200, { "Content-Type": contentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });
}

function routeOutputPath(route) {
  if (route === "/") return path.join(distDir, "index.html");
  const clean = route.replace(/^\//, "").replace(/\/$/, "");
  return path.join(distDir, clean, "index.html");
}

async function waitForServerReady(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Static server did not become ready at ${url}`);
}

async function main() {
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    console.error("[prerender] dist/index.html missing — run vite build first.");
    process.exit(1);
  }

  const slugs = await fetchPublishedBlogSlugs();
  const routes = [...PUBLIC_ROUTES, ...slugs.map((slug) => `/blog/${slug}`)].flatMap((route) =>
    LOCALES.map((lang) => localize(route, lang)),
  );

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${port}`;
  await waitForServerReady(base);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  /** Firebase/analytics keep connections open — networkidle never settles. */
  async function waitForRouteReady(page) {
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        const hasContent = Boolean(root && root.children.length > 0);
        const hasMeta =
          Boolean(document.querySelector('meta[property="og:title"]')) ||
          Boolean(document.querySelector('meta[name="description"]'));
        return hasContent && hasMeta;
      },
      { timeout: 20_000 },
    );
    await page.waitForTimeout(400);
  }

  for (const route of routes) {
    const page = await context.newPage();
    try {
      await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 30_000 });
      await waitForRouteReady(page);
      // Keep stable /media/posts/… URLs in the saved HTML instead of the data URLs loaded as a fallback.
      await page.evaluate(() => {
        for (const img of document.querySelectorAll("img[data-fs-src]")) {
          img.setAttribute("src", img.dataset.fsSrc ?? "");
          img.removeAttribute("data-fs-src");
        }
      });
      let html = await page.content();
      html = html.replaceAll(`http://127.0.0.1:${port}`, "");
      const out = routeOutputPath(route);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html, "utf8");
      console.log(`[prerender] ${route} -> ${path.relative(distDir, out)}`);
    } catch (error) {
      console.warn(
        `[prerender] Skipped ${route}:`,
        error instanceof Error ? error.message : error,
      );
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log(`[prerender] Done (${routes.length} routes attempted).`);
}

main().catch((error) => {
  console.error("[prerender] Failed:", error);
  process.exit(1);
});
