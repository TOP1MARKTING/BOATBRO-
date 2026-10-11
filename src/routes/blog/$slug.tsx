import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SHELL } from "../../components/brand";
import { BlogFaqSection, BlogPostBody, BlogPostTags } from "../../components/blog-post-body";
import { JsonLd } from "../../components/json-ld";
import { MarketingShell } from "../../components/marketing-shell";
import { PageMeta } from "../../components/page-meta";
import { Btn, CtaArrow } from "../../components/ui";
import {
  getPostBySlug,
  listPublishedPosts,
  pickRelatedPosts,
  postCoverUrl,
  postPlainText,
  type BlogPost,
} from "../../lib/db";
import { pickLocalized } from "../../lib/post-content";
import { useLang } from "../../lib/i18n";
import { getUrlLang } from "../../lib/locale-url";
import {
  postAvailableLangs,
  resolveMetaDescription,
  resolveMetaTitle,
  resolveShareImage,
} from "../../lib/post-seo";
import {
  SITE_ORIGIN,
  formatDisplayDate,
  pageHead,
  readingMinutes,
  localizedUrl,
  shareImageUrl,
} from "../../lib/site";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const posts = await listPublishedPosts().catch(() => []);
    let post =
      posts.find((item) => item.slug === params.slug || item.id === params.slug) ?? null;
    if (!post) {
      post = await getPostBySlug(params.slug).catch(() => null);
    }
    if (!post || !post.published) {
      throw notFound();
    }
    return { post, posts };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post?.published) {
      return {
        meta: [
          { title: "الصفحة غير موجودة | بوت برو" },
          { name: "robots", content: "noindex, nofollow" },
        ],
        links: [],
      };
    }
    const input = {
      ...post,
      blocks: post.blocks,
      titleI18n: post.titleI18n,
      excerptI18n: post.excerptI18n,
      metaTitleI18n: post.metaTitleI18n,
      metaDescriptionI18n: post.metaDescriptionI18n,
      focusKeywordI18n: post.focusKeywordI18n,
      categoryI18n: post.categoryI18n,
      authorI18n: post.authorI18n,
      coverAlt: post.coverAlt,
      tags: post.tags,
      featured: post.featured,
    };
    const lang = getUrlLang();
    const title = resolveMetaTitle(input, lang);
    const description = postMetaDescription(post, lang);
    return pageHead({
      title: postPageTitle(post, lang),
      description,
      path: `/blog/${post.slug}`,
      image: postShareImage(post, lang),
      imageAlt: pickLocalized(post.coverAlt, lang, title),
      type: "article",
      noindex: post.noindex,
      langs: postAvailableLangs(post),
      article: {
        publishedTime: post.createdAt?.toISOString(),
        modifiedTime: (post.updatedAt || post.createdAt)?.toISOString(),
        section: pickLocalized(post.categoryI18n, lang, post.category),
        tags: lang === "en" ? post.tags.en : post.tags.ar,
      },
    });
  },
  component: BlogPostPage,
});

function postPageTitle(post: BlogPost, lang: "ar" | "en") {
  return `${resolveMetaTitle(post, lang)} | ${lang === "ar" ? "بوت برو" : "BoatPro"}`;
}

/** Base64 covers of older posts are served by public/seo/image.php at /media/covers/{id}-{lang}.jpg. */
function postShareImage(post: BlogPost, lang: "ar" | "en") {
  const cover = postCoverUrl(post, lang);
  if (!cover.startsWith("data:")) return resolveShareImage(post, lang);
  return resolveShareImage({ ...post, coverUrl: `/media/covers/${post.id}-${lang}.jpg`, coverUrlEn: "" }, lang);
}

