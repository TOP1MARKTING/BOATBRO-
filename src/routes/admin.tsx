import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Logo } from "../components/brand";
import { LangToggle } from "../components/lang-toggle";
import { ThemeToggle } from "../components/theme-toggle";
import { isSuperAdminEmail, slugify } from "../lib/admin";
import { useAuth } from "../lib/auth";
import {
  deleteContact,
  deletePost,
  listAllPosts,
  listContacts,
  listUsers,
  savePost,
  setContactStatus,
  setUserRole,
  uploadCover,
  type BlogPost,
  type ContactRecord,
  type PostInput,
  type UserRecord,
} from "../lib/db";
import { useLang } from "../lib/i18n";
import { pageHead } from "../lib/site";

export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead({
      title: "لوحة الإدارة | بوت برو",
      description: "لوحة تحكم بوت برو.",
      path: "/admin",
      noindex: true,
    }),
  component: AdminPage,
});

type Tab = "overview" | "posts" | "contacts" | "users";

const fieldCls =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/15";

const NAV: { id: Tab; icon: LucideIcon }[] = [
  { id: "overview", icon: LayoutDashboard },
  { id: "posts", icon: FileText },
  { id: "contacts", icon: Inbox },
  { id: "users", icon: Users },
];

function AdminPage() {
  const { dir, lang, t } = useLang();
  const { user, ready, isAdmin, isSuperAdmin, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const [p, c, u] = await Promise.all([listAllPosts(), listContacts(), listUsers()]);
      setPosts(p);
      setContacts(c);
      setUsers(u);
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
      if (import.meta.env.DEV) console.error("[admin]", code, err);
      setError(
        code === "unimplemented" || code === "failed-precondition" || code === "not-found"
          ? t.cta.firestoreOff
          : code === "permission-denied"
            ? t.cta.firestoreDenied
            : t.admin.error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready && isAdmin) void load();
  }, [ready, isAdmin]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [tab]);

  if (!ready) {
    return (
      <main dir={dir} className="grid min-h-svh place-items-center bg-surface-2">
        <div className="text-center">
          <div className="mx-auto size-10 animate-pulse rounded-full bg-navy/10" />
          <p className="mt-4 text-sm text-muted-foreground">{t.admin.loading}</p>
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main dir={dir} className="grid min-h-svh place-items-center bg-surface-2 px-6">
        <div className="w-full max-w-md rounded-[1.75rem] border border-border bg-card p-8 text-center shadow-sm">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-navy/5 text-navy">
            <Shield size={22} />
          </span>
          <p className="mt-5 text-[12px] font-medium tracking-[0.18em] text-gold-ink">{t.admin.chip}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-navy">{t.admin.denied}</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{t.admin.deniedBody}</p>
          <Link
            to="/login"
            search={{ to: "admin" }}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-medium text-white hover:bg-gold/90"
          >
            {t.admin.login}
          </Link>
        </div>
      </main>
    );
  }

  const tabLabel: Record<Tab, string> = {
    overview: t.admin.overview,
    posts: t.admin.posts,
    contacts: t.admin.contacts,
    users: t.admin.users,
  };

  const sidebar = (
    <aside className="flex h-full w-[260px] flex-col bg-[#0b1220] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Logo size="sm" />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold tracking-wide">BoatPro</p>
          <p className="text-[11px] text-white/55">{t.admin.chip}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ id, icon: Icon }) => {
          const active = tab === id;
          const badge =
            id === "contacts" ? contacts.filter((c) => c.status === "new").length : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start text-[13px] font-medium transition-colors ${
                active
                  ? "border-s-[3px] border-s-[#C8A96A] bg-white/10 text-white"
                  : "border-s-[3px] border-s-transparent text-white/65 hover:bg-white/6 hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-[#C8A96A]" : "text-white/45"} />
              <span className="flex-1">{tabLabel[id]}</span>
              {badge > 0 ? (
                <span className="rounded-full bg-[#C8A96A] px-2 py-0.5 text-[11px] font-semibold text-[#0b1220]">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] text-white/65 transition-colors hover:bg-white/6 hover:text-white"
        >
          <ExternalLink size={18} className="text-white/45" />
          {t.admin.site}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start text-[13px] text-white/65 transition-colors hover:bg-white/6 hover:text-white"
        >
          <LogOut size={18} className="text-white/45" />
          {t.auth.logout}
        </button>
      </div>
    </aside>
  );

  return (
    <main dir={dir} className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-svh lg:shrink-0">{sidebar}</div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/45"
              aria-label="Close"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 start-0 shadow-2xl">{sidebar}</div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-navy lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Menu"
                >
                  {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <h1 className="truncate font-display text-lg font-semibold text-navy sm:text-xl">
                  {tabLabel[tab]}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <LangToggle />
                <div className="hidden items-center gap-2 rounded-full border border-border bg-surface-2 py-1.5 pe-3.5 ps-1.5 sm:flex">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-navy-deep text-[11px] font-semibold text-white">
                    {(user.email?.[0] ?? "A").toUpperCase()}
                  </span>
                  <div className="min-w-0 max-w-[180px]">
                    <p className="truncate text-[12px] font-medium text-navy" dir="ltr">
                      {user.email}
                    </p>
                    {isSuperAdmin ? (
                      <p className="text-[10px] text-gold-ink">{t.admin.superAdmin}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {error ? (
              <p className="mb-6 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-card/80" />
                ))}
              </div>
            ) : null}

            {!loading && tab === "overview" ? (
              <Overview
                posts={posts}
                contacts={contacts}
                users={users}
                t={t}
                onOpen={(id) => setTab(id)}
              />
            ) : null}
            {!loading && tab === "posts" ? (
              <PostsPanel
                posts={posts}
                onChange={load}
                lang={lang}
                t={t}
                author={user.displayName || user.email || ""}
                uid={user.uid}
              />
            ) : null}
            {!loading && tab === "contacts" ? (
              <ContactsPanel contacts={contacts} onChange={load} t={t} lang={lang} />
            ) : null}
            {!loading && tab === "users" ? (
              <UsersPanel
                users={users}
                currentUid={user.uid}
                isSuperAdmin={isSuperAdmin}
                onChange={load}
                t={t}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  onClick?: () => void;
}) {
  const cls =
    "rounded-2xl border border-border bg-card p-5 text-start shadow-[0_10px_30px_-24px_rgba(15,40,70,0.35)] transition-all sm:p-6";
  const inner = (
    <>
      <p className="text-[12px] font-medium tracking-[0.12em] text-gold-ink">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-2 text-[12px] text-muted-foreground">{hint}</p> : null}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} hover:-translate-y-0.5 hover:border-gold/40`}>
        {inner}
      </button>
    );
  }
  return <article className={cls}>{inner}</article>;
}

function PanelShell({
  title,
  action,
  children,
  hideTitle = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  hideTitle?: boolean;
}) {
  const showBar = !hideTitle || Boolean(action);
  return (
    <div>
      {showBar ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {hideTitle ? <span className="sr-only">{title}</span> : (
            <h2 className="font-display text-2xl font-semibold text-navy">{title}</h2>
          )}
          {action}
        </div>
      ) : (
        <span className="sr-only">{title}</span>
      )}
      {children}
    </div>
  );
}

