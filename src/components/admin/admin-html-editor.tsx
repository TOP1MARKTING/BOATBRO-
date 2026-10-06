import {
  Bold,
  Eye,
  EyeOff,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Table,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { BlogHtmlBody } from "../blog-post-body";
import type { GalleryImage } from "../../lib/db";
import { buildFigureHtml, escapeHtml, htmlHeadings, type FigureSize } from "../../lib/post-html";
import { ADMIN_BTN_SECONDARY, ADMIN_FIELD_CLS } from "./shared";

const c = {
  contentLabel: "المحتوى (HTML)",
  contentHint: "استخدم عناوين h2/h3 لأقسام المقال. لربط كلمة برابط: حدّدها في المحرر ثم استخدم أداة الروابط أدناه.",
  showPreview: "عرض المعاينة",
  hidePreview: "إخفاء المعاينة",
  previewEmpty: "اكتب أو الصق HTML وستظهر المعاينة هنا كما ستبدو في الموقع.",
  h2: "عنوان رئيسي (H2)",
  h3: "عنوان فرعي (H3)",
  p: "فقرة",
  bold: "عريض",
  italic: "مائل",
  ul: "قائمة نقطية",
  ol: "قائمة مرقمة",
  quote: "اقتباس",
  table: "جدول",
  hr: "خط فاصل",
  externalTitle: "روابط خارجية (كلمات قابلة للنقر)",
  externalHint: "حدّد كلمة في النص، الصق الرابط، ثم اضغط إدراج — ستظهر بلون مختلف وتفتح عند الضغط.",
  linkText: "نص الرابط",
  linkTextPh: "اتركه فارغاً لاستخدام النص المحدد",
  linkUrl: "الرابط (URL)",
  insertExternal: "إدراج رابط خارجي",
  internalTitle: "روابط داخل المقال",
  internalHint:
    "اربط جملة أو كلمة بقسم معيّن (عنوان h2 أو h3). يمكنك تحديد النص في المحرر ثم اختيار القسم، أو كتابة نص الرابط يدوياً.",
  internalEmpty: "أضف عناوين مثل <h2>عنوان القسم</h2> داخل المحتوى حتى تظهر هنا كأهداف للروابط.",
  section: "القسم",
  sectionNone: "— اختر عنوانًا —",
  insertInternal: "إدراج رابط داخلي",
  imagesTitle: "صور داخل المقال",
  imagesHint: "ارفع أكثر من صورة وحدد مكان كل واحدة: عند المؤشر في المحرر، أو في نهاية المقال.",
  alt: "وصف الصورة (Alt)",
  altPh: "وصف مختصر للصورة",
  caption: "تعليق تحت الصورة (اختياري)",
  captionPh: "نص يظهر تحت الصورة",
  chooseFile: "اختر صورة من الجهاز",
  fromGallery: "من المعرض",
  orUrl: "أو الصق رابط صورة https://…",
  noImage: "لم يتم اختيار صورة",
  uploading: "جاري رفع الصورة…",
  uploadError: "تعذّر رفع الصورة، حاول مرة أخرى.",
  size: "حجم الصورة",
  sizeFull: "عرض كامل",
  sizeMedium: "متوسط",
  sizeSmall: "صغير",
  insertCursor: "إدراج عند المؤشر",
  insertEnd: "إدراج في نهاية المقال",
  inArticle: "الصور الموجودة في المقال — اضغط لتحديد الكود",
};

const PLACEHOLDERS = {
  ar: { phHeading: "عنوان القسم", phText: "اكتب النص هنا", phItem: "عنصر", col: "العمود", cell: "قيمة" },
  en: { phHeading: "Section heading", phText: "Write text here", phItem: "Item", col: "Column", cell: "Value" },
};

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-lg text-navy transition-colors hover:bg-card"
    >
      {children}
    </button>
  );
}

