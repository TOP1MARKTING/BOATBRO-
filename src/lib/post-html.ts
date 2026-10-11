import DOMPurify from "dompurify";
import { localizePath, splitLocale } from "./locale-url";
import type { Lang } from "./page-content";
import { orderedBlocksWithImages, parseLinkedText, type LocalizedText, type PostBlock } from "./post-content";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "ul", "ol", "li", "a", "h2", "h3", "h4", "blockquote", "code", "pre", "span", "div",
  "img", "figure", "figcaption", "hr", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "id", "class", "title", "src", "alt", "width", "height", "loading", "dir",
  "colspan", "rowspan",
];

let hooksReady = false;
let usedIds = new Set<string>();
let imageFallbackAlt = "";
let articleLang: Lang | null = null;

const SITE_HOST = /^(?:www\.)?boatpro\.club$/i;
const FILE_PATH = /^\/(?:media|seo|assets)\/|\.[a-z0-9]{2,5}$/i;

/**
 * Article links to boatpro.club (pasted with www, without /ar|/en, or with utm_* tracking) become the
 * same-language prefixed path, so they open in the same tab and never hit a redirect. Mirrors bp_site_link().
 */
export function siteLinkPath(href: string, lang: Lang) {
  if (!/^(?:https?:)?\/\//i.test(href) && !/^\/(?!\/)/.test(href)) return null;
  let url: URL;
  try {
    url = new URL(href, "https://boatpro.club");
  } catch {
    return null;
  }
  if (!SITE_HOST.test(url.hostname)) return null;
  for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key)) url.searchParams.delete(key);
  const { path } = splitLocale(url.pathname);
  const target = FILE_PATH.test(path) ? path : localizePath(path, lang);
  return `${target}${url.search}${url.hash}`;
}

export function slugifyHeading(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "section"
  );
}

function uniqueId(base: string) {
  let id = base;
  let n = 2;
  while (usedIds.has(id)) id = `${base}-${n++}`;
  usedIds.add(id);
  return id;
}

function ensureHooks() {
  if (hooksReady) return;
  hooksReady = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    const el = node as Element;
    const tag = el.tagName?.toLowerCase();
    if (tag === "a") {
      let href = el.getAttribute("href") ?? "";
      const sitePath = articleLang ? siteLinkPath(href, articleLang) : null;
      if (sitePath) {
        href = sitePath;
        el.setAttribute("href", href);
      }
      if (/^https?:\/\//i.test(href)) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.removeAttribute("target");
      }
    }
    if (tag === "img") {
      el.setAttribute("loading", "lazy");
      el.setAttribute("decoding", "async");
      if (!el.getAttribute("alt")?.trim()) {
        const caption = el.closest("figure")?.querySelector("figcaption")?.textContent?.trim();
        el.setAttribute("alt", caption || imageFallbackAlt);
      }
    }
    if (tag === "h2" || tag === "h3") {
      const existing = el.getAttribute("id");
      el.setAttribute("id", uniqueId(existing || slugifyHeading(el.textContent ?? "")));
    }
  });
}

/** Sanitize author HTML for public rendering. Browser-only (the site and prerender run in a real DOM). */
export function sanitizePostHtml(html: string, fallbackAlt = "", lang: Lang | null = null) {
  if (!html.trim() || typeof window === "undefined") return "";
  ensureHooks();
  usedIds = new Set();
  imageFallbackAlt = fallbackAlt.trim();
  articleLang = lang;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [...ALLOWED_ATTR, "decoding"],
    ALLOW_DATA_ATTR: false,
  });
}

export function htmlPlainText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlHeadings(html: string) {
  const out: { level: 2 | 3; text: string; id: string }[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi)) {
    const text = htmlPlainText(match[3] ?? "");
    if (!text) continue;
    const explicit = /\sid=["']([^"']+)["']/i.exec(match[2] ?? "")?.[1];
    let id = explicit || slugifyHeading(text);
    let n = 2;
    while (seen.has(id)) id = `${explicit || slugifyHeading(text)}-${n++}`;
    seen.add(id);
    out.push({ level: match[1] === "3" ? 3 : 2, text, id });
  }
  return out;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type FigureSize = "full" | "medium" | "small";

export function buildFigureHtml(url: string, alt: string, caption: string, size: FigureSize) {
  const captionHtml = caption.trim() ? `\n  <figcaption>${escapeHtml(caption.trim())}</figcaption>` : "";
  return `<figure class="bp-figure bp-figure--${size}">\n  <img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />${captionHtml}\n</figure>`;
}

function linkedTextToHtml(text: string) {
  return parseLinkedText(text)
    .map((part) =>
      part.kind === "text"
        ? escapeHtml(part.value).replace(/\n/g, "<br />")
        : `<a href="${escapeHtml(part.href)}">${escapeHtml(part.label)}</a>`,
    )
    .join("");
}

/** Convert legacy block content to HTML so authors can switch an old post to the HTML editor. */
export function blocksToHtml(blocks: PostBlock[], lang: keyof LocalizedText) {
  return orderedBlocksWithImages(blocks)
    .map((block) => {
      if (block.type === "image") {
        if (!block.url) return "";
        return buildFigureHtml(block.url, block.alt[lang], block.caption[lang], "full");
      }
      const text = block.text[lang].trim();
      if (!text) return "";
      if (block.type === "heading") return `<h${block.level}>${escapeHtml(text)}</h${block.level}>`;
      if (block.type === "quote") return `<blockquote>${linkedTextToHtml(text)}</blockquote>`;
      return `<p>${linkedTextToHtml(text)}</p>`;
    })
    .filter(Boolean)
    .join("\n\n");
}
