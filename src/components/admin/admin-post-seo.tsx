import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import type { PostInput } from "../../lib/db";
import { pickLocalized } from "../../lib/post-content";
import {
  SEO_LIMITS,
  analyzePostSeo,
  charCountTone,
  postPublicUrl,
  postReadingStats,
  resolveMetaDescription,
  resolveMetaTitle,
  resolveOgImage,
  type SeoCheckStatus,
} from "../../lib/post-seo";
import { PRODUCTION_ORIGIN } from "../../lib/site";

const statusIcon = {
  pass: CheckCircle2,
  warn: AlertCircle,
  fail: XCircle,
} satisfies Record<SeoCheckStatus, typeof CheckCircle2>;

const statusCls: Record<SeoCheckStatus, string> = {
  pass: "text-emerald-600",
  warn: "text-amber-600",
  fail: "text-destructive",
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-2/60 p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
        {hint ? <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Counter({ len, min, max }: { len: number; min: number; max: number }) {
  return (
    <span className={`text-[11px] font-medium ${charCountTone(len, min, max)}`}>
      {len}/{max}
    </span>
  );
}

function BilingualSeoFields({
  form,
  setForm,
  fieldCls,
  labels,
}: {
  form: PostInput;
  setForm: (next: PostInput | ((prev: PostInput) => PostInput)) => void;
  fieldCls: string;
  labels: {
    metaTitle: string;
    metaTitleHint: string;
    metaDescription: string;
    metaDescriptionHint: string;
    focusKeyword: string;
    focusKeywordHint: string;
  };
}) {
  return (
    <div className="grid gap-4">
      {(["en", "ar"] as const).map((lang) => (
        <div key={lang} className="grid gap-4 rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{lang}</p>
          <label>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-navy">{labels.metaTitle}</span>
              <Counter
                len={(form.metaTitleI18n[lang] || pickLocalized(form.titleI18n, lang)).length}
                min={SEO_LIMITS.titleMin}
                max={SEO_LIMITS.titleMax}
              />
            </div>
            <input
              className={fieldCls}
              value={form.metaTitleI18n[lang]}
              placeholder={pickLocalized(form.titleI18n, lang)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  metaTitleI18n: { ...prev.metaTitleI18n, [lang]: e.target.value },
                }))
              }
            />
          </label>
          <label>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-navy">{labels.metaDescription}</span>
              <Counter
                len={(form.metaDescriptionI18n[lang] || pickLocalized(form.excerptI18n, lang)).length}
                min={SEO_LIMITS.descMin}
                max={SEO_LIMITS.descMax}
              />
            </div>
            <textarea
              rows={3}
              className={fieldCls}
              value={form.metaDescriptionI18n[lang]}
              placeholder={pickLocalized(form.excerptI18n, lang)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  metaDescriptionI18n: { ...prev.metaDescriptionI18n, [lang]: e.target.value },
                }))
              }
            />
          </label>
          <label>
            <span className="mb-2 block text-[12px] font-medium text-navy">{labels.focusKeyword}</span>
            <input
              className={fieldCls}
              value={form.focusKeywordI18n[lang]}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  focusKeywordI18n: { ...prev.focusKeywordI18n, [lang]: e.target.value },
                }))
              }
            />
          </label>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">{labels.metaTitleHint}</p>
      <p className="text-[11px] text-muted-foreground">{labels.metaDescriptionHint}</p>
      <p className="text-[11px] text-muted-foreground">{labels.focusKeywordHint}</p>
    </div>
  );
}

