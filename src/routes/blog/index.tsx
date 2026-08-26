import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SHELL } from "../../components/brand";
import { JsonLd } from "../../components/json-ld";
import { MarketingShell } from "../../components/marketing-shell";
import { PageHero } from "../../components/page-hero";
import { listPublishedPosts, type BlogPost } from "../../lib/db";
import { useLang } from "../../lib/i18n";
import { SITE_ORIGIN, formatDisplayDate, pageHead, readingMinutes } from "../../lib/site";

export const Route = createFileRoute("/blog/")({
  head: () =>
    pageHead({
      title: "مدونة بوت برو | إدارة اليخوت والمراسي",
      description:
        "مقالات من بوت برو عن إدارة اليخوت، تشغيل المراسي، والملكية البحرية في المملكة والخليج.",
      path: "/blog",
    }),
  component: BlogPage,
});

function BlogPage() {
  const { dir, lang, t } = useLang();
  const [posts, setPosts] = useState<BlogPost[] | null>(null);

  useEffect(() => {
    void listPublishedPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  return (
    <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: t.blog.title,
            url: `${SITE_ORIGIN}/blog`,
            description: t.blog.body,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.crumbs.home, item: `${SITE_ORIGIN}/` },
              { "@type": "ListItem", position: 2, name: t.crumbs.blog, item: `${SITE_ORIGIN}/blog` },
            ],
          },
        ]}
      />

      <PageHero
        dir={dir}
        image="hero-blog"
        chip={t.blog.chip}
        title={t.blog.title}
        lead={t.blog.body}
      />

      <section className={`${SHELL} pb-20 pt-10 sm:pt-12`}>
        {posts === null && <p className="text-sm text-muted-foreground">{t.admin.loading}</p>}

        {posts && posts.length === 0 && (
          <div className="rounded-[1.75rem] border border-border bg-card px-8 py-16 text-center">
            <p className="font-display text-2xl text-navy">{t.blog.empty}</p>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const mins = readingMinutes(`${post.excerpt} ${post.body}`);
              return (
                <Link
                  key={post.id}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group overflow-hidden rounded-[1.6rem] border border-border bg-card transition-shadow hover:shadow-lg"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-surface-2">
                    {post.coverUrl ? (
                      <img
                        src={post.coverUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-navy/10" />
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-[13px] font-medium text-gold-ink">{post.category || t.blog.chip}</p>
                    <h2 className="mt-3 font-display text-2xl leading-snug text-navy group-hover:text-gold">
                      {post.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
                    <p className="mt-5 text-[12px] text-muted-foreground">
                      {formatDisplayDate(post.createdAt, lang)}
                      <span className="mx-2">·</span>
                      {mins} {t.blog.minRead}
                      <span className="mx-2">·</span>
                      {t.blog.read}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </MarketingShell>
  );
}
