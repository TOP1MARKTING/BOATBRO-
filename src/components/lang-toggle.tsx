import { useLang } from "../lib/i18n";

export function LangToggle({ onDark = false }: { onDark?: boolean }) {
  const { lang, setLang } = useLang();
  const isEn = lang === "en";

  return (
    <div dir="ltr">
      <button
        type="button"
        onClick={() => setLang(isEn ? "ar" : "en")}
        aria-label={isEn ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
        className={`relative h-9 w-[4.35rem] shrink-0 rounded-full border transition-colors ${
          onDark
            ? "border-white/70 bg-white/90"
            : "border-border/80 bg-card"
        }`}
      >
        <span
          className={`absolute top-1/2 size-7 -translate-y-1/2 rounded-full bg-navy-deep shadow-sm transition-all duration-300 ease-out ${
            isEn ? "left-[3px]" : "left-[calc(100%-1.85rem)]"
          }`}
        />
        <span className="relative z-10 grid h-full grid-cols-2 items-center text-[11px] font-bold">
          <span className={`text-center transition-colors ${isEn ? "text-white" : "text-navy/40"}`}>
            EN
          </span>
          <span className={`text-center font-display text-[13px] transition-colors ${isEn ? "text-navy/40" : "text-white"}`}>
            ع
          </span>
        </span>
      </button>
    </div>
  );
}
