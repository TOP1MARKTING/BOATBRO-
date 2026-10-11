import { Check, Image as ImageIcon, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { photoSrc, type PhotoName } from "../photo";
import { PHOTO_NAME_OPTIONS } from "../../lib/page-content";
import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY, ADMIN_CARD_CLS } from "./shared";

export type PhotoCategory = "all" | "yachts" | "audiences" | "heroes" | "services";

export type PhotoItemMeta = {
  id: PhotoName;
  titleAr: string;
  titleEn: string;
  category: "yachts" | "audiences" | "heroes" | "services";
};

export const CMS_PHOTOS_METADATA: Record<PhotoName, PhotoItemMeta> = {
  "night-yacht": {
    id: "night-yacht",
    titleAr: "يخت فاخر بإضاءة ليلية في البحر",
    titleEn: "Night Yacht Cruise",
    category: "yachts",
  },
  "luxury-sailing": {
    id: "luxury-sailing",
    titleAr: "إبحار شراعي فاخر في مياه مفتوحة",
    titleEn: "Luxury Sailing & Waves",
    category: "yachts",
  },
  "luxury-night": {
    id: "luxury-night",
    titleAr: "أجواء بحرية ليلية فاخرة",
    titleEn: "Luxury Night Ocean",
    category: "yachts",
  },
  "luxury-marina": {
    id: "luxury-marina",
    titleAr: "مرسى يخوت فاخر وأرصفة بحرية",
    titleEn: "Luxury Marina Dock",
    category: "yachts",
  },
  "luxury-dive": {
    id: "luxury-dive",
    titleAr: "غوص وتجارب وأنشطة مائية",
    titleEn: "Luxury Diving & Watersports",
    category: "yachts",
  },
  "audience-guests": {
    id: "audience-guests",
    titleAr: "ضيوف البحر والرحلات والتجارب",
    titleEn: "Guests & Charter Travelers",
    category: "audiences",
  },
  "audience-owners": {
    id: "audience-owners",
    titleAr: "ملاك القوارب واليخوت الخاصة",
    titleEn: "Boat & Yacht Owners",
    category: "audiences",
  },
  "audience-marinas": {
    id: "audience-marinas",
    titleAr: "المراسي البحرية ومقدمو الخدمات",
    titleEn: "Marinas & Service Operators",
    category: "audiences",
  },
  "hero-about": {
    id: "hero-about",
    titleAr: "غلاف صفحة (عن بوت برو)",
    titleEn: "About Page Hero",
    category: "heroes",
  },
  "hero-contact": {
    id: "hero-contact",
    titleAr: "غلاف صفحة (تواصل معنا)",
    titleEn: "Contact Page Hero",
    category: "heroes",
  },
  "hero-blog": {
    id: "hero-blog",
    titleAr: "غلاف صفحة (المدونة البحرية)",
    titleEn: "Blog Page Hero",
    category: "heroes",
  },
  "hero-features": {
    id: "hero-features",
    titleAr: "غلاف صفحة (الخدمات والمزايا)",
    titleEn: "Features Page Hero",
    category: "heroes",
  },
  "service-guest-charter": {
    id: "service-guest-charter",
    titleAr: "استئجار وتأجير اليخوت الفاخرة",
    titleEn: "Yacht Chartering Service",
    category: "services",
  },
  "service-guest-booking": {
    id: "service-guest-booking",
    titleAr: "حجز الرحلات والتجارب الفورية",
    titleEn: "Instant Trip Booking",
    category: "services",
  },
  "service-guest-options": {
    id: "service-guest-options",
    titleAr: "خيارات الضيافة والتجارب المخصصة",
    titleEn: "Custom Experiences & Options",
    category: "services",
  },
  "service-owner-marketing": {
    id: "service-owner-marketing",
    titleAr: "تسويق وعرض أسطول اليخوت",
    titleEn: "Fleet & Vessel Marketing",
    category: "services",
  },
  "service-owner-payments": {
    id: "service-owner-payments",
    titleAr: "المدفوعات الآمنة والتحصيل المالي",
    titleEn: "Secure Payouts & Finance",
    category: "services",
  },
  "service-owner-logistics": {
    id: "service-owner-logistics",
    titleAr: "التشغيل والخدمات اللوجستية",
    titleEn: "Operations & Logistics Support",
    category: "services",
  },
  "service-owner-growth": {
    id: "service-owner-growth",
    titleAr: "تنمية وتوسيع عوائد الملاك",
    titleEn: "Owner Fleet Revenue Growth",
    category: "services",
  },
  "service-marina-owners": {
    id: "service-marina-owners",
    titleAr: "ربط المراسي بملاك القوارب",
    titleEn: "Marina & Owner Connect",
    category: "services",
  },
  "service-marina-occupancy": {
    id: "service-marina-occupancy",
    titleAr: "إدارة ورفع إشغال الأرصفة",
    titleEn: "Berth Occupancy Management",
    category: "services",
  },
  "service-marina-booking": {
    id: "service-marina-booking",
    titleAr: "حجز المرافق والخدمات للمراسي",
    titleEn: "Online Marina Facility Booking",
    category: "services",
  },
  "service-marina-reach": {
    id: "service-marina-reach",
    titleAr: "زيادة شهرة وانتشار المرسى",
    titleEn: "Marina Network & Reach",
    category: "services",
  },
};