function Overview({
  posts,
  contacts,
  users,
  t,
  onOpen,
}: {
  posts: BlogPost[];
  contacts: ContactRecord[];
  users: UserRecord[];
  t: ReturnType<typeof useLang>["t"];
  onOpen: (tab: Tab) => void;
}) {
  const newContacts = contacts.filter((c) => c.status === "new").length;
  const published = posts.filter((p) => p.published).length;
  const drafts = posts.filter((p) => !p.published).length;

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm leading-7 text-muted-foreground">{t.admin.body}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t.admin.postsCount} value={posts.length} onClick={() => onOpen("posts")} />
        <StatCard label={t.admin.publishedCount} value={published} onClick={() => onOpen("posts")} />
        <StatCard label={t.admin.draftsCount} value={drafts} onClick={() => onOpen("posts")} />
        <StatCard
          label={t.admin.contactsCount}
          value={contacts.length}
          hint={newContacts ? `${newContacts} ${t.admin.newCount}` : undefined}
          onClick={() => onOpen("contacts")}
        />
        <StatCard label={t.admin.newCount} value={newContacts} onClick={() => onOpen("contacts")} />
        <StatCard label={t.admin.usersCount} value={users.length} onClick={() => onOpen("users")} />
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

function PostsPanel({
  posts,
  onChange,
  lang,
  t,
  author,
  uid,
}: {
  posts: BlogPost[];
  onChange: () => Promise<void>;
  lang: "ar" | "en";
  t: ReturnType<typeof useLang>["t"];
  author: string;
  uid: string;
}) {
  const empty: PostInput = useMemo(
    () => ({
      slug: "",
      title: "",
      excerpt: "",
      body: "",
      coverUrl: "",
      category: t.admin.categories[0],
      lang,
      published: false,
      authorName: author,
    }),
    [author, lang, t.admin.categories],
  );

  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [form, setForm] = useState<PostInput>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const openNew = () => {
    setForm({ ...empty, authorName: author });
    setEditing("new");
    setMessage("");
  };

  const openEdit = (post: BlogPost) => {
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      coverUrl: post.coverUrl,
      category: post.category || t.admin.categories[0],
      lang: post.lang,
      published: post.published,
      authorName: post.authorName || author,
    });
    setEditing(post);
    setMessage("");
  };

  const onUpload = async (file: File) => {
    setBusy(true);
    setMessage("");
    try {
      const url = await uploadCover(file, uid);
      setForm((prev) => ({ ...prev, coverUrl: url }));
    } catch {
      setMessage(t.admin.error);
    } finally {
      setBusy(false);
    }
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const slug = form.slug.trim() || slugify(form.title);
      await savePost(editing && editing !== "new" ? editing.id : null, { ...form, slug });
      setMessage(t.admin.saved);
      setEditing(null);
      await onChange();
    } catch {
      setMessage(t.admin.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell title={t.admin.posts} hideTitle action={
        <button
          type="button"
          onClick={openNew}
          className="rounded-full bg-gold px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gold/90"
        >
          {t.admin.newPost}
        </button>
      }
    >
      {editing ? (
        <form
          onSubmit={(e) => void onSave(e)}
          className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 md:grid-cols-2"
        >
          <label className="md:col-span-2">
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.titleField}</span>
            <input
              required
              className={fieldCls}
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })
              }
            />
          </label>
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.slug}</span>
            <input
              required
              className={fieldCls}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.category}</span>
            <select
              className={fieldCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {t.admin.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.langField}</span>
            <select
              className={fieldCls}
              value={form.lang}
              onChange={(e) => setForm({ ...form, lang: e.target.value === "en" ? "en" : "ar" })}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.author}</span>
            <input
              className={fieldCls}
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.excerpt}</span>
            <textarea
              required
              rows={3}
              className={fieldCls}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.bodyField}</span>
            <textarea
              required
              rows={10}
              className={fieldCls}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.coverUrl}</span>
            <input
              className={fieldCls}
              value={form.coverUrl}
              onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
              }}
            />
            <span className="text-muted-foreground">{t.admin.upload}</span>
          </label>
          <label className="flex items-center gap-3 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            {t.admin.publish}
          </label>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? t.auth.working : t.admin.save}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm text-muted-foreground">
              {t.admin.cancel}
            </button>
            {message ? <span className="text-sm text-gold-ink">{message}</span> : null}
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(15,40,70,0.4)]">
        {posts.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">{t.admin.noPosts}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-muted text-start text-[12px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium">{t.admin.titleField}</th>
                  <th className="px-5 py-3.5 font-medium">{t.admin.category}</th>
                  <th className="px-5 py-3.5 font-medium">{t.admin.publish}</th>
                  <th className="px-5 py-3.5 font-medium text-end">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-border/80 transition-colors last:border-0 hover:bg-muted/80">
                    <td className="px-5 py-4">
                      <p className="font-medium text-navy">{post.title}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{post.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{post.category}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          post.published ? "bg-gold/15 text-gold-ink" : "bg-navy/5 text-muted-foreground"
                        }`}
                      >
                        {post.published ? t.admin.published : t.admin.draft}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-end">
                      <button
                        type="button"
                        onClick={() => openEdit(post)}
                        className="rounded-full border border-gold/40 px-3.5 py-1.5 text-[12px] font-medium text-gold-ink hover:bg-gold hover:text-white"
                      >
                        {t.admin.edit}
                      </button>
                      <button
                        type="button"
                        className="ms-2 text-[12px] text-destructive hover:underline"
                        onClick={() => {
                          if (confirm(t.admin.confirmDelete)) void deletePost(post.id).then(onChange);
                        }}
                      >
                        {t.admin.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

function ContactsPanel({
  contacts,
  onChange,
  t,
  lang,
}: {
  contacts: ContactRecord[];
  onChange: () => Promise<void>;
  t: ReturnType<typeof useLang>["t"];
  lang: "ar" | "en";
}) {
  return (
    <PanelShell title={t.admin.contacts} hideTitle>
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            {t.admin.noContacts}
          </p>
        ) : null}
        {contacts.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold text-navy">{item.name}</p>
                <p className="mt-1 text-[12px] font-medium text-gold-ink">{item.userType}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  item.status === "new" ? "bg-gold/15 text-gold-ink" : "bg-navy/5 text-muted-foreground"
                }`}
              >
                {item.status === "new" ? t.admin.newCount : t.admin.handled}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{item.content}</p>
            <div className="mt-4 grid gap-1 break-words text-[13px] text-foreground/80">
              <p dir="ltr">{item.email}</p>
              <p dir="ltr">{item.phone}</p>
              {item.address ? <p>{item.address}</p> : null}
              <p className="text-muted-foreground">
                {item.createdAt?.toLocaleString(lang === "ar" ? "ar-SA" : "en-GB")}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full border border-gold/50 px-4 py-2 text-[12px] font-medium text-gold-ink hover:bg-gold hover:text-white"
                onClick={() =>
                  void setContactStatus(item.id, item.status === "new" ? "handled" : "new").then(onChange)
                }
              >
                {item.status === "new" ? t.admin.markHandled : t.admin.markNew}
              </button>
              <button
                type="button"
                className="text-[12px] text-destructive"
                onClick={() => {
                  if (confirm(t.admin.confirmDelete)) void deleteContact(item.id).then(onChange);
                }}
              >
                {t.admin.delete}
              </button>
            </div>
          </article>
        ))}
      </div>
    </PanelShell>
  );
}

