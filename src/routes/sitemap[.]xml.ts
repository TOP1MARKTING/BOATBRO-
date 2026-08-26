import { createFileRoute } from "@tanstack/react-router";
import { listPublishedPosts } from "../lib/db";
import { PRODUCTION_ORIGIN } from "../lib/site";

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlEntry(loc: string) {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n  </url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = ["/", "/about", "/features", "/app", "/contact", "/blog"];
        let postPaths: string[] = [];
        try {
          const posts = await listPublishedPosts();
          postPaths = posts
            .filter((p) => p.published && p.slug)
            .map((p) => `/blog/${p.slug}`);
        } catch {
          postPaths = [];
        }

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPaths, ...postPaths].map((p) => urlEntry(`${PRODUCTION_ORIGIN}${p === "/" ? "/" : p}`)).join("\n")}
</urlset>
`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
