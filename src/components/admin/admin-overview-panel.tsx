import { useMemo } from "react";
import type { BlogPost, ContactRecord, UserRecord } from "../../lib/db";
import type { AdminTab } from "../../lib/admin-permissions";
import { buildAdminSeoLabels } from "../../lib/admin-labels";
import { postToInput } from "../../lib/db";
import { analyzePostSeo } from "../../lib/post-seo";
import { AdminStatCard } from "./shared";

export function AdminOverviewPanel({
  posts,
  contacts,
  users,
  t,
  lang,
  onOpen,
}: {
  posts: BlogPost[];
  contacts: ContactRecord[];
  users: UserRecord[];
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  lang: "ar" | "en";
  onOpen: (tab: AdminTab) => void;
}) {
  const newContacts = contacts.filter((c) => c.status === "new").length;
  const published = posts.filter((p) => p.published).length;
  const drafts = posts.filter((p) => !p.published).length;
  const checks = useMemo(() => buildAdminSeoLabels(t.admin).checks, [t.admin]);

  const lowSeoPosts = useMemo(
    () =>
      posts.filter((post) => {
        const seo = analyzePostSeo(postToInput(post), checks, lang);
        return seo.score < 50;
      }).length,
    [posts, checks, lang],
  );

  const featuredCount = posts.filter((p) => p.featured).length;

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm leading-7 text-muted-foreground">{t.admin.body}</p>

      {lowSeoPosts > 0 ? (
        <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {t.admin.seoAlert.replace("{count}", String(lowSeoPosts))}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard label={t.admin.postsCount} value={posts.length} onClick={() => onOpen("posts")} />
        <AdminStatCard label={t.admin.publishedCount} value={published} onClick={() => onOpen("posts")} />
        <AdminStatCard label={t.admin.draftsCount} value={drafts} onClick={() => onOpen("posts")} />
        <AdminStatCard
          label={t.admin.seoNeedsWork}
          value={lowSeoPosts}
          tone={lowSeoPosts ? "warn" : "default"}
          onClick={() => onOpen("posts")}
        />
        <AdminStatCard
          label={t.admin.contactsCount}
          value={contacts.length}
          hint={newContacts ? `${newContacts} ${t.admin.newCount}` : undefined}
          onClick={() => onOpen("contacts")}
        />
        <AdminStatCard label={t.admin.newCount} value={newContacts} onClick={() => onOpen("contacts")} />
        <AdminStatCard label={t.admin.usersCount} value={users.length} onClick={() => onOpen("users")} />
        <AdminStatCard label={t.admin.featuredCount} value={featuredCount} onClick={() => onOpen("posts")} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">{t.admin.contacts}</h3>
            <button type="button" onClick={() => onOpen("contacts")} className="text-[12px] text-gold-ink hover:text-gold">
              {t.admin.viewAll}
            </button>
          </div>
          {contacts.slice(0, 4).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.admin.noContacts}</p>
          ) : (
            <ul className="space-y-3">
              {contacts.slice(0, 4).map((c) => (
                <li key={c.id} className="rounded-xl border border-border/80 bg-surface-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{c.name}</p>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{c.userType}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        c.status === "new" ? "bg-gold/15 text-gold-ink" : "bg-navy/5 text-muted-foreground"
                      }`}
                    >
                      {c.status === "new" ? t.admin.newCount : t.admin.handled}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">{t.admin.posts}</h3>
            <button type="button" onClick={() => onOpen("posts")} className="text-[12px] text-gold-ink hover:text-gold">
              {t.admin.viewAll}
            </button>
          </div>
          {posts.slice(0, 4).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.admin.noPosts}</p>
          ) : (
            <ul className="space-y-3">
              {posts.slice(0, 4).map((p) => (
                <li key={p.id} className="rounded-xl border border-border/80 bg-surface-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{p.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{p.category}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        p.published ? "bg-gold/15 text-gold-ink" : "bg-navy/5 text-muted-foreground"
                      }`}
                    >
                      {p.published ? t.admin.published : t.admin.draft}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
