import { useMemo } from "react";
import {
  FileText,
  Inbox,
  Sparkles,
  Star,
  Users,
  AlertTriangle,
  CheckCircle2,
  PenLine,
} from "lucide-react";
import type { BlogPost, ContactRecord, UserRecord } from "../../lib/db";
import { isSuperAdminEmail } from "../../lib/admin";
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
  canAccessTab,
  isSuperAdmin,
}: {
  posts: BlogPost[];
  contacts: ContactRecord[];
  users: UserRecord[];
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  lang: "ar" | "en";
  onOpen: (tab: AdminTab) => void;
  canAccessTab: (tab: AdminTab) => boolean;
  isSuperAdmin: boolean;
}) {
  const showPosts = canAccessTab("posts");
  const showContacts = canAccessTab("contacts");
  const showUsers = canAccessTab("users");
  const usersCount = isSuperAdmin
    ? users.length
    : users.filter((u) => !isSuperAdminEmail(u.email)).length;
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
      <div className="mb-7 rounded-[1.35rem] border border-[#C8A96A]/20 bg-card p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-[#A8894E] uppercase">
          <Sparkles size={12} strokeWidth={1.75} />
          BoatPro Admin
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{t.admin.body}</p>
      </div>

      {showPosts && lowSeoPosts > 0 ? (
        <p className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {t.admin.seoAlert.replace("{count}", String(lowSeoPosts))}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {showPosts ? (
          <>
            <AdminStatCard icon={FileText} label={t.admin.postsCount} value={posts.length} onClick={() => onOpen("posts")} />
            <AdminStatCard icon={CheckCircle2} label={t.admin.publishedCount} value={published} onClick={() => onOpen("posts")} />
            <AdminStatCard icon={PenLine} label={t.admin.draftsCount} value={drafts} onClick={() => onOpen("posts")} />
            <AdminStatCard
              icon={AlertTriangle}
              label={t.admin.seoNeedsWork}
              value={lowSeoPosts}
              tone={lowSeoPosts ? "warn" : "default"}
              onClick={() => onOpen("posts")}
            />
            <AdminStatCard icon={Star} label={t.admin.featuredCount} value={featuredCount} onClick={() => onOpen("posts")} />
          </>
        ) : null}
        {showContacts ? (
          <>
            <AdminStatCard
              icon={Inbox}
              label={t.admin.contactsCount}
              value={contacts.length}
              {...(newContacts ? { hint: `${newContacts} ${t.admin.newCount}` } : {})}
              onClick={() => onOpen("contacts")}
            />
            <AdminStatCard icon={Sparkles} label={t.admin.newCount} value={newContacts} onClick={() => onOpen("contacts")} />
          </>
        ) : null}
        {showUsers ? (
          <AdminStatCard icon={Users} label={t.admin.usersCount} value={usersCount} onClick={() => onOpen("users")} />
        ) : null}
      </div>

      <div className={`mt-8 grid gap-4 ${showPosts && showContacts ? "lg:grid-cols-2" : ""}`}>
        {showContacts ? (
        <section className="rounded-[1.35rem] border border-[#C8A96A]/18 bg-gradient-to-br from-card to-[rgba(200,169,106,0.04)] p-5 shadow-[0_14px_36px_-28px_rgba(10,22,40,0.4)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">{t.admin.contacts}</h3>
            <button type="button" onClick={() => onOpen("contacts")} className="text-[12px] font-medium text-[#A8894E] hover:text-[#C8A96A]">
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
                        c.status === "new" ? "bg-[#C8A96A]/15 text-[#A8894E]" : "bg-navy/5 text-muted-foreground"
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
        ) : null}

        {showPosts ? (
        <section className="rounded-[1.35rem] border border-[#C8A96A]/18 bg-gradient-to-br from-card to-[rgba(200,169,106,0.04)] p-5 shadow-[0_14px_36px_-28px_rgba(10,22,40,0.4)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">{t.admin.posts}</h3>
            <button type="button" onClick={() => onOpen("posts")} className="text-[12px] font-medium text-[#A8894E] hover:text-[#C8A96A]">
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
                        p.published ? "bg-[#C8A96A]/15 text-[#A8894E]" : "bg-navy/5 text-muted-foreground"
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
        ) : null}
      </div>
    </div>
  );
}
