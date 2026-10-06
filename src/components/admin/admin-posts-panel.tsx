import { useMemo, useState, type FormEvent } from "react";
import { slugify } from "../../lib/admin";
import { buildAdminSeoLabels } from "../../lib/admin-labels";
import { dictionaries } from "../../lib/copy";
import {
  createEmptyPostInput,
  deletePost,
  postToInput,
  savePost,
  type BlogPost,
  type PostInput,
} from "../../lib/db";
import { analyzePostSeo } from "../../lib/post-seo";
import { blocksToHtml } from "../../lib/post-html";
import { AdminPostEditor } from "./admin-post-editor";
import {
  ADMIN_BADGE_ACTIVE,
  ADMIN_BADGE_MUTED,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD_CLS,
  ADMIN_FIELD_CLS,
  AdminEmptyState,
  AdminFilterBar,
  AdminPanelShell,
} from "./shared";

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
  const editorSeoLabels = useMemo(() => buildAdminSeoLabels(dictionaries.ar.admin), []);
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
    window.scrollTo({ top: 0 });
  };

  const openEdit = (post: BlogPost) => {
    const input = postToInput(post);
    setForm(
      input.contentMode === "html"
        ? input
        : {
            ...input,
            contentMode: "html",
            contentHtml: { ar: blocksToHtml(input.blocks, "ar"), en: blocksToHtml(input.blocks, "en") },
          },
    );
    setEditing(post);
    setMessage("");
    window.scrollTo({ top: 0 });
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
      setMessage(dictionaries.ar.admin.error);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <AdminPostEditor
        form={form}
        setForm={setForm}
        onSubmit={(e) => void onSave(e)}
        onCancel={() => setEditing(null)}
        busy={busy}
        message={message}
        uid={uid}
        isNew={editing === "new"}
        seoLabels={editorSeoLabels}
      />
    );
  }

  return (
    <AdminPanelShell
      title={t.admin.posts}
      hideTitle
      action={
        <button type="button" onClick={openNew} className={ADMIN_BTN_PRIMARY}>
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

      {message ? <p className="mb-3 text-sm text-[#A8894E]">{message}</p> : null}

      <div className={`overflow-hidden ${ADMIN_CARD_CLS}`}>
        {filtered.length === 0 ? (
          <AdminEmptyState message={t.admin.noPosts} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-[#C8A96A]/15 bg-[rgba(200,169,106,0.06)] text-start text-[12px] text-muted-foreground">
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
                    <tr
                      key={post.id}
                      className="border-b border-[#C8A96A]/10 transition-colors last:border-0 hover:bg-[rgba(200,169,106,0.05)]"
                    >
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
                        <span className={post.published ? ADMIN_BADGE_ACTIVE : ADMIN_BADGE_MUTED}>
                          {post.published ? t.admin.published : t.admin.draft}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-end">
                        <button type="button" onClick={() => openEdit(post)} className={ADMIN_BTN_SECONDARY}>
                          {t.admin.edit}
                        </button>
                        <button
                          type="button"
                          className={`${ADMIN_BTN_GHOST} ms-2`}
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