/** Stored meta description, then the excerpt, then the opening of the article itself. */
function postMetaDescription(post: BlogPost, lang: "ar" | "en") {
  const text = resolveMetaDescription(post, lang).trim() || postPlainText(post, lang);
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  const cut = clean.slice(0, 157);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 120))}…`;
}

function BlogPostPage() {
  const { post, posts } = Route.useLoaderData();
  const { dir, lang, t } = useLang();
  const related = pickRelatedPosts(posts, post);
  const title = pickLocalized(post.titleI18n, lang, post.title);
  const excerpt = pickLocalized(post.excerptI18n, lang, post.excerpt);
  const category = pickLocalized(post.categoryI18n, lang, post.category);
  const author = pickLocalized(post.authorI18n, lang, post.authorName);
  const coverAlt = pickLocalized(post.coverAlt, lang, title);
  const coverUrl = postCoverUrl(post, lang);
  const metaTitle = resolveMetaTitle(post, lang);
  const metaDescription = postMetaDescription(post, lang);
  const ogImage = shareImageUrl(postShareImage(post, lang));
  const bodyText = postPlainText(post, lang);
  const mins = readingMinutes(`${excerpt} ${bodyText}`);
  const tags = lang === "en" ? post.tags.en : post.tags.ar;
  const published = post.createdAt ? formatDisplayDate(post.createdAt, lang) : "";
  const updated =
    post.updatedAt && post.createdAt && post.updatedAt.getTime() - post.createdAt.getTime() > 60_000
      ? formatDisplayDate(post.updatedAt, lang)
      : "";

  return (
    <>
      <PageMeta title={postPageTitle(post, lang)} description={metaDescription} />
      <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: metaTitle.slice(0, 110),
            description: metaDescription,
            image: [ogImage],
            datePublished: post.createdAt?.toISOString(),
            dateModified: (post.updatedAt || post.createdAt)?.toISOString(),
            author: author
              ? { "@type": "Person", name: author }
              : { "@type": "Organization", name: "BoatPro", url: SITE_ORIGIN },
            publisher: {
              "@type": "Organization",
              name: "BoatPro",
              logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/logo.png` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": localizedUrl(`/blog/${post.slug}`, lang) },
            inLanguage: lang,
            ...(category ? { articleSection: category } : {}),
            ...(tags.length ? { keywords: tags.join(", ") } : {}),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.crumbs.home, item: localizedUrl("/", lang) },
              { "@type": "ListItem", position: 2, name: t.crumbs.blog, item: localizedUrl("/blog", lang) },
              { "@type": "ListItem", position: 3, name: metaTitle, item: localizedUrl(`/blog/${post.slug}`, lang) },
            ],
          },
          ...(post.faq.length > 0
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: post.faq.map((item) => ({
                    "@type": "Question",
                    name: pickLocalized(item.question, lang),
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: pickLocalized(item.answer, lang),
                    },
                  })),
                },
              ]
            : []),
        ]}
      />
      <article className={`${SHELL} max-w-3xl pt-20 pb-20 sm:pt-24 lg:pt-[104px]`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium text-gold-ink">{category}</p>
          {post.featured ? (
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold-ink">
              {t.blog.featuredBadge}
            </span>
          ) : null}
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-snug text-navy md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t.blog.author}: {author || "BoatPro"}
          {published ? ` · ${t.blog.published} ${published}` : ""}
          {updated ? ` · ${t.blog.updated} ${updated}` : ""}
          {` · ${mins} ${t.blog.minRead}`}
        </p>
        {coverUrl && (
          <img
            src={coverUrl}
            alt={coverAlt}
            width={1200}
            height={675}
            fetchPriority="high"
            className="mt-8 aspect-[16/9] w-full rounded-[1.6rem] object-cover"
          />
        )}
        <p className="mt-8 text-lg leading-9 text-foreground/85">{excerpt}</p>
        <BlogPostBody post={post} lang={lang} fallbackAlt={title} />
        <BlogPostTags tags={tags} lang={lang} />
        <BlogFaqSection
          faq={post.faq}
          lang={lang}
          title={t.blog.faqTitle}
        />

        {related.length > 0 && (
          <aside className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold text-navy">{t.blog.related}</h2>
            <div className="mt-6 grid gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to="/blog/$slug"
                  params={{ slug: item.slug }}
                  className="rounded-[1.3rem] border border-border bg-card p-5 transition-colors hover:border-gold"
                >
                  <p className="text-[12px] font-medium text-gold-ink">
                    {pickLocalized(item.categoryI18n, lang, item.category)}
                  </p>
                  <h3 className="mt-2 font-display text-xl text-navy">
                    {pickLocalized(item.titleI18n, lang, item.title)}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                    {pickLocalized(item.excerptI18n, lang, item.excerpt)}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        )}

        <div className="mt-10">
          <Btn to="/blog" variant="line">
            {t.blog.back} <CtaArrow />
          </Btn>
        </div>
      </article>
    </MarketingShell>
    </>
  );
}
