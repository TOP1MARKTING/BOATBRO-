import { useMemo, useState, type FormEvent } from "react";
import { slugify } from "../../lib/admin";
import { buildAdminSeoLabels } from "../../lib/admin-labels";
import {
  createEmptyPostInput,
  deletePost,
  postToInput,
  savePost,
  type BlogPost,
  type PostInput,
} from "../../lib/db";
import { analyzePostSeo } from "../../lib/post-seo";
import { AdminPostEditor } from "./admin-post-editor";
import { ADMIN_FIELD_CLS, AdminFilterBar, AdminPanelShell } from "./shared";

type PublishFilter = "all" | "published" | "draft";

export function AdminPostsPanel({
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
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  author: string;
  uid: string;
}) {
  const empty: PostInput = useMemo(
    () => createEmptyPostInput(author, t.admin.categories[0] ?? ""),
    [author, t.admin.categories],
  );
  const seoLabels = useMemo(() => buildAdminSeoLabels(t.admin), [t.admin]);
  const checks = seoLabels.checks;

  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [form, setForm] = useState<PostInput>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (publishFilter === "published" && !post.published) return false;
      if (publishFilter === "draft" && post.published) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q)
      );
    });
  }, [posts, query, publishFilter]);

  const openNew = () => {
    setForm({ ...empty, authorName: author });
    setEditing("new");
    setMessage("");
  };

  const openEdit = (post: BlogPost) => {
    setForm(postToInput(post));
    setEditing(post);
    setMessage("");
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const slug = form.slug.trim() || slugify(form.titleI18n.en || form.titleI18n.ar || form.title);
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
    <AdminPanelShell
      title={t.admin.posts}
      hideTitle
      action={
        <button
          type="button"
          onClick={openNew}
          className="rounded-full bg-gold px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gold/90"
        >
          {t.admin.newPost}
        </button>
      }
    >
      <AdminFilterBar>
        <input
          className={`${ADMIN_FIELD_CLS} max-w-xs`}
          placeholder={t.admin.searchPosts}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${ADMIN_FIELD_CLS} w-auto min-w-[140px]`}
          value={publishFilter}
          onChange={(e) => setPublishFilter(e.target.value as PublishFilter)}
        >
          <option value="all">{t.admin.filterAll}</option>
          <option value="published">{t.admin.published}</option>
          <option value="draft">{t.admin.draft}</option>
        </select>
        <span className="text-[12px] text-muted-foreground">
          {filtered.length} / {posts.length}
        </span>
      </AdminFilterBar>

      {editing ? (
        <AdminPostEditor
          form={form}
          setForm={setForm}
          onSubmit={(e) => void onSave(e)}
          onCancel={() => setEditing(null)}
          busy={busy}
          message={message}
          uid={uid}
          t={t}
          seoLabels={seoLabels}
        />
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(15,40,70,0.4)]">
        {filtered.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">{t.admin.noPosts}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-muted text-start text-[12px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium">{t.admin.titleField}</th>
                  <th className="px-5 py-3.5 font-medium">{t.admin.category}</th>
                  <th className="px-5 py-3.5 font-medium">{t.admin.seoScore}</th>
                  <th className="px-5 py-3.5 font-medium">{t.admin.publish}</th>
                  <th className="px-5 py-3.5 font-medium text-end">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => {
                  const seo = analyzePostSeo(postToInput(post), checks, lang);
                  return (
                    <tr key={post.id} className="border-b border-border/80 transition-colors last:border-0 hover:bg-muted/80">
                      <td className="px-5 py-4">
                        <p className="font-medium text-navy">{post.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">{post.slug}</p>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{post.category}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            seo.score >= 80
                              ? "bg-emerald-500/15 text-emerald-700"
                              : seo.score >= 50
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {seo.score}%
                        </span>
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPanelShell>
  );
}
