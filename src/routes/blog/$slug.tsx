import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SHELL } from "../../components/brand";
import { JsonLd } from "../../components/json-ld";
import { MarketingShell } from "../../components/marketing-shell";
import { Btn, CtaArrow } from "../../components/ui";
import { getPostBySlug, listPublishedPosts, pickRelatedPosts } from "../../lib/db";
import { useLang } from "../../lib/i18n";
import { SITE_ORIGIN, formatDisplayDate, pageHead, readingMinutes } from "../../lib/site";

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
    return pageHead({
      title: `${post.title} | بوت برو`,
      description: (post.excerpt || post.title).slice(0, 160),
      path: `/blog/${post.slug}`,
      image: post.coverUrl || "/og.jpg",
      type: "article",
    });
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, posts } = Route.useLoaderData();
  const { dir, lang, t } = useLang();
  const mins = readingMinutes(`${post.excerpt} ${post.body}`);
  const related = pickRelatedPosts(posts, post);
  const published = post.createdAt ? formatDisplayDate(post.createdAt, lang) : "";
  const updated =
    post.updatedAt && post.createdAt && post.updatedAt.getTime() - post.createdAt.getTime() > 60_000
      ? formatDisplayDate(post.updatedAt, lang)
      : "";

  return (
    <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            image: post.coverUrl || `${SITE_ORIGIN}/og.jpg`,
            datePublished: post.createdAt?.toISOString(),
            dateModified: (post.updatedAt || post.createdAt)?.toISOString(),
            author: {
              "@type": "Person",
              name: post.authorName || "BoatPro",
            },
            publisher: {
              "@type": "Organization",
              name: "BoatPro",
              logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/logo.png` },
            },
            mainEntityOfPage: `${SITE_ORIGIN}/blog/${post.slug}`,
            inLanguage: post.lang === "en" ? "en" : "ar",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.crumbs.home, item: `${SITE_ORIGIN}/` },
              { "@type": "ListItem", position: 2, name: t.crumbs.blog, item: `${SITE_ORIGIN}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_ORIGIN}/blog/${post.slug}` },
            ],
          },
        ]}
      />
      <article className={`${SHELL} max-w-3xl pt-20 pb-20 sm:pt-24 lg:pt-[104px]`}>
        <p className="text-[13px] font-medium text-gold-ink">{post.category}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-snug text-navy md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t.blog.author}: {post.authorName || "BoatPro"}
          {published ? ` · ${t.blog.published} ${published}` : ""}
          {updated ? ` · ${t.blog.updated} ${updated}` : ""}
          {` · ${mins} ${t.blog.minRead}`}
        </p>
        {post.coverUrl && (
          <img
            src={post.coverUrl}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-[1.6rem] object-cover"
          />
        )}
        <p className="mt-8 text-lg leading-9 text-foreground/85">{post.excerpt}</p>
        <div className="mt-8 whitespace-pre-wrap text-base leading-9 text-muted-foreground">{post.body}</div>

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
                  <p className="text-[12px] font-medium text-gold-ink">{item.category}</p>
                  <h3 className="mt-2 font-display text-xl text-navy">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{item.excerpt}</p>
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
  );
}
