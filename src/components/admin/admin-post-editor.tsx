import { ArrowRight, ChevronDown, ImageIcon, Save, Upload, X } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AdminHtmlEditor } from "./admin-html-editor";
import { AdminPostSeo } from "./admin-post-seo";
import { GalleryPicker } from "./gallery-picker";
import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY, ADMIN_CARD_CLS, ADMIN_FIELD_CLS } from "./shared";
import { dictionaries } from "../../lib/copy";
import type { PostInput } from "../../lib/db";
import { listGalleryImages, uploadCover, type GalleryImage } from "../../lib/db";
import { parseTags, tagsToString, type LocalizedText } from "../../lib/post-content";
import { SEO_LIMITS, charCountTone } from "../../lib/post-seo";

const fieldCls = ADMIN_FIELD_CLS;

const c = {
  back: "رجوع",
  newTitle: "مقال جديد",
  editTitle: "تعديل المقال",
  lead: "أضف عنواناً واضحاً، محتوى المقال، غلاف، وتصنيف — ثم احفظ كمسودة أو انشر.",
  basics: "أساسيات المقال",
  basicsHint: "العنوان والرابط والمقتطف يظهرون في قائمة المدونة ونتائج البحث.",
  titleAr: "العنوان (عربي)",
  titleArPh: "مثال: دليل اختيار المرسى المناسب ليختك",
  titleEn: "العنوان (English)",
  titleEnPh: "English title",
  slug: "Slug",
  slugHint: "بالإنجليزية — جزء من رابط المقال. اتركه فارغاً ليُنشأ تلقائياً من العنوان.",
  excerptAr: "المقتطف (عربي)",
  excerptArPh: "ملخص قصير يظهر تحت العنوان في قائمة المدونة",
  excerptEn: "المقتطف (English)",
  excerptEnPh: "English excerpt",
  content: "المحتوى",
  contentHint: "اكتب المحتوى بصيغة HTML، ويمكنك إدراج صور وروابط داخل النص.",
  english: "النسخة الإنجليزية",
  englishHint: "تظهر للزائر عند اختيار EN. اتركها فارغة لعرض المحتوى العربي بدلاً منها.",
  contentEn: "المحتوى (English)",
  copyFromAr: "انسخ المحتوى العربي كبداية",
  publish: "التصنيف والنشر",
  publishHint: "اختر تصنيف المقال وحالته. المقال الرائج يظهر في أعلى المدونة.",
  category: "التصنيف",
  authorAr: "الكاتب (عربي)",
  authorEn: "الكاتب (English)",
  authorPh: "بدون كاتب محدد",
  tagsAr: "الوسوم بالعربي (مفصولة بفاصلة)",
  tagsEn: "الوسوم بالإنجليزي (مفصولة بفاصلة)",
  tagsArPh: "يخوت, مراسي, السعودية",
  tagsEnPh: "yachts, marinas, saudi",
  status: "الحالة",
  draft: "مسودة",
  published: "منشور",
  featured: "مقال رائج (يظهر في الأعلى)",
  cover: "صورة الغلاف",
  coverHint: "تظهر أعلى المقال وفي بطاقات المدونة ومشاركة الروابط.",
  coverAr: "صورة الغلاف (عربي)",
  coverEn: "صورة الغلاف (English) — اختيارية",
  coverEnHint: "تظهر لزوار النسخة الإنجليزية. اتركها فارغة لاستخدام صورة الغلاف العربية.",
  coverUpload: "رفع صورة",
  coverGallery: "من المعرض",
  coverRemove: "إزالة الصورة",
  coverUrl: "رابط خارجي",
  coverEmpty: "لا توجد صورة بعد — ارفع صورة أو اخترها من المعرض.",
  coverUploading: "جاري رفع الصورة…",
  coverUploadError: "تعذّر رفع الصورة، حاول مرة أخرى.",
  coverTypes: "ارفع JPG أو PNG أو WebP. يتم ضغط الصورة تلقائياً قبل الرفع، ثم احفظ المقال.",
  coverAltAr: "وصف صورة الغلاف (Alt)",
  coverAltArPh: "وصف مختصر للصورة بالعربية",
  coverAltEn: "وصف الصورة (English)",
  coverAltEnPh: "English image description",
  seo: "SEO",
  seoHint: "العناوين والوصف تظهر في Google ومشاركات السوشيال ميديا.",
  metaTitlePh: "عنوان يظهر في نتائج البحث",
  metaDescPh: "وصف مختصر يشجّع على النقر",
  metaTitleEnPh: "Title shown in search results",
  metaDescEnPh: "Short description that encourages clicks",
  metaTitleEmpty: "فارغ — سيُستخدم عنوان المقال",
  metaDescEmpty: "فارغ — سيُستخدم المقتطف",
  seoEnglish: "النسخة الإنجليزية",
  advanced: "أدوات SEO متقدمة — معاينة Google، الكلمة المفتاحية، صورة المشاركة، الأسئلة الشائعة",
  save: "حفظ",
  saving: "جاري الحفظ…",
  saveNote: "احفظ التغييرات قبل مغادرة الصفحة",
  leaveConfirm: "لديك تغييرات غير محفوظة. هل تريد الرجوع بدون حفظ؟",
  galleryTitle: "اختر صورة من المعرض",
  galleryEmpty: "لا توجد صور في المعرض بعد.",
};

