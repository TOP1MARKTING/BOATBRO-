import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { GalleryPicker } from "./gallery-picker";
import type { PostInput } from "../../lib/db";
import { listGalleryImages, uploadCover, type GalleryImage } from "../../lib/db";
import {
  createHeading,
  createImage,
  createParagraph,
  createQuote,
  emptyLocalized,
  insertExternalLinkInParagraph,
  insertInternalLinkInParagraph,
  parseTags,
  tagsToString,
  type LocalizedText,
  type PostBlock,
} from "../../lib/post-content";
import { AdminPostSeo } from "./admin-post-seo";

const fieldCls =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/15";

function BilingualField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: { en: string; ar: string };
}) {
  const Input = multiline ? "textarea" : "input";
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label>
        <span className="mb-2 block text-[12px] font-medium text-navy">{label} · EN</span>
        <Input
          rows={multiline ? rows : undefined}
          className={fieldCls}
          value={value.en}
          placeholder={placeholder?.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
        />
      </label>
      <label>
        <span className="mb-2 block text-[12px] font-medium text-navy">{label} · AR</span>
        <Input
          rows={multiline ? rows : undefined}
          className={fieldCls}
          value={value.ar}
          placeholder={placeholder?.ar}
          onChange={(e) => onChange({ ...value, ar: e.target.value })}
        />
      </label>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-2/50 p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
        {hint ? <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

type EditorLabels = ReturnType<typeof buildEditorLabels>;

function buildEditorLabels(t: ReturnType<typeof import("../lib/i18n").useLang>["t"]) {
  return {
    slug: t.admin.slug,
    slugHint: t.admin.slugHint,
    contentSection: t.admin.contentSection,
    contentHint: t.admin.contentHint,
    publishSection: t.admin.publishSection,
    coverSection: t.admin.coverSection,
    addParagraph: t.admin.addParagraph,
    addHeading: t.admin.addHeading,
    addQuote: t.admin.addQuote,
    addImage: t.admin.addImage,
    deleteBlock: t.admin.deleteBlock,
    moveUp: t.admin.moveUp,
    moveDown: t.admin.moveDown,
    blockParagraph: t.admin.blockParagraph,
    blockHeading: t.admin.blockHeading,
    blockQuote: t.admin.blockQuote,
    blockImage: t.admin.blockImage,
    externalLinks: t.admin.externalLinks,
    externalLinksHint: t.admin.externalLinksHint,
    internalLinks: t.admin.internalLinks,
    internalLinksHint: t.admin.internalLinksHint,
    linkTextEn: t.admin.linkTextEn,
    linkTextAr: t.admin.linkTextAr,
    linkUrl: t.admin.linkUrl,
    targetParagraph: t.admin.targetParagraph,
    targetSection: t.admin.targetSection,
    insertExternalLink: t.admin.insertExternalLink,
    insertInternalLink: t.admin.insertInternalLink,
    inlineImages: t.admin.inlineImages,
    inlineImagesHint: t.admin.inlineImagesHint,
    insertAtCursor: t.admin.insertAtCursor,
    insertAtEnd: t.admin.insertAtEnd,
    imageUrl: t.admin.coverUrl,
    imageAlt: t.admin.imageAlt,
    imageCaption: t.admin.imageCaption,
    upload: t.admin.upload,
    uploadHint: t.admin.uploadHint,
    featured: t.admin.featured,
    status: t.admin.status,
    draft: t.admin.draft,
    published: t.admin.published,
    tags: t.admin.tags,
    title: t.admin.titleField,
    excerpt: t.admin.excerpt,
    category: t.admin.category,
    author: t.admin.author,
    coverAlt: t.admin.coverAlt,
    save: t.admin.save,
    cancel: t.admin.cancel,
    seo: t.admin.seoTab,
    pickFromGallery: t.admin.pickFromGallery,
    galleryEmpty: t.admin.galleryEmpty,
  };
}

export function AdminPostEditor({
  form,
  setForm,
  onSubmit,
  onCancel,
  busy,
  message,
  uid,
  t,
  seoLabels,
}: {
  form: PostInput;
  setForm: (next: PostInput | ((prev: PostInput) => PostInput)) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  busy: boolean;
  message: string;
  uid: string;
  t: ReturnType<typeof import("../lib/i18n").useLang>["t"];
  seoLabels: React.ComponentProps<typeof AdminPostSeo>["labels"];
}) {
  const labels = useMemo(() => buildEditorLabels(t), [t]);
  const [cursorBlockId, setCursorBlockId] = useState<string>(() => form.blocks[0]?.id ?? "");
  const [linkEn, setLinkEn] = useState("");
  const [linkAr, setLinkAr] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkParagraphId, setLinkParagraphId] = useState("");
  const [internalLabelEn, setInternalLabelEn] = useState("");
  const [internalLabelAr, setInternalLabelAr] = useState("");
  const [internalParagraphId, setInternalParagraphId] = useState("");
  const [internalTargetId, setInternalTargetId] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"cover" | string>("cover");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const openGallery = (target: "cover" | string) => {
    setGalleryTarget(target);
    setGalleryOpen(true);
    setGalleryLoading(true);
    void listGalleryImages()
      .then(setGalleryImages)
      .catch(() => setGalleryImages([]))
      .finally(() => setGalleryLoading(false));
  };

  const applyGalleryImage = (url: string, image: GalleryImage) => {
    if (galleryTarget === "cover") {
      setForm((prev) => ({
        ...prev,
        coverUrl: url,
        coverAlt: {
          ar: prev.coverAlt.ar || image.alt.ar || image.name,
          en: prev.coverAlt.en || image.alt.en || image.name,
        },
      }));
      return;
    }
    updateBlock(galleryTarget, (b) => ({ ...b, url, alt: image.alt } as PostBlock));
  };

  const contentBlocks = form.blocks.filter((b) => b.type !== "image");
  const imageBlocks = form.blocks.filter((b) => b.type === "image") as Extract<PostBlock, { type: "image" }>[];
  const paragraphBlocks = contentBlocks.filter((b) => b.type === "paragraph");
  const headingBlocks = contentBlocks.filter((b) => b.type === "heading");

  const updateBlock = (id: string, updater: (block: PostBlock) => PostBlock) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => (block.id === id ? updater(block) : block)),
    }));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    setForm((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === id && b.type !== "image");
      if (idx < 0) return prev;
      const content = prev.blocks.filter((b) => b.type !== "image");
      const images = prev.blocks.filter((b) => b.type === "image");
      const contentIdx = content.findIndex((b) => b.id === id);
      const target = contentIdx + direction;
      if (target < 0 || target >= content.length) return prev;
      const nextContent = [...content];
      const [item] = nextContent.splice(contentIdx, 1);
      if (!item) return prev;
      nextContent.splice(target, 0, item);
      return { ...prev, blocks: [...nextContent, ...images] };
    });
  };

  const removeBlock = (id: string) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id && (b.type !== "image" || b.afterBlockId !== id)),
    }));
  };

  const addBlock = (block: PostBlock) => {
    setForm((prev) => ({ ...prev, blocks: [...prev.blocks.filter((b) => b.type !== "image"), block, ...prev.blocks.filter((b) => b.type === "image")] }));
    if (block.type !== "image") setCursorBlockId(block.id);
  };

  const uploadImage = async (file: File, apply: (url: string) => void) => {
    const url = await uploadCover(file, uid);
    apply(url);
  };

  const insertExternal = () => {
    const paragraphId = linkParagraphId || cursorBlockId;
    const label = { en: linkEn, ar: linkAr };
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === paragraphId && block.type === "paragraph"
          ? insertExternalLinkInParagraph(block, "en", label, linkUrl)
          : block,
      ),
    }));
    setLinkEn("");
    setLinkAr("");
    setLinkUrl("https://");
  };

  const insertInternal = () => {
    const paragraphId = internalParagraphId || cursorBlockId;
    const label = { en: internalLabelEn, ar: internalLabelAr };
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === paragraphId && block.type === "paragraph"
          ? insertInternalLinkInParagraph(block, label, internalTargetId)
          : block,
      ),
    }));
    setInternalLabelEn("");
    setInternalLabelAr("");
  };

  return (
    <form onSubmit={onSubmit} className="mb-6 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <Section title={labels.title} hint={labels.slugHint}>
        <div className="space-y-4">
          <BilingualField
            label={labels.title}
            value={form.titleI18n}
            onChange={(titleI18n) => setForm((prev) => ({ ...prev, titleI18n }))}
          />
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{labels.slug}</span>
            <input
              required
              className={fieldCls}
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{labels.slugHint}</p>
          </label>
          <BilingualField
            label={labels.excerpt}
            value={form.excerptI18n}
            onChange={(excerptI18n) => setForm((prev) => ({ ...prev, excerptI18n }))}
            multiline
          />
        </div>
      </Section>

      <Section title={labels.contentSection} hint={labels.contentHint}>
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => addBlock(createParagraph())} className="rounded-full border border-border px-3 py-1.5 text-[12px] hover:border-gold">{labels.addParagraph}</button>
          <button type="button" onClick={() => addBlock(createHeading(2))} className="rounded-full border border-border px-3 py-1.5 text-[12px] hover:border-gold">{labels.addHeading}</button>
          <button type="button" onClick={() => addBlock(createQuote())} className="rounded-full border border-border px-3 py-1.5 text-[12px] hover:border-gold">{labels.addQuote}</button>
        </div>

        <div className="space-y-4">
          {contentBlocks.map((block, index) => {
            const selected = cursorBlockId === block.id;
            const title =
              block.type === "paragraph"
                ? `${labels.blockParagraph} #${index + 1}`
                : block.type === "heading"
                  ? `${labels.blockHeading} H${block.level}`
                  : labels.blockQuote;
            return (
              <div
                key={block.id}
                className={`rounded-xl border p-4 transition-colors ${selected ? "border-gold bg-gold/5" : "border-border bg-card"}`}
                onClick={() => setCursorBlockId(block.id)}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-navy">{title}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveBlock(block.id, -1)} className="rounded-lg p-1.5 hover:bg-muted" aria-label={labels.moveUp}><ChevronUp size={16} /></button>
                    <button type="button" onClick={() => moveBlock(block.id, 1)} className="rounded-lg p-1.5 hover:bg-muted" aria-label={labels.moveDown}><ChevronDown size={16} /></button>
                    <button type="button" onClick={() => removeBlock(block.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10" aria-label={labels.deleteBlock}><Trash2 size={16} /></button>
                  </div>
                </div>
                {"text" in block ? (
                  <BilingualField
                    label={title}
                    value={block.text}
                    onChange={(text) => updateBlock(block.id, (b) => ({ ...b, text } as PostBlock))}
                    multiline
                    rows={block.type === "quote" ? 4 : 5}
                    placeholder={{
                      en: "Write paragraph text…",
                      ar: "اكتب نص الفقرة…",
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-medium text-navy">{labels.externalLinks}</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">{labels.externalLinksHint}</p>
            <div className="mt-3 grid gap-2">
              <input className={fieldCls} placeholder={labels.linkTextEn} value={linkEn} onChange={(e) => setLinkEn(e.target.value)} />
              <input className={fieldCls} placeholder={labels.linkTextAr} value={linkAr} onChange={(e) => setLinkAr(e.target.value)} />
              <input className={fieldCls} placeholder={labels.linkUrl} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              <select className={fieldCls} value={linkParagraphId || cursorBlockId} onChange={(e) => setLinkParagraphId(e.target.value)}>
                {paragraphBlocks.map((p, i) => (
                  <option key={p.id} value={p.id}>{labels.targetParagraph} #{i + 1}</option>
                ))}
              </select>
              <button type="button" onClick={insertExternal} className="rounded-full bg-navy-deep px-4 py-2 text-[12px] text-white">{labels.insertExternalLink}</button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-medium text-navy">{labels.internalLinks}</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">{labels.internalLinksHint}</p>
            <div className="mt-3 grid gap-2">
              <input className={fieldCls} placeholder={labels.linkTextEn} value={internalLabelEn} onChange={(e) => setInternalLabelEn(e.target.value)} />
              <input className={fieldCls} placeholder={labels.linkTextAr} value={internalLabelAr} onChange={(e) => setInternalLabelAr(e.target.value)} />
              <select className={fieldCls} value={internalParagraphId || cursorBlockId} onChange={(e) => setInternalParagraphId(e.target.value)}>
                {paragraphBlocks.map((p, i) => (
                  <option key={p.id} value={p.id}>{labels.targetParagraph} #{i + 1}</option>
                ))}
              </select>
              <select className={fieldCls} value={internalTargetId} onChange={(e) => setInternalTargetId(e.target.value)}>
                <option value="">{labels.targetSection}</option>
                {headingBlocks.map((h, i) => (
                  <option key={h.id} value={h.id}>H{h.level} · #{i + 1}</option>
                ))}
              </select>
              <button type="button" onClick={insertInternal} className="rounded-full bg-navy-deep px-4 py-2 text-[12px] text-white">{labels.insertInternalLink}</button>
            </div>
          </div>
        </div>
      </Section>

      <Section title={labels.inlineImages} hint={labels.inlineImagesHint}>
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, blocks: [...prev.blocks, createImage(cursorBlockId || "end")] }))} className="rounded-full border border-gold/45 px-4 py-2 text-[12px] text-gold-ink">{labels.insertAtCursor}</button>
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, blocks: [...prev.blocks, createImage("end")] }))} className="rounded-full border border-border px-4 py-2 text-[12px]">{labels.insertAtEnd}</button>
        </div>
        <div className="space-y-4">
          {imageBlocks.map((image, index) => (
            <div key={image.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-navy">{labels.blockImage} #{index + 1}</p>
                <button type="button" onClick={() => removeBlock(image.id)} className="text-[12px] text-destructive">{labels.deleteBlock}</button>
              </div>
              <div className="grid gap-3">
                <input className={fieldCls} value={image.url} placeholder={labels.imageUrl} onChange={(e) => updateBlock(image.id, (b) => ({ ...b, url: e.target.value } as PostBlock))} />
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] hover:border-gold">
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f, (url) => updateBlock(image.id, (b) => ({ ...b, url } as PostBlock))); }} />
                    {labels.upload}
                  </label>
                  <button type="button" onClick={() => openGallery(image.id)} className="rounded-full border border-gold/45 px-3 py-1.5 text-[12px] text-gold-ink hover:bg-gold/10">
                    {labels.pickFromGallery}
                  </button>
                </div>
                <BilingualField label={labels.imageAlt} value={image.alt} onChange={(alt) => updateBlock(image.id, (b) => ({ ...b, alt } as PostBlock))} />
                <BilingualField label={labels.imageCaption} value={image.caption} onChange={(caption) => updateBlock(image.id, (b) => ({ ...b, caption } as PostBlock))} multiline rows={2} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={labels.publishSection}>
        <div className="grid gap-4 md:grid-cols-2">
          <BilingualField label={labels.category} value={form.categoryI18n} onChange={(categoryI18n) => setForm((prev) => ({ ...prev, categoryI18n }))} />
          <BilingualField label={labels.author} value={form.authorI18n} onChange={(authorI18n) => setForm((prev) => ({ ...prev, authorI18n }))} />
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{labels.tags} · EN</span>
            <input className={fieldCls} value={tagsToString(form.tags.en)} onChange={(e) => setForm((prev) => ({ ...prev, tags: { ...prev.tags, en: parseTags(e.target.value) } }))} />
          </label>
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{labels.tags} · AR</span>
            <input className={fieldCls} value={tagsToString(form.tags.ar)} onChange={(e) => setForm((prev) => ({ ...prev, tags: { ...prev.tags, ar: parseTags(e.target.value) } }))} />
          </label>
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{labels.status}</span>
            <select className={fieldCls} value={form.published ? "published" : "draft"} onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.value === "published" }))}>
              <option value="draft">{labels.draft}</option>
              <option value="published">{labels.published}</option>
            </select>
          </label>
          <label className="flex items-center gap-3 self-end text-sm text-navy">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))} />
            {labels.featured}
          </label>
        </div>
      </Section>

      <Section title={labels.coverSection} hint={labels.uploadHint}>
        <div className="grid gap-4">
          <input className={fieldCls} value={form.coverUrl} onChange={(e) => setForm((prev) => ({ ...prev, coverUrl: e.target.value }))} placeholder={labels.imageUrl} />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-[12px] hover:border-gold">
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f, (url) => setForm((prev) => ({ ...prev, coverUrl: url }))); }} />
              {labels.upload}
            </label>
            <button type="button" onClick={() => openGallery("cover")} className="rounded-full border border-gold/45 px-4 py-2 text-[12px] text-gold-ink hover:bg-gold/10">
              {labels.pickFromGallery}
            </button>
          </div>
          <BilingualField label={labels.coverAlt} value={form.coverAlt} onChange={(coverAlt) => setForm((prev) => ({ ...prev, coverAlt }))} />
        </div>
      </Section>

      <Section title={labels.seo}>
        <AdminPostSeo form={form} setForm={setForm} fieldCls={fieldCls} labels={seoLabels} bilingual />
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button type="submit" disabled={busy} className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60">
          {busy ? t.auth.working : labels.save}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-muted-foreground">{labels.cancel}</button>
        {message ? <span className="text-sm text-gold-ink">{message}</span> : null}
      </div>

      <GalleryPicker
        open={galleryOpen}
        images={galleryImages}
        loading={galleryLoading}
        title={labels.pickFromGallery}
        empty={labels.galleryEmpty}
        onClose={() => setGalleryOpen(false)}
        onSelect={applyGalleryImage}
      />
    </form>
  );
}
