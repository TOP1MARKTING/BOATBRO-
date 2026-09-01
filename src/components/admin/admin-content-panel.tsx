import { ArrowLeft, FileText } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getPageContent, savePageContent } from "../../lib/db";
import type { Dictionary } from "../../lib/copy";
import {
  CMS_PAGES,
  cmsPageLabel,
  defaultPageImages,
  mergePageDocument,
  type CmsPageDocument,
  type CmsPageId,
  type CmsPageImages,
} from "../../lib/page-content";
import { usePageContent } from "../../lib/page-content-context";
import { SchemaContentEditor } from "./schema-content-editor";
import { AdminPanelShell } from "./shared";

function cloneEditorState(doc: CmsPageDocument) {
  return {
    ar: structuredClone(doc.ar) as Record<string, unknown>,
    en: structuredClone(doc.en) as Record<string, unknown>,
    images: { ...doc.images },
  };
}

function resolvePageDoc(
  store: Record<CmsPageId, CmsPageDocument>,
  pageId: CmsPageId,
): CmsPageDocument {
  return store[pageId] ?? mergePageDocument(pageId, null);
}

export function AdminContentPanel({ t }: { t: Dictionary }) {
  const { store, refresh } = usePageContent();
  const [selected, setSelected] = useState<CmsPageId | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ar, setAr] = useState<Record<string, unknown>>({});
  const [en, setEn] = useState<Record<string, unknown>>({});
  const [images, setImages] = useState<CmsPageImages>({});

  const openPage = useCallback(
    (pageId: CmsPageId) => {
      const initial = cloneEditorState(resolvePageDoc(store, pageId));
      setAr(initial.ar);
      setEn(initial.en);
      setImages(initial.images);
      setMessage("");
      setError("");
      setSelected(pageId);
    },
    [store],
  );

  const applyDoc = useCallback((doc: CmsPageDocument) => {
    const next = cloneEditorState(doc);
    setAr(next.ar);
    setEn(next.en);
    setImages(next.images);
  }, []);

  useEffect(() => {
    if (!selected) return;
    applyDoc(resolvePageDoc(store, selected));
    setRefreshing(true);
    setError("");
    void getPageContent(selected)
      .then(applyDoc)
      .catch(() => setError(t.admin.error))
      .finally(() => setRefreshing(false));
  }, [selected, applyDoc, t.admin.error]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await savePageContent(selected, { ar, en, images });
      await refresh();
      setMessage(t.admin.cmsSaved);
    } catch {
      setError(t.admin.error);
    } finally {
      setBusy(false);
    }
  };

  if (!selected) {
    return (
      <AdminPanelShell title={t.admin.content}>
        <p className="mb-5 text-sm text-muted-foreground">{t.admin.cmsHint}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CMS_PAGES.filter((p) => p.id !== "shared").map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => openPage(page.id)}
              className="rounded-2xl border border-border bg-card p-5 text-start transition-colors hover:border-gold/45 hover:bg-card/90"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-navy/5 text-navy">
                <FileText size={18} />
              </span>
              <p className="mt-4 font-display text-lg font-semibold text-navy">{cmsPageLabel(page.id, t)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{page.path}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => openPage("shared")}
            className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-start transition-colors hover:border-gold/45 sm:col-span-2 xl:col-span-3"
          >
            <p className="font-display text-lg font-semibold text-navy">{cmsPageLabel("shared", t)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.admin.cmsSharedHint}</p>
          </button>
        </div>
      </AdminPanelShell>
    );
  }

  return (
    <AdminPanelShell
      title={cmsPageLabel(selected, t)}
      action={
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-gold/45"
        >
          <ArrowLeft size={16} />
          {t.admin.cmsBack}
        </button>
      }
    >
      <p className="mb-5 text-sm text-muted-foreground">{t.admin.cmsPageHint}</p>
      {refreshing ? (
        <p className="mb-4 text-sm text-muted-foreground">{t.admin.loading}</p>
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        {error ? (
          <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </p>
        ) : null}

        {selected ? (
          <SchemaContentEditor
            pageId={selected}
            ar={ar}
            en={en}
            images={images}
            defaultImages={defaultPageImages(selected)}
            onChangeAr={setAr}
            onChangeEn={setEn}
            onChangeImages={setImages}
          />
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || refreshing}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-white hover:bg-gold/90 disabled:opacity-60"
          >
            {busy ? t.auth.working : t.admin.save}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setSelected(null)}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground hover:border-gold/45"
          >
            {t.admin.cancel}
          </button>
        </div>
      </form>
    </AdminPanelShell>
  );
}