function Card({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${ADMIN_CARD_CLS} p-5 sm:p-6`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
          {hint ? <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-navy">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function MetaCounter({ value, fallbackEmpty, min, max }: { value: string; fallbackEmpty: string; min: number; max: number }) {
  if (!value.trim()) return <span className="text-[11px] text-muted-foreground">{fallbackEmpty}</span>;
  return (
    <span className={`text-[11px] font-medium ${charCountTone(value.length, min, max)}`}>
      {value.length}/{max}
    </span>
  );
}

function CoverSlot({
  label,
  hint,
  url,
  alt,
  onUrl,
  uploadImage,
  onGallery,
}: {
  label: string;
  hint?: string;
  url: string;
  alt: string;
  onUrl: (url: string) => void;
  uploadImage: (file: File) => Promise<string>;
  onGallery: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(false);
    try {
      onUrl(await uploadImage(file));
    } catch {
      setError(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-4">
      <p className="text-[13px] font-semibold text-navy">{label}</p>
      {hint ? <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{hint}</p> : null}
      <div className="relative mt-3 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface-2">
        {url ? (
          <>
            <img src={url} alt={alt} className="h-full w-full object-cover" />
            <button
              type="button"
              title={c.coverRemove}
              aria-label={c.coverRemove}
              onClick={() => onUrl("")}
              className="absolute top-2 left-2 inline-flex size-7 items-center justify-center rounded-full bg-navy-deep/75 text-white hover:bg-navy-deep"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center text-[12px] text-muted-foreground">
            <ImageIcon size={22} />
            {c.coverEmpty}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className={`${ADMIN_BTN_SECONDARY} inline-flex cursor-pointer items-center gap-1.5`}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Upload size={14} />
          {c.coverUpload}
        </label>
        <button type="button" className={ADMIN_BTN_SECONDARY} onClick={onGallery}>
          {c.coverGallery}
        </button>
      </div>
      {uploading ? <p className="mt-2 text-[12px] text-gold-ink">{c.coverUploading}</p> : null}
      {error ? <p className="mt-2 text-[12px] text-destructive">{c.coverUploadError}</p> : null}
      <div className="mt-3">
        <Field label={c.coverUrl}>
          <input dir="ltr" className={fieldCls} placeholder="https://…" value={url} onChange={(e) => onUrl(e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

export function AdminPostEditor({
  form,
  setForm,
  onSubmit,
  onCancel,
  busy,
  message,
  uid,
  isNew,
  seoLabels,
}: {
  form: PostInput;
  setForm: (next: PostInput | ((prev: PostInput) => PostInput)) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  busy: boolean;
  message: string;
  uid: string;
  isNew: boolean;
  seoLabels: React.ComponentProps<typeof AdminPostSeo>["labels"];
}) {
  const initial = useRef(JSON.stringify(form));
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const galleryCallback = useRef<((url: string, image: GalleryImage) => void) | null>(null);

  const categoriesAr = dictionaries.ar.admin.categories;
  const categoriesEn = dictionaries.en.admin.categories;
  const categoryIndex = categoriesAr.indexOf(form.categoryI18n.ar);

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setLocalized = (key: keyof PostInput, lang: keyof LocalizedText, value: string) =>
    setForm((prev) => ({ ...prev, [key]: { ...(prev[key] as LocalizedText), [lang]: value } }));

  const openGallery = (onPick: (url: string, image: GalleryImage) => void) => {
    galleryCallback.current = onPick;
    setGalleryOpen(true);
    setGalleryLoading(true);
    void listGalleryImages()
      .then(setGalleryImages)
      .catch(() => setGalleryImages([]))
      .finally(() => setGalleryLoading(false));
  };

  const uploadImage = (file: File) => uploadCover(file, uid);

  const pickCover = (key: "coverUrl" | "coverUrlEn") =>
    openGallery((url, image) =>
      setForm((prev) => ({
        ...prev,
        [key]: url,
        coverAlt: {
          ar: prev.coverAlt.ar || image.alt.ar || image.name,
          en: prev.coverAlt.en || image.alt.en || image.name,
        },
      })),
    );

  const onBack = () => {
    if (JSON.stringify(form) !== initial.current && !window.confirm(c.leaveConfirm)) return;
    onCancel();
  };

  return (
    <form dir="rtl" lang="ar" onSubmit={onSubmit} className="space-y-5 text-right">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-[12px] font-medium text-navy transition-colors hover:border-gold"
        >
          <ArrowRight size={14} />
          {c.back}
        </button>
        <h1 className="mt-4 font-display text-2xl font-semibold text-navy sm:text-3xl">{isNew ? c.newTitle : c.editTitle}</h1>
        <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{c.lead}</p>
      </div>

      <Card title={c.basics} hint={c.basicsHint}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={c.titleAr}>
            <input dir="rtl" className={fieldCls} placeholder={c.titleArPh} value={form.titleI18n.ar} onChange={(e) => setLocalized("titleI18n", "ar", e.target.value)} />
          </Field>
          <Field label={c.titleEn}>
            <input dir="ltr" className={fieldCls} placeholder={c.titleEnPh} value={form.titleI18n.en} onChange={(e) => setLocalized("titleI18n", "en", e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label={c.slug} hint={c.slugHint}>
              <input dir="ltr" className={fieldCls} placeholder="yacht-marina-guide" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
          </div>
          <Field label={c.excerptAr}>
            <textarea dir="rtl" rows={3} className={fieldCls} placeholder={c.excerptArPh} value={form.excerptI18n.ar} onChange={(e) => setLocalized("excerptI18n", "ar", e.target.value)} />
          </Field>
          <Field label={c.excerptEn}>
            <textarea dir="ltr" rows={3} className={fieldCls} placeholder={c.excerptEnPh} value={form.excerptI18n.en} onChange={(e) => setLocalized("excerptI18n", "en", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={c.content} hint={c.contentHint}>
        <AdminHtmlEditor
          value={form.contentHtml.ar}
          onChange={(html) => setLocalized("contentHtml", "ar", html)}
          contentLang="ar"
          uploadImage={uploadImage}
          openGallery={openGallery}
        />
      </Card>

      <Card
        title={c.english}
        hint={c.englishHint}
        action={
          !form.contentHtml.en.trim() && form.contentHtml.ar.trim() ? (
            <button type="button" onClick={() => setLocalized("contentHtml", "en", form.contentHtml.ar)} className="text-[12px] font-medium text-gold-ink underline">
              {c.copyFromAr}
            </button>
          ) : null
        }
      >
        <p className="mb-3 text-[13px] font-semibold text-navy">{c.contentEn}</p>
        <AdminHtmlEditor
          value={form.contentHtml.en}
          onChange={(html) => setLocalized("contentHtml", "en", html)}
          contentLang="en"
          uploadImage={uploadImage}
          openGallery={openGallery}
        />
      </Card>

      <Card title={c.publish} hint={c.publishHint}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={c.category}>
            <select
              className={fieldCls}
              value={categoryIndex >= 0 ? String(categoryIndex) : "custom"}
              onChange={(e) => {
                const i = Number(e.target.value);
                if (Number.isNaN(i)) return;
                set("categoryI18n", { ar: categoriesAr[i] ?? "", en: categoriesEn[i] ?? "" });
              }}
            >
              {categoryIndex < 0 ? <option value="custom">{form.categoryI18n.ar || form.categoryI18n.en || "—"}</option> : null}
              {categoriesAr.map((name, i) => (
                <option key={name} value={String(i)}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={c.status}>
            <select className={fieldCls} value={form.published ? "published" : "draft"} onChange={(e) => set("published", e.target.value === "published")}>
              <option value="draft">{c.draft}</option>
              <option value="published">{c.published}</option>
            </select>
          </Field>
          <Field label={c.authorAr}>
            <input dir="rtl" className={fieldCls} placeholder={c.authorPh} value={form.authorI18n.ar} onChange={(e) => setLocalized("authorI18n", "ar", e.target.value)} />
          </Field>
          <Field label={c.authorEn}>
            <input dir="ltr" className={fieldCls} placeholder={c.authorPh} value={form.authorI18n.en} onChange={(e) => setLocalized("authorI18n", "en", e.target.value)} />
          </Field>
          <Field label={c.tagsAr}>
            <input dir="rtl" className={fieldCls} placeholder={c.tagsArPh} value={tagsToString(form.tags.ar)} onChange={(e) => set("tags", { ...form.tags, ar: parseTags(e.target.value) })} />
          </Field>
          <Field label={c.tagsEn}>
            <input dir="ltr" className={fieldCls} placeholder={c.tagsEnPh} value={tagsToString(form.tags.en)} onChange={(e) => set("tags", { ...form.tags, en: parseTags(e.target.value) })} />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-[13px] text-navy md:col-span-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
            {c.featured}
          </label>
        </div>
      </Card>

      <Card title={c.cover} hint={c.coverHint}>
        <div className="grid gap-4 md:grid-cols-2">
          <CoverSlot
            label={c.coverAr}
            url={form.coverUrl}
            alt={form.coverAlt.ar}
            onUrl={(url) => set("coverUrl", url)}
            uploadImage={uploadImage}
            onGallery={() => pickCover("coverUrl")}
          />
          <CoverSlot
            label={c.coverEn}
            hint={c.coverEnHint}
            url={form.coverUrlEn}
            alt={form.coverAlt.en}
            onUrl={(url) => set("coverUrlEn", url)}
            uploadImage={uploadImage}
            onGallery={() => pickCover("coverUrlEn")}
          />
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{c.coverTypes}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label={c.coverAltAr}>
            <input dir="rtl" className={fieldCls} placeholder={c.coverAltArPh} value={form.coverAlt.ar} onChange={(e) => setLocalized("coverAlt", "ar", e.target.value)} />
          </Field>
          <Field label={c.coverAltEn}>
            <input dir="ltr" className={fieldCls} placeholder={c.coverAltEnPh} value={form.coverAlt.en} onChange={(e) => setLocalized("coverAlt", "en", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={c.seo} hint={c.seoHint}>
        <div className="grid gap-4">
          <Field label="Meta Title" hint={<MetaCounter value={form.metaTitleI18n.ar} fallbackEmpty={c.metaTitleEmpty} min={SEO_LIMITS.titleMin} max={SEO_LIMITS.titleMax} />}>
            <input dir="rtl" className={fieldCls} placeholder={c.metaTitlePh} value={form.metaTitleI18n.ar} onChange={(e) => setLocalized("metaTitleI18n", "ar", e.target.value)} />
          </Field>
          <Field label="Meta Description" hint={<MetaCounter value={form.metaDescriptionI18n.ar} fallbackEmpty={c.metaDescEmpty} min={SEO_LIMITS.descMin} max={SEO_LIMITS.descMax} />}>
            <textarea dir="rtl" rows={3} className={fieldCls} placeholder={c.metaDescPh} value={form.metaDescriptionI18n.ar} onChange={(e) => setLocalized("metaDescriptionI18n", "ar", e.target.value)} />
          </Field>
          <p className="mt-2 border-t border-border pt-4 text-[13px] font-semibold text-navy">{c.seoEnglish}</p>
          <Field label="Meta Title (English)" hint={<MetaCounter value={form.metaTitleI18n.en} fallbackEmpty={c.metaTitleEmpty} min={SEO_LIMITS.titleMin} max={SEO_LIMITS.titleMax} />}>
            <input dir="ltr" className={fieldCls} placeholder={c.metaTitleEnPh} value={form.metaTitleI18n.en} onChange={(e) => setLocalized("metaTitleI18n", "en", e.target.value)} />
          </Field>
          <Field label="Meta Description (English)" hint={<MetaCounter value={form.metaDescriptionI18n.en} fallbackEmpty={c.metaDescEmpty} min={SEO_LIMITS.descMin} max={SEO_LIMITS.descMax} />}>
            <textarea dir="ltr" rows={3} className={fieldCls} placeholder={c.metaDescEnPh} value={form.metaDescriptionI18n.en} onChange={(e) => setLocalized("metaDescriptionI18n", "en", e.target.value)} />
          </Field>
        </div>

        <details className="group mt-5 rounded-xl border border-border bg-surface-2/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-navy">
            {c.advanced}
            <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border p-4">
            <AdminPostSeo form={form} setForm={setForm} fieldCls={fieldCls} labels={seoLabels} bilingual hideMeta />
          </div>
        </details>
      </Card>

      <div className="sticky bottom-3 z-30 rounded-2xl border border-border bg-background/95 shadow-[0_10px_30px_-12px_rgba(15,40,70,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <p className="text-[12px] text-muted-foreground">{message || c.saveNote}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onBack} className="rounded-full px-4 py-2 text-[13px] text-muted-foreground hover:text-navy">
              {c.back}
            </button>
            <button type="submit" disabled={busy} className={`${ADMIN_BTN_PRIMARY} inline-flex items-center gap-1.5`}>
              <Save size={15} />
              {busy ? c.saving : c.save}
            </button>
          </div>
        </div>
      </div>

      <GalleryPicker
        open={galleryOpen}
        images={galleryImages}
        loading={galleryLoading}
        title={c.galleryTitle}
        empty={c.galleryEmpty}
        onClose={() => {
          galleryCallback.current = null;
          setGalleryOpen(false);
        }}
        onSelect={(url, image) => {
          galleryCallback.current?.(url, image);
          galleryCallback.current = null;
        }}
      />
    </form>
  );
}
