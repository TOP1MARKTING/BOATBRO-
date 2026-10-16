import { readFileSync } from "node:fs";
import { expect, test, type Page, type Response } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/about", "/features", "/app", "/contact", "/blog", "/login", "/admin"] as const;
const MISSING_SLUG = "/blog/non-existing-slug-test";

async function seo(page: Page) {
  return page.evaluate(() => {
    const content = (selector: string) => document.querySelector(selector)?.getAttribute("content") ?? null;
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((n) => n.textContent ?? "")
      .join("\n");
    return {
      title: document.title,
      description: content('meta[name="description"]'),
      robots: content('meta[name="robots"]'),
      canonical,
      ogImage: content('meta[property="og:image"]'),
      jsonLd,
    };
  });
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow").toBeLessThanOrEqual(1);
}

test.describe("FINAL QA", () => {
  test("public routes return expected HTTP, SEO, and layout", async ({ page, request }, testInfo) => {
    const statuses: Record<string, number> = {};

    for (const path of PUBLIC_ROUTES) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      const status = res?.status() ?? 0;
      statuses[path] = status;
      expect(status, path).toBe(200);

      const head = await seo(page);
      expect(head.title, `${path} title`).toBeTruthy();

      if (path === "/login" || path === "/admin") {
        expect(head.robots, `${path} robots`).toMatch(/noindex/i);
        expect(head.canonical ?? "", `${path} canonical`).not.toContain(path);
      } else {
        expect(head.description, `${path} description`).toBeTruthy();
        expect(head.canonical, `${path} canonical`).toContain("https://boatpro.club");
        expect(head.canonical, `${path} canonical path`).toContain(path === "/" ? "boatpro.club" : path);
        expect(head.robots ?? "", `${path} should be indexable`).not.toMatch(/noindex/i);
        expect(head.ogImage, `${path} og`).toMatch(/^https:\/\/boatpro\.club\/.+/);
        expect(head.jsonLd, `${path} json-ld`).toBeTruthy();
      }

      await noHorizontalOverflow(page);
    }

    console.log("HTTP", testInfo.project.name, statuses);
  });

  test("missing blog slug is a real 404", async ({ page, request }) => {
    const res = await page.goto(MISSING_SLUG, { waitUntil: "domcontentloaded" });
    expect(res?.status(), "missing slug status").toBe(404);

    const head = await seo(page);
    expect(head.robots, "404 robots").toMatch(/noindex/i);
    expect(head.canonical, "404 canonical").toBeNull();
    expect(head.jsonLd.toLowerCase(), "no article schema").not.toMatch(/"@type"\s*:\s*"article"/);
    expect(head.jsonLd.toLowerCase(), "no blogposting schema").not.toMatch(/blogposting/);

    await expect(page.getByRole("link", { name: /العودة للرئيسية|Back to home/i })).toBeVisible();
    const home = page.getByRole("link", { name: /العودة للرئيسية|Back to home/i });
    await expect(home).toHaveAttribute("href", "/");
  });

  test("published blog slug still works when posts exist", async ({ page }) => {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    const href = await page.locator('a[href^="/blog/"]').evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute("href")).find((h) => h && /^\/blog\/[^/]+$/.test(h)),
    );
    if (!href) {
      test.info().annotations.push({ type: "note", description: "No published posts to check" });
      return;
    }
    const res = await page.goto(href, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    const head = await seo(page);
    expect(head.canonical).toContain(href);
    expect(head.robots ?? "").not.toMatch(/noindex/i);
    expect(head.jsonLd.toLowerCase()).toMatch(/article/);
    expect(head.ogImage).toMatch(/^https:\/\/boatpro\.club\/.+/);
    expect(head.jsonLd).toMatch(/"image"\s*:/);
  });

  test("sitemap.xml is valid production XML", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const type = res.headers()["content-type"] ?? "";
    expect(type).toMatch(/xml/);
    expect(res.headers()["x-robots-tag"] ?? "").not.toMatch(/noindex/i);
    const body = await res.text();
    expect(body).toContain('<?xml version="1.0"');
    expect(body).toContain("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
    expect(body).toContain("<changefreq>");
    expect(body).toContain("<priority>");
    expect(body).not.toContain("xhtml:link");
    expect(body).not.toContain("image:image");
    expect(body).not.toContain("localhost");
    expect(body).not.toContain("/login");
    expect(body).not.toContain("/admin");
    expect(body).not.toContain("non-existing-slug");
    const sitemapEntries = [...body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1] ?? "");
    const sitemapUrls = sitemapEntries.map((entry) => entry.match(/<loc>([\s\S]*?)<\/loc>/)?.[1] ?? "");
    expect(sitemapEntries.length).toBeGreaterThan(0);
    expect(sitemapUrls.every(Boolean)).toBe(true);
    expect(new Set(sitemapUrls).size).toBe(sitemapUrls.length);
    for (const entry of sitemapEntries) {
      expect(entry.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]).toMatch(/^https:\/\/boatpro\.club\//);
      expect(entry.match(/<changefreq>([\s\S]*?)<\/changefreq>/)?.[1]).toMatch(
        /^(always|hourly|daily|weekly|monthly|yearly|never)$/,
      );
      const priority = Number(entry.match(/<priority>([\s\S]*?)<\/priority>/)?.[1]);
      expect(priority).toBeGreaterThanOrEqual(0);
      expect(priority).toBeLessThanOrEqual(1);
    }
    const { routes } = JSON.parse(
      readFileSync(new URL("../public/seo/public-routes.json", import.meta.url), "utf8"),
    ) as { routes: string[] };
    for (const route of routes) {
      const localizedPath = route === "/" ? "/" : `${route}/`;
      expect(body).toContain(`https://boatpro.club/ar${localizedPath}`);
      expect(body).toContain(`https://boatpro.club/en${localizedPath}`);
    }
  });

  test("robots.txt references sitemap and allows public crawl", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Sitemap: https://boatpro.club/sitemap.xml");
    expect(body).toMatch(/User-agent:\s*\*/i);
    expect(body).toMatch(/Allow:\s*\//i);
    expect(body).not.toMatch(/Disallow:\s*\/\s*(?:\r?\n|$)/i);
  });

  test("homepage images are responsive and not huge JPEGs", async ({ page }, testInfo) => {
    const transferred: { url: string; size: number; type: string }[] = [];
    page.on("response", async (res: Response) => {
      const url = res.url();
      const type = res.headers()["content-type"] ?? "";
      if (!/image\//.test(type) && !/\.(webp|avif|jpe?g|png)(\?|$)/i.test(url)) return;
      if (!url.includes("/media/") && !url.includes("/logo") && !url.includes("/favicon") && !url.includes("/og")) {
        if (/\.(jpe?g)(\?|$)/i.test(url) && /luxury-/.test(url)) {
          transferred.push({ url, size: (await res.body().catch(() => Buffer.alloc(0))).byteLength, type });
        }
        return;
      }
      const buf = await res.body().catch(() => Buffer.alloc(0));
      transferred.push({ url, size: buf.byteLength, type });
    });

    await page.goto("/", { waitUntil: "networkidle" });
    const hero = page.locator("section img").first();
    await expect(hero).toBeVisible();
    const srcset = await hero.getAttribute("srcset");
    expect(srcset, "hero srcset").toMatch(/480w/);
    expect(srcset, "hero srcset 1440").toMatch(/1440w/);

    const html = await page.content();
    expect(html).not.toMatch(/luxury-water\.[0-9a-f]+\.jpg/i);

    const media = transferred.filter((t) => t.url.includes("/media/"));
    const total = media.reduce((sum, t) => sum + t.size, 0);
    console.log("IMAGE_BYTES", testInfo.project.name, total, media.map((m) => `${m.size}:${m.url.split("/").pop()}`));

    if (testInfo.project.name === "mobile") {
      expect(total, "mobile homepage media bytes").toBeLessThan(900_000);
      for (const item of media) {
        expect(item.size, item.url).toBeLessThan(250_000);
      }
    } else {
      expect(total, "desktop homepage media bytes").toBeLessThan(1_600_000);
    }
  });

  test("hero CTAs, footer copyright, whatsapp icon, mobile nav", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const appCta = page.locator('a[href="/app"]').filter({ hasText: /تعرّف على التطبيق|See the app/ }).first();
    await expect(appCta).toBeVisible();
    const contactCta = page.locator("section").first().locator('a[href="/contact"]').filter({ hasText: /تواصل معنا|Contact us/ });
    await expect(contactCta).toBeVisible();
    await expect(page.getByRole("heading", { name: /معاينة تجربة التطبيق|Preview the app experience/ })).toHaveCount(0);

    const footer = page.locator("footer");
    await expect(footer).toContainText(/حقوق الطبع|rights reserved/i);
    const adminEntry = footer.locator('a[href*="/login"]').filter({ hasText: "©" });
    await expect(adminEntry).toHaveCount(1);
    await expect(footer.locator('a[href*="/admin"]')).toHaveCount(0);
    await expect(footer.getByRole("link", { name: /تسجيل الدخول|^Log in$/i })).toHaveCount(0);
    await expect(footer.locator('a[aria-label="واتساب"], a[aria-label="WhatsApp"]')).toBeVisible();

    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: /القائمة|Menu/ }).click();
      await expect(page.locator("#mobile-nav")).toBeVisible();
      await expect(page.locator("#mobile-nav a[href='/about']")).toBeVisible();
    }
  });

  test("features CTA is unique and contact phone validation works", async ({ page }) => {
    await page.goto("/features", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/اكتشف كيف يمكن لبوت برو دعم رحلتك البحرية|See how BoatPro can support your time on the water/)).toBeVisible();
    await expect(page.getByText(/صفحة التطبيق تشرح الواجهات/)).toHaveCount(0);

    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /معاينة تجربة التطبيق|Preview the app experience/ })).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("واجهات حقيقية لمسار الضيف والمالك");

    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await page.locator("#contact-name").fill("اختبار");
    await page.locator("#contact-phone").fill("12");
    await page.locator("#contact-email").fill("qa@example.com");
    await page.locator("#contact-content").fill("رسالة اختبار للتحقق من التحقق فقط.");
    await page.getByRole("button", { name: /إرسال الطلب|Send request/ }).click();
    await expect(page.locator("#contact-phone-error")).toBeVisible();
    await expect(page.locator("#contact-phone-error")).toContainText(/رقم هاتف|phone/i);
  });
});
