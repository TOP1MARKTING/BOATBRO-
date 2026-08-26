import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  APP_SCREEN_IDS,
  APP_SCROLL_SECTION_OFFSETS,
  APP_SCROLL_SOURCE_HEIGHT,
  APP_SCROLL_SOURCE_WIDTH,
  appScrollSrc,
  appScrollSrcSet,
  type AppScreenshotId,
} from "../lib/app-screenshots";

const PHONE_WIDTH = 280;

/** Luxury marina-style smartphone mockup — scales for small screens. */
function PhoneBezel({
  children,
  size = "lg",
  className = "",
}: {
  children: ReactNode;
  size?: "lg" | "md";
  className?: string;
}) {
  const shell =
    size === "lg"
      ? "w-[min(100%,232px)] sm:w-[256px] md:w-[280px]"
      : "w-[min(100%,210px)] sm:w-[232px]";

  return (
    <div className={`relative mx-auto shrink-0 ${shell} ${className}`} dir="ltr">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.4rem] bg-[#C8A96A]/15 blur-[48px] sm:-inset-10 sm:blur-[72px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.85rem] ring-1 ring-white/25 sm:rounded-[2.4rem]"
        aria-hidden="true"
      />
      <div className="relative rounded-[1.85rem] border border-white/45 bg-[#0b1220] p-[7px] shadow-[0_28px_56px_-24px_rgba(0,0,0,0.7)] sm:rounded-[2.4rem] sm:p-[10px] sm:shadow-[0_52px_88px_-28px_rgba(0,0,0,0.72),0_28px_56px_-32px_rgba(0,0,0,0.48)]">
        <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[1.45rem] bg-[#07111d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:rounded-[1.9rem]">
          {children}
          <div
            className="pointer-events-none absolute left-1/2 top-2.5 z-30 h-[22px] w-[72px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:top-3 sm:h-[28px] sm:w-[96px]"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

export function AppScrollShowcase({
  dir,
  screens,
  scrollHint,
}: {
  dir: "rtl" | "ltr";
  screens: [string, string][];
  scrollHint: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<AppScreenshotId, HTMLButtonElement | null>>>({});
  const [active, setActive] = useState<AppScreenshotId>("app-home");
  const skipListScroll = useRef(false);

  const jumpTo = (id: AppScreenshotId) => {
    const el = scrollRef.current;
    if (!el) return;
    skipListScroll.current = true;
    const maxScroll = Math.max(el.scrollHeight - el.clientHeight, 1);
    const ratio = APP_SCROLL_SECTION_OFFSETS[id] / APP_SCROLL_SOURCE_HEIGHT;
    el.scrollTo({ top: ratio * maxScroll, behavior: "smooth" });
    setActive(id);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(el.scrollHeight - el.clientHeight, 1);
    const y = (el.scrollTop / maxScroll) * APP_SCROLL_SOURCE_HEIGHT;
    let current: AppScreenshotId = "app-home";
    for (let i = 0; i < APP_SCREEN_IDS.length; i++) {
      const id = APP_SCREEN_IDS[i]!;
      const start = APP_SCROLL_SECTION_OFFSETS[id];
      const prevStart = i === 0 ? 0 : APP_SCROLL_SECTION_OFFSETS[APP_SCREEN_IDS[i - 1]!];
      const activateAt = i === 0 ? 0 : start - Math.min(50, (start - prevStart) * 0.1);
      if (y >= activateAt) current = id;
    }
    setActive((prev) => (prev === current ? prev : current));
  };

  useEffect(() => {
    if (skipListScroll.current) {
      skipListScroll.current = false;
      return;
    }
    const btn = sectionRefs.current[active];
    const list = listRef.current;
    if (!btn || !list) return;

    // Only auto-scroll the side list on large screens (nested scroll).
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const listRect = list.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const delta = btnRect.top - listRect.top + list.scrollTop;
    const target = delta - Math.max(0, (list.clientHeight - btn.offsetHeight) / 2);
    list.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [active]);

  return (
    <div
      className={`mt-8 grid items-start gap-8 sm:mt-10 sm:gap-10 lg:mt-12 lg:gap-14 ${
        dir === "rtl" ? "lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]"
      }`}
    >
      <div
        className={`order-1 flex justify-center px-2 lg:sticky lg:top-24 ${
          dir === "rtl" ? "lg:order-1" : "lg:order-2"
        }`}
      >
        <PhoneBezel>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain scroll-smooth touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <img
              src={appScrollSrc(480)}
              srcSet={appScrollSrcSet()}
              sizes={`${PHONE_WIDTH}px`}
              alt="BoatPro app full scroll"
              className="block w-full max-w-full"
              width={APP_SCROLL_SOURCE_WIDTH}
              height={APP_SCROLL_SOURCE_HEIGHT}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </PhoneBezel>
      </div>

      <div className={`order-2 min-w-0 lg:sticky lg:top-24 ${dir === "rtl" ? "lg:order-2" : "lg:order-1"}`}>
        <p className="mb-3 text-sm text-muted-foreground sm:mb-4">{scrollHint}</p>
        <div
          ref={listRef}
          className="space-y-2.5 overflow-y-visible overscroll-contain scroll-smooth sm:space-y-3 lg:max-h-[min(620px,70vh)] lg:overflow-y-auto lg:pe-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {APP_SCREEN_IDS.map((id, i) => {
            const [title, body] = screens[i] ?? ["", ""];
            const isActive = active === id;
            return (
              <button
                key={id}
                ref={(node) => {
                  sectionRefs.current[id] = node;
                }}
                type="button"
                onClick={() => jumpTo(id)}
                className={`w-full rounded-[1.15rem] border p-3.5 text-start transition-all duration-200 sm:rounded-[1.25rem] sm:p-4 ${
                  isActive
                    ? "border-gold/50 bg-card shadow-md ring-1 ring-gold/20"
                    : "border-border bg-card/60 opacity-55 hover:border-gold/30 hover:bg-card hover:opacity-100"
                }`}
              >
                <span className="font-display text-sm text-gold-ink/80">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-1 font-display text-base font-semibold text-navy sm:text-lg">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">{body}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AppHeroPreview() {
  return (
    <div className="mx-auto w-full max-w-[280px] justify-self-center px-2 lg:max-w-none lg:justify-self-end lg:px-0">
      <PhoneBezel>
        <img
          src={appScrollSrc(720)}
          srcSet={appScrollSrcSet()}
          sizes={`${PHONE_WIDTH}px`}
          alt="BoatPro app"
          className="absolute inset-0 h-full w-full object-cover object-top"
          width={APP_SCROLL_SOURCE_WIDTH}
          height={APP_SCROLL_SOURCE_HEIGHT}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
        />
      </PhoneBezel>
    </div>
  );
}
