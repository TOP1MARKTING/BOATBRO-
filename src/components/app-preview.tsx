import type { Lang } from "../lib/i18n";

type ScreenId = "home" | "search" | "details" | "book" | "owner";

const copy = {
  ar: {
    search: "ابحث عن تجربة بحرية",
    chips: ["نزهة", "صيد", "غوص"],
    featured: "رحلة نهارية",
    featuredMeta: "يخت · نصف يوم",
    results: [
      ["يخت خاص", "نزهة هادئة"],
      ["قارب نزهة", "عائلة وأصدقاء"],
      ["جت سكي", "رياضة مائية"],
    ],
    detailsTitle: "يخت خاص",
    specs: ["نصف يوم", "مرسى", "ضيافة"],
    bookCta: "تأكيد الموعد",
    days: ["اليوم", "غدًا", "بعد غد"],
    ownerTitle: "وسيلتك",
    ownerRows: ["الحجوزات", "الخدمات"],
  },
  en: {
    search: "Search a sea experience",
    chips: ["Cruise", "Fishing", "Dive"],
    featured: "A day on the water",
    featuredMeta: "Yacht · half day",
    results: [
      ["Private yacht", "A quiet day"],
      ["Day boat", "Family and friends"],
      ["Jet ski", "Water sport"],
    ],
    detailsTitle: "Private yacht",
    specs: ["Half day", "Marina", "Hospitality"],
    bookCta: "Confirm time",
    days: ["Today", "Tomorrow", "Next day"],
    ownerTitle: "Your vessel",
    ownerRows: ["Bookings", "Services"],
  },
} as const;

export function PhoneFrame({
  screen,
  lang,
  photo,
  label,
}: {
  screen: ScreenId;
  lang: Lang;
  photo: string;
  label: string;
}) {
  const c = copy[lang];

  return (
    <figure className="w-[196px] shrink-0 sm:w-[210px]">
      <div className="overflow-hidden rounded-[1.7rem] border border-navy/10 bg-navy-deep shadow-[0_18px_40px_-20px_rgba(15,40,70,0.45)]">
        <div className="bg-navy-deep px-4 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />
          <p className="text-center text-[11px] font-medium text-white/80">{label}</p>
        </div>
        <div className="h-[340px] bg-[#f4f8fb] p-3 text-navy">
          {screen === "home" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white px-3 py-2 text-[11px] text-navy/45">{c.search}</div>
              <div className="flex flex-wrap gap-1.5">
                {c.chips.map((chip) => (
                  <span key={chip} className="rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-medium text-gold">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl bg-white">
                <img src={photo} alt="" className="h-28 w-full object-cover" />
                <div className="p-3">
                  <p className="font-display text-sm">{c.featured}</p>
                  <p className="mt-1 text-[11px] text-navy/50">{c.featuredMeta}</p>
                </div>
              </div>
            </div>
          )}

          {screen === "search" && (
            <div className="space-y-2">
              <div className="rounded-xl bg-white px-3 py-2 text-[11px] text-navy/45">{c.search}</div>
              {c.results.map(([title, meta]) => (
                <div key={title} className="flex items-center gap-3 rounded-xl bg-white p-2.5">
                  <img src={photo} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  <div>
                    <p className="text-[13px] font-medium">{title}</p>
                    <p className="text-[11px] text-navy/50">{meta}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {screen === "details" && (
            <div className="overflow-hidden rounded-2xl bg-white">
              <img src={photo} alt="" className="h-36 w-full object-cover" />
              <div className="space-y-3 p-3">
                <p className="font-display text-base">{c.detailsTitle}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.specs.map((spec) => (
                    <span key={spec} className="rounded-full bg-[#eef4f8] px-2.5 py-1 text-[10px]">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {screen === "book" && (
            <div className="space-y-3">
              <p className="font-display text-sm">{c.detailsTitle}</p>
              <div className="grid grid-cols-3 gap-2">
                {c.days.map((day, i) => (
                  <div
                    key={day}
                    className={`rounded-xl px-2 py-3 text-center text-[11px] ${
                      i === 1 ? "bg-gold text-white" : "bg-white text-navy/70"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-gold py-2.5 text-center text-[12px] font-medium text-white">
                {c.bookCta}
              </div>
            </div>
          )}

          {screen === "owner" && (
            <div className="space-y-3">
              <p className="font-display text-sm">{c.ownerTitle}</p>
              <img src={photo} alt="" className="h-28 w-full rounded-2xl object-cover" />
              {c.ownerRows.map((row) => (
                <div key={row} className="rounded-xl bg-white px-3 py-3 text-[13px] font-medium">
                  {row}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}