function ToolCard({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-[13px] font-semibold text-navy">{title}</h4>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{hint}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-[12px] font-medium text-navy">{children}</span>;
}

/** Single-language HTML content field with link and inline-image tools (Top1-style). */
export function AdminHtmlEditor({
  value,
  onChange,
  contentLang,
  uploadImage,
  openGallery,
}: {
  value: string;
  onChange: (next: string) => void;
  contentLang: "ar" | "en";
  uploadImage: (file: File) => Promise<string>;
  openGallery: (onPick: (url: string, image: GalleryImage) => void) => void;
}) {
  const placeholders = PLACEHOLDERS[contentLang];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const [extText, setExtText] = useState("");
  const [extUrl, setExtUrl] = useState("");
  const [intText, setIntText] = useState("");
  const [intTarget, setIntTarget] = useState("");

  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [imgSize, setImgSize] = useState<FigureSize>("full");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const headings = useMemo(() => htmlHeadings(value), [value]);
  const images = useMemo(
    () =>
      [...value.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((m) => ({
        src: m[1] ?? "",
        index: m.index ?? 0,
        length: m[0].length,
      })),
    [value],
  );

  const selectRange = (start: number, end: number) => {
    window.requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  };

  const currentSelection = () => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    return { start, end, selected: value.slice(start, end) };
  };

  const insert = (
    build: (selected: string) => { html: string; focusStart?: number; focusEnd?: number },
    { block = false, atEnd = false }: { block?: boolean; atEnd?: boolean } = {},
  ) => {
    const sel = atEnd ? { start: value.length, end: value.length, selected: "" } : currentSelection();
    const { html, focusStart, focusEnd } = build(sel.selected);
    const before = atEnd ? value.slice(0, sel.start).trimEnd() : value.slice(0, sel.start);
    const after = value.slice(sel.end);
    const lead = block && before.trim() ? (before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n") : "";
    const trail = block && after.trim() ? (after.startsWith("\n") ? "" : "\n\n") : "";
    onChange(`${before}${lead}${html}${trail}${after}`);
    const base = before.length + lead.length;
    selectRange(base + (focusStart ?? html.length), base + (focusEnd ?? focusStart ?? html.length));
  };

  const wrap = (tag: string, placeholder: string, block: boolean) =>
    insert(
      (selected) => {
        const inner = (block ? selected.trim() : selected) || placeholder;
        const open = `<${tag}>`;
        return { html: `${open}${inner}</${tag}>`, focusStart: open.length, focusEnd: open.length + inner.length };
      },
      { block },
    );

  const insertList = (tag: "ul" | "ol") =>
    insert(
      (selected) => {
        const lines = selected.split("\n").map((l) => l.trim()).filter(Boolean);
        const items = (lines.length ? lines : [`${placeholders.phItem} 1`, `${placeholders.phItem} 2`])
          .map((line) => `  <li>${line}</li>`)
          .join("\n");
        return { html: `<${tag}>\n${items}\n</${tag}>` };
      },
      { block: true },
    );

  const insertTable = () => {
    const { col, cell } = placeholders;
    insert(
      () => ({
        html: [
          "<table>",
          "  <thead>",
          `    <tr><th>${col} 1</th><th>${col} 2</th></tr>`,
          "  </thead>",
          "  <tbody>",
          `    <tr><td>${cell}</td><td>${cell}</td></tr>`,
          "  </tbody>",
          "</table>",
        ].join("\n"),
      }),
      { block: true },
    );
  };

  const insertLink = (href: string, text: string) => {
    insert((selected) => {
      const label = text.trim() || selected || href;
      return { html: `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>` };
    });
  };

  const onExternal = () => {
    const url = extUrl.trim();
    if (!url) return;
    insertLink(/^(https?:|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`, extText);
    setExtText("");
    setExtUrl("");
  };

  const onInternal = () => {
    if (!intTarget) return;
    insertLink(`#${intTarget}`, intText);
    setIntText("");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(false);
    try {
      setImgUrl(await uploadImage(file));
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const onInsertImage = (atEnd: boolean) => {
    const url = imgUrl.trim();
    if (!url) return;
    insert(() => ({ html: buildFigureHtml(url, imgAlt.trim(), imgCaption, imgSize) }), { block: true, atEnd });
    setImgUrl("");
    setImgAlt("");
    setImgCaption("");
    setImgSize("full");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <FieldLabel>{c.contentLabel}</FieldLabel>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gold-ink hover:underline"
          >
            {preview ? <EyeOff size={14} /> : <Eye size={14} />}
            {preview ? c.hidePreview : c.showPreview}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-border bg-surface-2 p-1">
          <ToolButton label={c.h2} onClick={() => wrap("h2", placeholders.phHeading, true)}><Heading2 size={16} /></ToolButton>
          <ToolButton label={c.h3} onClick={() => wrap("h3", placeholders.phHeading, true)}><Heading3 size={16} /></ToolButton>
          <ToolButton label={c.p} onClick={() => wrap("p", placeholders.phText, true)}><Pilcrow size={16} /></ToolButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton label={c.bold} onClick={() => wrap("strong", placeholders.phText, false)}><Bold size={16} /></ToolButton>
          <ToolButton label={c.italic} onClick={() => wrap("em", placeholders.phText, false)}><Italic size={16} /></ToolButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton label={c.ul} onClick={() => insertList("ul")}><List size={16} /></ToolButton>
          <ToolButton label={c.ol} onClick={() => insertList("ol")}><ListOrdered size={16} /></ToolButton>
          <ToolButton label={c.quote} onClick={() => wrap("blockquote", placeholders.phText, true)}><Quote size={16} /></ToolButton>
          <ToolButton label={c.table} onClick={insertTable}><Table size={16} /></ToolButton>
          <ToolButton label={c.hr} onClick={() => insert(() => ({ html: "<hr />" }), { block: true })}><Minus size={16} /></ToolButton>
        </div>

        <div className={preview ? "grid gap-3 lg:grid-cols-2" : ""}>
          <textarea
            ref={textareaRef}
            dir="ltr"
            spellCheck={false}
            rows={16}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="<p></p>"
            className={`${ADMIN_FIELD_CLS} !rounded-t-none resize-y font-mono text-[12.5px] leading-6`}
          />
          {preview ? (
            <div
              dir={contentLang === "ar" ? "rtl" : "ltr"}
              className="max-h-[32rem] overflow-y-auto rounded-xl border border-border bg-background p-5"
            >
              {value.trim() ? <BlogHtmlBody html={value} className="" /> : <p className="text-[13px] text-muted-foreground">{c.previewEmpty}</p>}
            </div>
          ) : null}
        </div>
        <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{c.contentHint}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCard title={c.externalTitle} hint={c.externalHint}>
          <div className="grid gap-3">
            <label>
              <FieldLabel>{c.linkText}</FieldLabel>
              <input className={ADMIN_FIELD_CLS} placeholder={c.linkTextPh} value={extText} onChange={(e) => setExtText(e.target.value)} />
            </label>
            <label>
              <FieldLabel>{c.linkUrl}</FieldLabel>
              <input dir="ltr" className={ADMIN_FIELD_CLS} placeholder="https://www.example.com" value={extUrl} onChange={(e) => setExtUrl(e.target.value)} />
            </label>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onExternal} disabled={!extUrl.trim()} className="justify-self-start rounded-full bg-navy-deep px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40">
              {c.insertExternal}
            </button>
          </div>
        </ToolCard>

        <ToolCard title={c.internalTitle} hint={c.internalHint}>
          {headings.length ? (
            <div className="grid gap-3">
              <label>
                <FieldLabel>{c.linkText}</FieldLabel>
                <input className={ADMIN_FIELD_CLS} placeholder={c.linkTextPh} value={intText} onChange={(e) => setIntText(e.target.value)} />
              </label>
              <label>
                <FieldLabel>{c.section}</FieldLabel>
                <select className={ADMIN_FIELD_CLS} value={intTarget} onChange={(e) => setIntTarget(e.target.value)}>
                  <option value="">{c.sectionNone}</option>
                  {headings.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.level === 3 ? "— " : ""}
                      {h.text}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onInternal} disabled={!intTarget} className="justify-self-start rounded-full bg-navy-deep px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40">
                {c.insertInternal}
              </button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2.5 text-[12px] leading-6 text-muted-foreground">
              {c.internalEmpty}
            </p>
          )}
        </ToolCard>
      </div>

      <ToolCard title={c.imagesTitle} hint={c.imagesHint}>
        <div className="grid gap-4 md:grid-cols-[1fr_13rem]">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <FieldLabel>{c.alt}</FieldLabel>
                <input className={ADMIN_FIELD_CLS} placeholder={c.altPh} value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} />
              </label>
              <label>
                <FieldLabel>{c.caption}</FieldLabel>
                <input className={ADMIN_FIELD_CLS} placeholder={c.captionPh} value={imgCaption} onChange={(e) => setImgCaption(e.target.value)} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className={`${ADMIN_BTN_SECONDARY} inline-flex cursor-pointer items-center gap-1.5`}>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
                <Upload size={14} />
                {c.chooseFile}
              </label>
              <button
                type="button"
                className={ADMIN_BTN_SECONDARY}
                onClick={() =>
                  openGallery((url, image) => {
                    setImgUrl(url);
                    setImgAlt((prev) => prev || image.alt[contentLang] || image.name);
                    setImgCaption((prev) => prev || image.caption[contentLang] || "");
                  })
                }
              >
                {c.fromGallery}
              </button>
            </div>
            <input dir="ltr" className={ADMIN_FIELD_CLS} placeholder={c.orUrl} value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} />
            {uploading ? <p className="text-[12px] text-gold-ink">{c.uploading}</p> : null}
            {uploadError ? <p className="text-[12px] text-destructive">{c.uploadError}</p> : null}
            <div>
              <FieldLabel>{c.size}</FieldLabel>
              <div className="inline-flex rounded-full border border-border bg-surface-2 p-1">
                {(
                  [
                    ["full", c.sizeFull],
                    ["medium", c.sizeMedium],
                    ["small", c.sizeSmall],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setImgSize(id)}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                      imgSize === id ? "bg-navy-deep text-white" : "text-navy hover:bg-card"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface-2">
              {imgUrl.trim() ? (
                <img src={imgUrl.trim()} alt={imgAlt} className="h-full w-full object-cover" />
              ) : (
                <span className="px-3 text-center text-[11px] text-muted-foreground">{c.noImage}</span>
              )}
            </div>
            <button type="button" onMouseDown={(e) => e.preventDefault()} disabled={!imgUrl.trim() || uploading} onClick={() => onInsertImage(false)} className="rounded-full bg-navy-deep px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40">
              {c.insertCursor}
            </button>
            <button type="button" disabled={!imgUrl.trim() || uploading} onClick={() => onInsertImage(true)} className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-navy disabled:opacity-40">
              {c.insertEnd}
            </button>
          </div>
        </div>
        {images.length ? (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[11px] text-muted-foreground">
              {c.inArticle} ({images.length})
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((img, i) => (
                <button
                  key={`${img.index}-${i}`}
                  type="button"
                  onClick={() => selectRange(img.index, img.index + img.length)}
                  className="relative size-14 overflow-hidden rounded-lg border border-border hover:border-gold"
                >
                  <img src={img.src} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-navy-deep/70 text-[10px] text-white">#{i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </ToolCard>
    </div>
  );
}