const CATEGORIES: { id: PhotoCategory; labelAr: string; labelEn: string }[] = [
  { id: "all", labelAr: "جميع الصور", labelEn: "All" },
  { id: "yachts", labelAr: "يخوت وبحر", labelEn: "Yachts & Sea" },
  { id: "audiences", labelAr: "أطراف وجمهور", labelEn: "Audiences" },
  { id: "heroes", labelAr: "أغلفة الصفحات", labelEn: "Page Heroes" },
  { id: "services", labelAr: "خدمات المنظومة", labelEn: "Services" },
];

export function CmsPhotoPickerModal({
  open,
  onClose,
  onSelect,
  currentValue,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (photo: PhotoName) => void;
  currentValue?: PhotoName;
  title?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>("all");
  const [search, setSearch] = useState("");

  const filteredPhotos = useMemo(() => {
    return PHOTO_NAME_OPTIONS.map((name) => CMS_PHOTOS_METADATA[name]).filter((item) => {
      if (!item) return false;
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        item.id.toLowerCase().includes(q) ||
        item.titleAr.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        aria-label="Close"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden ${ADMIN_CARD_CLS} shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/20 bg-card/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold-ink">
                <ImageIcon size={16} strokeWidth={1.75} />
              </span>
              <h3 className="font-display text-lg font-semibold text-navy">
                اختيار صورة {title ? `· ${title}` : ""}
              </h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              اختر الصورة المناسبة بالمعاينة المباشرة — اضغط على أي صورة لتحديدها فوراً.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/80 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="border-b border-border/60 bg-muted/20 px-5 py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الوصف (مثال: ليل، شراع، ضيوف)..."
                className="w-full rounded-full border border-border bg-card py-2 pe-4 ps-9 text-xs text-navy outline-none placeholder:text-muted-foreground/60 focus:border-gold focus:ring-2 focus:ring-gold/15"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? "border border-gold/45 bg-gold/20 text-gold-ink shadow-sm"
                        : "border border-border/60 bg-card/60 text-muted-foreground hover:border-gold/30 hover:text-navy"
                    }`}
                  >
                    {cat.labelAr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredPhotos.length === 0 ? (
            <div className="py-14 text-center">
              <ImageIcon size={36} className="mx-auto text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">لا توجد صور مطابقة لبحثك</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="mt-3 text-xs text-gold-ink hover:underline"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
              {filteredPhotos.map((photo) => {
                const isSelected = currentValue === photo.id;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      onSelect(photo.id);
                      onClose();
                    }}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border text-start transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                      isSelected
                        ? "border-gold bg-gold/5 shadow-[0_0_20px_color-mix(in_oklab,var(--gold)_25%,transparent)] ring-2 ring-gold/30"
                        : "border-border/70 bg-card hover:border-gold/50"
                    }`}
                  >
                    {/* Image Preview */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                      <img
                        src={photoSrc(photo.id, 480)}
                        alt={photo.titleAr}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Selected Badge */}
                      {isSelected ? (
                        <div className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-navy-deep/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur">
                          <Check size={12} strokeWidth={2.5} className="text-gold" />
                          <span>محددة حالياً</span>
                        </div>
                      ) : null}

                      {/* Quick Hover Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-navy-deep/45 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-white shadow-md">
                          <Sparkles size={12} />
                          اختيار هذه الصورة
                        </span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-1 flex-col justify-between p-3.5">
                      <div>
                        <p className="text-[13px] font-semibold leading-snug text-navy">
                          {photo.titleAr}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {photo.titleEn}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
                        <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {photo.id}
                        </span>
                        {isSelected ? (
                          <span className="text-[11px] font-medium text-gold-ink">✓ نشطة</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground group-hover:text-navy">
                            اضغط للاختيار
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-card px-5 py-3 text-xs text-muted-foreground">
          <span>
            إجمالي الصور المتاحة: <strong>{PHOTO_NAME_OPTIONS.length} صورة</strong>
          </span>
          <button type="button" onClick={onClose} className={ADMIN_BTN_SECONDARY}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual Photo Field with an instant live image preview and 1-click modal picker.
 */
export function CmsPhotoCardField({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value?: PhotoName;
  defaultValue?: PhotoName;
  onChange: (photo: PhotoName) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const currentPhoto = value ?? defaultValue ?? "night-yacht";
  const meta = CMS_PHOTOS_METADATA[currentPhoto] ?? {
    id: currentPhoto,
    titleAr: currentPhoto,
    titleEn: currentPhoto,
    category: "yachts" as const,
  };

  return (
    <div className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-ink hover:underline"
        >
          <Sparkles size={11} />
          استعراض المعرض المرئي
        </button>
      </div>

      {/* Visual Preview Card */}
      <div className={`overflow-hidden ${ADMIN_CARD_CLS} transition-all hover:border-gold/40`}>
        <div className="grid gap-3 p-3.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
          {/* Thumbnail preview */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/80 bg-muted"
            title="اضغط لتغيير الصورة"
          >
            <img
              src={photoSrc(currentPhoto, 480)}
              alt={meta.titleAr}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-navy-deep/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-navy shadow">
                تغيير
              </span>
            </div>
          </button>

          {/* Details & Actions */}
          <div className="min-w-0 space-y-2">
            <div>
              <p className="font-display text-sm font-semibold text-navy leading-snug">
                {meta.titleAr}
              </p>
              <p className="text-[12px] text-muted-foreground">{meta.titleEn}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {currentPhoto}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={`${ADMIN_BTN_PRIMARY} !min-h-9 !px-4 !text-xs`}
              >
                <ImageIcon size={13} />
                تغيير الصورة بالمعاينة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Modal Picker */}
      <CmsPhotoPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={onChange}
        currentValue={currentPhoto}
        title={label}
      />
    </div>
  );
}
