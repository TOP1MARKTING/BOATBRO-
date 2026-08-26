export const APP_SCREENSHOT_WIDTHS = [360, 480, 720] as const;

export type AppScreenshotId =
  | "app-home"
  | "app-featured"
  | "app-categories"
  | "app-vessels"
  | "app-explore";

export const APP_SCREEN_IDS: AppScreenshotId[] = [
  "app-home",
  "app-featured",
  "app-categories",
  "app-vessels",
  "app-explore",
];

export function appScreenshotSrc(id: AppScreenshotId, width: (typeof APP_SCREENSHOT_WIDTHS)[number] = 480) {
  return `/media/${id}-${width}.webp`;
}

export function appScreenshotSrcSet(id: AppScreenshotId) {
  return APP_SCREENSHOT_WIDTHS.map((w) => `${appScreenshotSrc(id, w)} ${w}w`).join(", ");
}

export function appScrollSrc(width: (typeof APP_SCREENSHOT_WIDTHS)[number] = 480) {
  return `/media/app-scroll-${width}.webp`;
}

export function appScrollSrcSet() {
  return APP_SCREENSHOT_WIDTHS.map((w) => `${appScrollSrc(w)} ${w}w`).join(", ");
}

/** Scroll offsets tuned to the long BoatPro screenshot (720×6228). */
export const APP_SCROLL_SECTION_OFFSETS: Record<AppScreenshotId, number> = {
  "app-home": 0,
  "app-featured": 820,
  "app-categories": 1580,
  "app-vessels": 2460,
  /** Starts at “Explore nearby” — not mid-agencies. */
  "app-explore": 2900,
};

export const APP_SCROLL_SOURCE_WIDTH = 720;
/** Ends after agencies; before “Recommended for you”. */
export const APP_SCROLL_SOURCE_HEIGHT = 3750;