function UsersPanel({
  users,
  currentUid,
  isSuperAdmin,
  onChange,
  t,
}: {
  users: UserRecord[];
  currentUid: string;
  isSuperAdmin: boolean;
  onChange: () => Promise<void>;
  t: ReturnType<typeof useLang>["t"];
}) {
  return (
    <PanelShell title={t.admin.users} hideTitle>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(15,40,70,0.4)]">
        {users.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">{t.admin.noUsers}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-border bg-muted text-start text-[12px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium normal-case tracking-normal">{t.admin.user}</th>
                  <th className="px-5 py-3.5 font-medium normal-case tracking-normal">{t.admin.role}</th>
                  <th className="px-5 py-3.5 font-medium normal-case tracking-normal text-end">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const superAdmin = isSuperAdminEmail(u.email);
                  const roleLabel = superAdmin
                    ? t.admin.superAdmin
                    : u.role === "admin"
                      ? t.admin.roleAdmin
                      : t.admin.roleUser;
                  const canToggle = u.id !== currentUid && !superAdmin && (isSuperAdmin || u.role !== "admin");
                  const initial = (u.name || u.email || "?").trim().charAt(0).toUpperCase();
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/80 transition-colors last:border-0 hover:bg-muted/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-navy/8 text-[13px] font-semibold text-navy">
                            {initial}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-navy">{u.name || u.email || "—"}</p>
                            {u.email ? (
                              <p className="mt-0.5 truncate text-[12px] text-muted-foreground" dir="ltr">
                                {u.email}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            superAdmin
                              ? "bg-navy-deep text-white"
                              : u.role === "admin"
                                ? "bg-gold/15 text-gold-ink"
                                : "bg-navy/5 text-muted-foreground"
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-end">
                        {canToggle ? (
                          <button
                            type="button"
                            className="rounded-full border border-gold/40 px-3.5 py-1.5 text-[12px] font-medium text-gold-ink transition-colors hover:bg-gold hover:text-white"
                            onClick={() =>
                              void setUserRole(u.id, u.role === "admin" ? "user" : "admin").then(onChange)
                            }
                          >
                            {u.role === "admin" ? t.admin.makeUser : t.admin.makeAdmin}
                          </button>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/70">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
