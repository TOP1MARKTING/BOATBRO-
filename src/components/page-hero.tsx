import type { ReactNode } from "react";
import { SHELL } from "./brand";
import { Photo, type PhotoName } from "./photo";

export function PageHero({
  dir,
  image,
  imageAlt = "",
  chip,
  title,
  lead,
  children,
}: {
  dir: "rtl" | "ltr";
  image: PhotoName;
  imageAlt?: string;
  chip: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  const rtl = dir === "rtl";
  const imageFlip = rtl ? "" : "scale-x-[-1]";

  return (
    <section className="relative isolate overflow-hidden bg-navy-deep pt-14 sm:pt-16 lg:pt-[72px]">
      <Photo
        name={image}
        alt={imageAlt}
        className={`absolute inset-0 h-full w-full object-cover object-center ${imageFlip}`}
        sizes="100vw"
        eager
        bright
        width={1440}
        height={810}
      />
      <div className="absolute inset-0 bg-navy-deep/35 dark:bg-navy-deep/15" />
      <div
        className={
          rtl
            ? "absolute inset-0 bg-gradient-to-l from-navy-deep/92 via-navy-deep/62 to-navy-deep/18 dark:from-navy-deep/70 dark:via-navy-deep/40 dark:to-navy-deep/10"
            : "absolute inset-0 bg-gradient-to-r from-navy-deep/92 via-navy-deep/62 to-navy-deep/18 dark:from-navy-deep/70 dark:via-navy-deep/40 dark:to-navy-deep/10"
        }
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-deep/85 to-transparent dark:from-navy-deep/55" />

      <div className={`${SHELL} relative grid min-h-[min(72svh,640px)] items-center py-12 sm:py-14 lg:grid-cols-2 lg:py-16`}>
        <div className="flex flex-col justify-center lg:col-start-1">
          <p className="inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm">
            {chip}
          </p>
          <h1 className="mt-5 max-w-xl font-display text-[clamp(1.85rem,4vw,3.15rem)] font-semibold leading-[1.28] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)]">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-white/88 drop-shadow-[0_1px_10px_rgba(0,0,0,0.3)] sm:text-[17px] sm:leading-9">
            {lead}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
