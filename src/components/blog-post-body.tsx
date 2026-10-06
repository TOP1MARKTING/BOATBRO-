import { useMemo } from "react";
import type { BlogPost } from "../lib/db";
import { sanitizePostHtml } from "../lib/post-html";
import {
  orderedBlocksWithImages,
  parseLinkedText,
  pickLocalized,
  type PostBlock,
} from "../lib/post-content";

function LinkedText({ text, lang }: { text: string; lang: "ar" | "en" }) {
  const parts = parseLinkedText(text);
  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === "text") return <span key={index}>{part.value}</span>;
        const external = part.external;
        if (part.href.startsWith("#")) {
          return (
            <a
              key={index}
              href={part.href}
              className="font-medium text-gold underline decoration-gold/40 underline-offset-4"
            >
              {part.label}
            </a>
          );
        }
        return (
          <a
            key={index}
            href={part.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="font-medium text-gold underline decoration-gold/40 underline-offset-4"
          >
            {part.label}
          </a>
        );
      })}
    </>
  );
}

export function BlogHtmlBody({ html, className = "mt-8" }: { html: string; className?: string }) {
  const clean = useMemo(() => sanitizePostHtml(html), [html]);
  return <div className={`bp-article ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}

export function BlogPostBody({ post, lang }: { post: BlogPost; lang: "ar" | "en" }) {
  if (post.contentMode === "html") {
    const html = pickLocalized(post.contentHtml, lang);
    if (html) return <BlogHtmlBody html={html} />;
  }
  const blocks = orderedBlocksWithImages(post.blocks.length ? post.blocks : []);
  if (!blocks.length) {
    return (
      <div className="mt-8 whitespace-pre-wrap text-base leading-9 text-muted-foreground">{post.body}</div>
    );
  }

  return (
    <div className="mt-8 space-y-6 text-base leading-9 text-muted-foreground">
      {blocks.map((block) => (
        <Block key={block.id} block={block} lang={lang} />
      ))}
    </div>
  );
}

function Block({ block, lang }: { block: PostBlock; lang: "ar" | "en" }) {
  const text = pickLocalized(
    block.type === "image" ? undefined : block.text,
    lang,
  );

  if (block.type === "heading") {
    const Tag = block.level === 3 ? "h3" : "h2";
    return (
      <Tag id={block.id} className="scroll-mt-28 font-display text-2xl font-semibold text-navy md:text-3xl">
        {text}
      </Tag>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-s-4 border-gold/60 bg-surface-2 px-5 py-4 text-lg italic text-navy">
        <LinkedText text={pickLocalized(block.text, lang)} lang={lang} />
      </blockquote>
    );
  }

  if (block.type === "image") {
    if (!block.url) return null;
    return (
      <figure>
        <img
          src={block.url}
          alt={pickLocalized(block.alt, lang)}
          className="w-full rounded-[1.25rem] object-cover"
        />
        {pickLocalized(block.caption, lang) ? (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">
            {pickLocalized(block.caption, lang)}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <p>
      <LinkedText text={pickLocalized(block.text, lang)} lang={lang} />
    </p>
  );
}

export function BlogPostTags({ tags, lang }: { tags: string[]; lang: "ar" | "en" }) {
  if (!tags.length) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function BlogFaqSection({
  faq,
  lang,
  title,
}: {
  faq: BlogPost["faq"];
  lang: "ar" | "en";
  title: string;
}) {
  if (!faq.length) return null;
  return (
    <section className="mt-14 border-t border-border pt-10">
      <h2 className="font-display text-2xl font-semibold text-navy">{title}</h2>
      <div className="mt-6 space-y-4">
        {faq.map((item, index) => (
          <details key={index} className="rounded-2xl border border-border bg-card px-5 py-4">
            <summary className="cursor-pointer font-medium text-navy">
              {pickLocalized(item.question, lang)}
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{pickLocalized(item.answer, lang)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
