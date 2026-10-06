import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SHELL } from "../../components/brand";
import { BlogFaqSection, BlogPostBody, BlogPostTags } from "../../components/blog-post-body";
import { JsonLd } from "../../components/json-ld";
import { MarketingShell } from "../../components/marketing-shell";
import { PageMeta } from "../../components/page-meta";
import { Btn, CtaArrow } from "../../components/ui";
import { getPostBySlug, listPublishedPosts, pickRelatedPosts, postCoverUrl, postPlainText } from "../../lib/db";
import { pickLocalized } from "../../lib/post-content";
import { useLang } from "../../lib/i18n";
import { getUrlLang } from "../../lib/locale-url";
import { resolveMetaDescription, resolveMetaTitle, resolveOgImage } from "../../lib/post-seo";
import { SITE_ORIGIN, formatDisplayDate, pageHead, readingMinutes, localizedUrl } from "../../lib/site";

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
    const description = resolveMetaDescription(input, lang).slice(0, 160);
    return pageHead({
      title: `${title} | ${lang === "ar" ? "بوت برو" : "BoatPro"}`,
      description,
      path: `/blog/${post.slug}`,
      image: resolveOgImage(input) || "/og.jpg",
      type: "article",
      noindex: post.noindex,
    });
  },
  component: BlogPostPage,
});

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
  const metaDescription = resolveMetaDescription(post, lang);
  const ogImage = resolveOgImage(post) || `${SITE_ORIGIN}/og.jpg`;
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
      <PageMeta title={metaTitle} description={metaDescription} />
      <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: metaTitle,
            description: metaDescription,
            image: ogImage,
            datePublished: post.createdAt?.toISOString(),
            dateModified: (post.updatedAt || post.createdAt)?.toISOString(),
            author: {
              "@type": "Person",
              name: author || "BoatPro",
            },
            publisher: {
              "@type": "Organization",
              name: "BoatPro",
              logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/logo.png` },
            },
            mainEntityOfPage: localizedUrl(`/blog/${post.slug}`, lang),
            inLanguage: post.lang === "en" ? "en" : "ar",
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
            className="mt-8 aspect-[16/9] w-full rounded-[1.6rem] object-cover"
          />
        )}
        <p className="mt-8 text-lg leading-9 text-foreground/85">{excerpt}</p>
        <BlogPostBody post={post} lang={lang} />
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