export function AdminPostSeo({
  form,
  setForm,
  labels,
  fieldCls,
  bilingual = false,
}: {
  form: PostInput;
  setForm: (next: PostInput | ((prev: PostInput) => PostInput)) => void;
  fieldCls: string;
  bilingual?: boolean;
  labels: {
    googlePreview: string;
    googlePreviewHint: string;
    seoSection: string;
    seoSectionHint: string;
    metaTitle: string;
    metaTitleHint: string;
    metaDescription: string;
    metaDescriptionHint: string;
    focusKeyword: string;
    focusKeywordHint: string;
    ogImage: string;
    ogImageHint: string;
    noindex: string;
    noindexHint: string;
    checklist: string;
    checklistHint: string;
    score: string;
    faqSection: string;
    faqSectionHint: string;
    faqQuestion: string;
    faqAnswer: string;
    faqAdd: string;
    faqRemove: string;
    statsWords: string;
    statsMinutes: string;
    openGraph: string;
    openGraphHint: string;
    checks: {
      checkTitle: string;
      checkTitleHint: string;
      checkDesc: string;
      checkDescHint: string;
      checkSlug: string;
      checkSlugHint: string;
      checkKeyword: string;
      checkKeywordHint: string;
      checkKeywordBody: string;
      checkKeywordBodyHint: string;
      checkCover: string;
      checkCoverHint: string;
      checkExcerpt: string;
      checkExcerptHint: string;
      checkBody: string;
      checkBodyHint: string;
      checkPublished: string;
      checkPublishedHint: string;
    };
  };
}) {
  const metaTitleAr = resolveMetaTitle(form, "ar");
  const metaDescAr = resolveMetaDescription(form, "ar");
  const metaTitleEn = resolveMetaTitle(form, "en");
  const metaDescEn = resolveMetaDescription(form, "en");
  const ogImage = resolveOgImage(form);
  const url = postPublicUrl(form.slug || "post-slug");
  const domain = PRODUCTION_ORIGIN.replace(/^https?:\/\//, "");
  const stats = postReadingStats(form);
  const analysis = useMemo(() => analyzePostSeo(form, labels.checks, "ar"), [form, labels.checks]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Section title={labels.googlePreview} hint={labels.googlePreviewHint}>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <p className="truncate text-[12px] text-[#202124]">{domain} › blog › {form.slug || "…"}</p>
              <p className="mt-1 line-clamp-2 text-[18px] leading-snug text-[#1a0dab]">{metaTitleAr || "…"}</p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-[#4d5156]">{metaDescAr || "…"}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <p className="truncate text-[12px] text-[#202124]">{domain} › blog › {form.slug || "…"}</p>
              <p className="mt-1 line-clamp-2 text-[18px] leading-snug text-[#1a0dab]">{metaTitleEn || "…"}</p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-[#4d5156]">{metaDescEn || "…"}</p>
            </div>
          </div>
          <p className="mt-3 truncate text-[11px] text-muted-foreground">{url}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-muted-foreground">
            <span>{labels.statsWords}: <strong className="text-navy">{stats.words}</strong></span>
            <span>{labels.statsMinutes}: <strong className="text-navy">{stats.minutes}</strong></span>
          </div>
        </Section>

        <Section title={labels.seoSection} hint={labels.seoSectionHint}>
          {bilingual ? (
            <BilingualSeoFields form={form} setForm={setForm} fieldCls={fieldCls} labels={labels} />
          ) : (
            <div className="grid gap-4">
              <label>
                <span className="mb-2 block text-[12px] font-medium text-navy">{labels.metaTitle}</span>
                <input className={fieldCls} value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
              </label>
              <label>
                <span className="mb-2 block text-[12px] font-medium text-navy">{labels.metaDescription}</span>
                <textarea rows={3} className={fieldCls} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
              </label>
            </div>
          )}
          <label className="mt-4 block">
            <span className="mb-2 block text-[12px] font-medium text-navy">{labels.ogImage}</span>
            <input className={fieldCls} value={form.ogImage} placeholder={form.coverUrl} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} />
            <p className="mt-1 text-[11px] text-muted-foreground">{labels.ogImageHint}</p>
          </label>
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy">
            <input type="checkbox" className="mt-1" checked={form.noindex} onChange={(e) => setForm({ ...form, noindex: e.target.checked })} />
            <span>
              <span className="font-medium">{labels.noindex}</span>
              <span className="mt-1 block text-[12px] text-muted-foreground">{labels.noindexHint}</span>
            </span>
          </label>
        </Section>
      </div>

      <div className="space-y-5">
        <Section title={labels.openGraph} hint={labels.openGraphHint}>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {ogImage ? <img src={ogImage} alt="" className="aspect-[1.91/1] w-full object-cover" /> : <div className="flex aspect-[1.91/1] items-center justify-center bg-muted text-[12px] text-muted-foreground">1200×630</div>}
            <div className="border-t border-border p-3">
              <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{domain}</p>
              <p className="mt-1 line-clamp-2 text-[14px] font-semibold text-navy">{metaTitleAr || pickLocalized(form.titleI18n, "ar")}</p>
              <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{metaDescAr || pickLocalized(form.excerptI18n, "ar")}</p>
            </div>
          </div>
        </Section>

        <Section title={labels.checklist} hint={labels.checklistHint}>
          <div className="mb-4 flex items-center justify-between rounded-xl bg-navy-deep px-4 py-3 text-white">
            <span className="text-sm">{labels.score}</span>
            <span className="font-display text-2xl font-semibold">{analysis.score}%</span>
          </div>
          <ul className="space-y-2.5">
            {analysis.checks.map((check) => {
              const Icon = statusIcon[check.status];
              return (
                <li key={check.id} className="flex items-start gap-2.5 text-[13px]">
                  <Icon size={16} className={`mt-0.5 shrink-0 ${statusCls[check.status]}`} />
                  <div>
                    <p className="text-navy">{check.label}</p>
                    {check.hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{check.hint}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title={labels.faqSection} hint={labels.faqSectionHint}>
          <div className="space-y-4">
            {form.faq.map((item, index) => (
              <div key={index} className="rounded-xl border border-border bg-card p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-[12px] font-medium text-navy">{labels.faqQuestion} · EN</span>
                    <input className={fieldCls} value={item.question.en} onChange={(e) => setForm((prev) => ({ ...prev, faq: prev.faq.map((row, i) => i === index ? { ...row, question: { ...row.question, en: e.target.value } } : row) }))} />
                  </label>
                  <label>
                    <span className="mb-2 block text-[12px] font-medium text-navy">{labels.faqQuestion} · AR</span>
                    <input className={fieldCls} value={item.question.ar} onChange={(e) => setForm((prev) => ({ ...prev, faq: prev.faq.map((row, i) => i === index ? { ...row, question: { ...row.question, ar: e.target.value } } : row) }))} />
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-2 block text-[12px] font-medium text-navy">{labels.faqAnswer} · EN</span>
                    <textarea rows={2} className={fieldCls} value={item.answer.en} onChange={(e) => setForm((prev) => ({ ...prev, faq: prev.faq.map((row, i) => i === index ? { ...row, answer: { ...row.answer, en: e.target.value } } : row) }))} />
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-2 block text-[12px] font-medium text-navy">{labels.faqAnswer} · AR</span>
                    <textarea rows={2} className={fieldCls} value={item.answer.ar} onChange={(e) => setForm((prev) => ({ ...prev, faq: prev.faq.map((row, i) => i === index ? { ...row, answer: { ...row.answer, ar: e.target.value } } : row) }))} />
                  </label>
                </div>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, faq: prev.faq.filter((_, i) => i !== index) }))} className="mt-3 text-[12px] text-destructive hover:underline">{labels.faqRemove}</button>
              </div>
            ))}
            {form.faq.length < 8 ? (
              <button type="button" onClick={() => setForm((prev) => ({ ...prev, faq: [...prev.faq, { question: { ar: "", en: "" }, answer: { ar: "", en: "" } }] }))} className="rounded-full border border-gold/45 px-4 py-2 text-[12px] font-medium text-gold-ink hover:bg-gold hover:text-white">{labels.faqAdd}</button>
            ) : null}
          </div>
        </Section>
      </div>
    </div>
  );
}
