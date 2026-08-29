import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminContactsPanel } from "../components/admin/admin-contacts-panel";
import { AdminGalleryPanel } from "../components/admin/admin-gallery-panel";
import { AdminOverviewPanel } from "../components/admin/admin-overview-panel";
import { AdminPostsPanel } from "../components/admin/admin-posts-panel";
import { AdminProfilePanel } from "../components/admin/admin-profile-panel";
import { AdminSettingsPanel } from "../components/admin/admin-settings-panel";
import { ADMIN_NAV_ITEMS, AdminShell } from "../components/admin/admin-shell";
import { AdminUsersPanel } from "../components/admin/admin-users-panel";
import { PageMeta } from "../components/page-meta";
import type { AdminTab } from "../lib/admin-permissions";
import { useAuth } from "../lib/auth";
import { listAllPosts, listContacts, listUsers, type BlogPost, type ContactRecord, type UserRecord } from "../lib/db";
import { useLang } from "../lib/i18n";
import { useSiteSettings } from "../lib/site-settings-context";
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

function AdminPage() {
  const { dir, lang, t } = useLang();
  const {
    user,
    ready,
    isAdmin,
    isSuperAdmin,
    staffRole,
    permissions,
    canAccessTab,
    defaultAdminTab,
    logout,
  } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { refresh: refreshSiteSettings } = useSiteSettings();

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
    if (!ready || !isAdmin) return;
    if (tab === "users" && !isSuperAdmin) setTab(defaultAdminTab);
    else if (!canAccessTab(tab)) setTab(defaultAdminTab);
  }, [ready, isAdmin, tab, canAccessTab, defaultAdminTab, isSuperAdmin]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [tab]);

  const navItems = useMemo(
    () => ADMIN_NAV_ITEMS.filter((item) => (item.id === "users" ? isSuperAdmin : canAccessTab(item.id))),
    [canAccessTab, isSuperAdmin],
  );

  const tabLabels: Record<AdminTab, string> = {
    overview: t.admin.overview,
    posts: t.admin.posts,
    gallery: t.admin.gallery,
    contacts: t.admin.contacts,
    users: t.admin.users,
    settings: t.admin.settings,
    profile: t.admin.profile,
  };

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
        <PageMeta title={`${t.admin.denied} | BoatPro`} />
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

  return (
    <>
      <PageMeta title={`${tabLabels[tab]} | ${t.admin.title}`} description={t.admin.body} />
      <AdminShell
        dir={dir}
        tab={tab}
        setTab={setTab}
        tabLabels={tabLabels}
        navItems={navItems}
        contactBadge={contacts.filter((c) => c.status === "new").length}
        userEmail={user.email}
        isSuperAdmin={isSuperAdmin}
        superAdminLabel={t.admin.superAdmin}
        chipLabel={t.admin.chip}
        siteLabel={t.admin.site}
        logoutLabel={t.auth.logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={() => void logout()}
      >
        {error ? (
          <p className="mb-6 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading && tab !== "gallery" && tab !== "profile" && tab !== "settings" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-card/80" />
            ))}
          </div>
        ) : null}

        {!loading && tab === "overview" ? (
          <AdminOverviewPanel posts={posts} contacts={contacts} users={users} t={t} lang={lang} onOpen={setTab} />
        ) : null}
        {!loading && tab === "posts" && canAccessTab("posts") ? (
          <AdminPostsPanel posts={posts} onChange={load} lang={lang} t={t} author={user.displayName || user.email || ""} uid={user.uid} />
        ) : null}
        {tab === "gallery" && canAccessTab("gallery") ? <AdminGalleryPanel uid={user.uid} t={t} /> : null}
        {!loading && tab === "contacts" && canAccessTab("contacts") ? (
          <AdminContactsPanel contacts={contacts} onChange={load} t={t} lang={lang} />
        ) : null}
        {!loading && tab === "users" && isSuperAdmin ? (
          <AdminUsersPanel users={users} currentUid={user.uid} isSuperAdmin={isSuperAdmin} onChange={load} t={t} lang={lang} />
        ) : null}
        {tab === "settings" && canAccessTab("settings") ? (
          <AdminSettingsPanel t={t} onSaved={() => void refreshSiteSettings()} />
        ) : null}
        {tab === "profile" && canAccessTab("profile") ? (
          <AdminProfilePanel user={user} staffRole={staffRole} permissions={permissions} lang={lang} t={t} />
        ) : null}
      </AdminShell>
    </>
  );
}
