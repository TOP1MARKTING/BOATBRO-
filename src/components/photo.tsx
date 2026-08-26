const WIDTHS = [480, 960, 1440] as const;

export type PhotoName =
  | "luxury-water"
  | "luxury-marina"
  | "luxury-dive"
  | "luxury-family"
  | "luxury-club"
  | "luxury-night"
  | "luxury-sailing"
  | "night-yacht"
  | "audience-guests"
  | "audience-owners"
  | "audience-marinas"
  | "service-guest-charter"
  | "service-guest-booking"
  | "service-guest-options"
  | "service-owner-marketing"
  | "service-owner-payments"
  | "service-owner-logistics"
  | "service-owner-growth"
  | "service-marina-owners"
  | "service-marina-occupancy"
  | "service-marina-booking"
  | "service-marina-reach"
  | "hero-about"
  | "hero-contact"
  | "hero-blog"
  | "hero-features";

export function photoSrc(name: PhotoName, width: (typeof WIDTHS)[number] = 960) {
  return `/media/${name}-${width}.webp`;
}

export function Photo({
  name,
  alt,
  className,
  sizes,
  eager = false,
  bright = false,
  width,
  height,
}: {
  name: PhotoName;
  alt: string;
  className?: string;
  sizes: string;
  eager?: boolean;
  /** Extra lift for hero / header images in dark mode */
  bright?: boolean;
  width?: number;
  height?: number;
}) {
  const srcSet = WIDTHS.map((w) => `${photoSrc(name, w)} ${w}w`).join(", ");
  const darkLift = bright
    ? "dark:brightness-[1.28] dark:contrast-[1.05] dark:saturate-[1.08]"
    : "dark:brightness-[1.12] dark:contrast-[1.03] dark:saturate-[1.04]";
  return (
    <img
      src={photoSrc(name, eager ? 1440 : 960)}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={`${darkLift} ${className}`}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
    />
  );
}
