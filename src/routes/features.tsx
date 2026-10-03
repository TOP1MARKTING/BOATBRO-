import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { Compass, Ship, Waves } from "lucide-react";
import { useEffect, useState } from "react";
import { JsonLd } from "../components/json-ld";
import { MarketingShell } from "../components/marketing-shell";
import { PageMeta } from "../components/page-meta";
import { PageHero } from "../components/page-hero";
import { Photo, type PhotoName } from "../components/photo";
import { SHELL } from "../components/brand";
import { Btn, CtaArrow, GoldLine, Kicker, Section } from "../components/ui";
import { StoreButtons } from "../components/store-buttons";
import { useLang } from "../lib/i18n";
import { usePageContent } from "../lib/page-content-context";
import { SITE_ORIGIN, pageHead } from "../lib/site";
import { dictionaries } from "../lib/copy";
import { useSiteSettings } from "../lib/site-settings-context";

export const Route = createFileRoute("/features")({
  head: () =>
    pageHead({
      title: dictionaries.ar.seo.featuresTitle,
      description: dictionaries.ar.seo.featuresDesc,
      path: "/features",
    }),
  component: FeaturesPage,
});

const GROUPS: {
  id: "guests" | "owners" | "marinas";
  icon: typeof Waves;
  key: "guests" | "owners" | "marinas";
  images: PhotoName[];
}[] = [
  {
    id: "guests",
    icon: Waves,
    key: "guests",
    images: ["service-guest-charter", "service-guest-booking", "service-guest-options"],
  },
  {
    id: "owners",
    icon: Ship,
    key: "owners",
    images: [
      "service-owner-marketing",
      "service-owner-payments",
      "service-owner-logistics",
      "service-owner-growth",
    ],
  },
  {
    id: "marinas",
    icon: Compass,
    key: "marinas",
    images: [
      "service-marina-owners",
      "service-marina-occupancy",
      "service-marina-booking",
      "service-marina-reach",
    ],
  },
];

function readHash(raw: string) {
  return decodeURIComponent(raw.replace(/^#/, "")).trim();
}

type ServiceTabId = "guests" | "owners" | "marinas";

function isServiceTabId(value: string): value is ServiceTabId {
  return value === "guests" || value === "owners" || value === "marinas";
}

/** Keep the sticky service tabs in sync with the section under the nav while scrolling. */
function useActiveServiceTab() {
  const routerHash = useRouterState({ select: (s) => s.location.hash });
  const [activeId, setActiveId] = useState<ServiceTabId>(() => {
    const initial = readHash(routerHash);
    return isServiceTabId(initial) ? initial : "guests";
  });

  useEffect(() => {
    const fromHash = readHash(routerHash || window.location.hash);
    if (isServiceTabId(fromHash)) setActiveId(fromHash);
  }, [routerHash]);

  useEffect(() => {
    const ids = GROUPS.map((group) => group.id);

    const syncFromScroll = () => {
      const marker = 140;
      let current: ServiceTabId = "guests";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - marker <= 0) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncFromScroll();
      });
    };

    syncFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return activeId;
}

function ServiceCard({
  title,
  body,
  image,
  flipImage,
}: {
  title: string;
  body: string;
  image: PhotoName;
  flipImage: boolean;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <Photo
          name={image}
          alt={title}
          className={`h-full w-full object-cover ${flipImage ? "scale-x-[-1]" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          width={960}
          height={720}
        />
      </div>
      <div className="flex flex-1 flex-col p-6 text-center [&_*]:text-center">
        <h3 className="font-display text-xl font-semibold leading-snug text-gold-ink sm:text-[1.35rem]">{title}</h3>
        <p className="mx-auto mt-3 max-w-prose flex-1 text-sm leading-7 text-muted-foreground">{body}</p>
      </div>
    </article>
  );
}

function ServiceSection({
  id,
  icon: Icon,
  kicker,
  title,
  intro,
  closing,
  downloadTitle,
  loginCta,
  loginHref,
  loginLabel,
  siteChip,
  siteTitle,
  siteBody,
  items,
  images,
  tone,
  flipImage,
}: {
  id: string;
  icon: typeof Waves;
  kicker: string;
  title: string;
  intro: string;
  closing?: string;
  downloadTitle?: string;
  loginCta?: boolean;
  loginHref?: string;
  loginLabel?: string;
  siteChip?: string;
  siteTitle?: string;
  siteBody?: string;
  items: [string, string][];
  images: PhotoName[];
  tone: "plain" | "mute";
  flipImage: boolean;
}) {
  const bg = tone === "mute" ? "bg-surface-2 bp-section-mute" : "bg-background bp-section-plain";
  const showSiteBox = Boolean(loginCta && loginLabel && siteTitle && siteBody);

  return (
    <section id={id} className={`scroll-mt-[120px] ${bg} py-10 sm:py-14 lg:py-20`}>
      <div className={SHELL}>
        <div className="rounded-[1.5rem] border-2 border-border bg-surface-2 p-1 dark:border-sea/25 dark:bg-gradient-to-b dark:from-sea/15 dark:via-card/80 dark:to-card sm:rounded-[1.75rem] sm:p-1.5 md:p-2">
          <div className="rounded-[1.25rem] border border-border bg-card p-5 dark:border-white/10 dark:bg-gradient-to-b dark:from-card dark:to-navy-deep/40 sm:rounded-[1.5rem] sm:p-8 lg:p-10">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex items-center justify-center gap-2 text-gold-ink">
                <Icon size={18} aria-hidden="true" />
                <Kicker className="!text-gold-ink">{kicker}</Kicker>
              </div>
              <GoldLine className="mx-auto mt-4" />
              <h2 className="mt-5 whitespace-nowrap font-display text-[clamp(1.05rem,2.4vw+0.55rem,2.25rem)] font-semibold leading-snug text-navy">
                {title}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">{intro}</p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6">
              {items.map(([itemTitle, body], i) => (
                <div
                  key={itemTitle}
                  className="flex w-full sm:w-[calc(50%-0.75rem)] xl:w-[calc((100%-3rem)/3)] xl:max-w-[22rem]"
                >
                  <ServiceCard
                    title={itemTitle}
                    body={body}
                    image={images[i % images.length] ?? images[0] ?? "luxury-marina"}
                    flipImage={flipImage}
                  />
                </div>
              ))}
            </div>

            {closing || downloadTitle || showSiteBox ? (
              <div className="mx-auto mt-10 max-w-3xl text-center">
                {closing ? <p className="text-base leading-8 text-muted-foreground">{closing}</p> : null}

                {downloadTitle ? (
                  <div className="mt-8 rounded-[1.35rem] border border-border bg-surface-2 p-6 sm:p-7">
                    <StoreButtons
                      size="lg"
                      showNotice
                      className="mt-0 justify-center"
                      app={id === "owners" ? "owners" : "guests"}
                    />
                  </div>
                ) : null}

                {showSiteBox ? (
                  <div className={`${closing || downloadTitle ? "mt-8" : ""} rounded-[1.35rem] border border-border bg-surface-2 p-6 sm:p-7`}>
                    {siteChip ? (
                      <p className="text-[11px] font-semibold text-gold-ink dark:text-gold">{siteChip}</p>
                    ) : null}
                    <p className="mt-1 font-display text-[15px] font-semibold leading-6 text-navy dark:text-white sm:text-base">
                      {siteTitle}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-navy/70 dark:text-white/75 sm:text-[13px] sm:leading-6">
                      {siteBody}
                    </p>
                    <div className="mt-5 flex justify-center">
                      {loginHref ? (
                        <Btn href={loginHref} variant="gold" className="min-h-11 min-w-[12rem] justify-center">
                          {loginLabel} <CtaArrow />
                        </Btn>
                      ) : (
                        <Btn type="button" disabled variant="gold" className="min-h-11 min-w-[12rem] justify-center">
                          {loginLabel} <CtaArrow />
                        </Btn>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function cmsGroupImageKey(group: "guests" | "owners" | "marinas", index: number) {
  const prefix = group === "guests" ? "guest" : group === "owners" ? "owner" : "marina";
  return `${prefix}${index}`;
}

function ServiceTabsNav() {
  const { t } = useLang();
  const p = t.featuresPage;
  const activeTab = useActiveServiceTab();

  return (
    <nav
      aria-label={p.tabsLabel}
      className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-md sm:top-16 lg:top-[72px]"
    >
      <div className={`${SHELL} py-3.5`}>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {GROUPS.map((group) => {
            const active = activeTab === group.id;
            const copy = p[group.key];
            const Icon = group.icon;
            return (
              <Link
                key={group.id}
                to="/features"
                hash={group.id}
                activeOptions={{ exact: true, includeHash: true }}
                aria-current={active ? "location" : undefined}
                className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium ${
                  active
                    ? "border border-navy bg-navy-deep text-white"
                    : "border border-border bg-card text-navy transition-colors hover:border-gold hover:text-gold"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {copy.tab}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function FeaturesPage() {
  const { dir, t } = useLang();
  const { image } = usePageContent();
  const { serviceLogins } = useSiteSettings();
  const p = t.featuresPage;
  const flipImage = dir === "ltr";
  const heroImage = image("features", "hero", "hero-features");

  return (
    <>
      <PageMeta title={t.seo.featuresTitle} description={t.seo.featuresDesc} />
      <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: p.h1,
            url: `${SITE_ORIGIN}/features`,
            description: t.seo.featuresDesc,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.crumbs.home, item: `${SITE_ORIGIN}/` },
              { "@type": "ListItem", position: 2, name: t.crumbs.features, item: `${SITE_ORIGIN}/features` },
            ],
          },
        ]}
      />

      <PageHero
        dir={dir}
        image={heroImage}
        chip={p.chip}
        title={p.h1}
        lead={p.lead}
      />

      <ServiceTabsNav />

      {GROUPS.map((group, i) => {
        const copy = p[group.key];
        const loginHref = group.id === "marinas" ? serviceLogins.marinas : "";
        const images = group.images.map((fallback, idx) =>
          image("features", cmsGroupImageKey(group.id, idx), fallback),
        );
        return (
          <ServiceSection
            key={group.id}
            id={group.id}
            icon={group.icon}
            kicker={copy.kicker}
            title={copy.title}
            intro={copy.intro}
            closing={copy.closing || undefined}
            downloadTitle={copy.downloadTitle || undefined}
            loginCta={copy.loginCta}
            loginHref={loginHref || undefined}
            loginLabel={group.id === "marinas" ? p.marinas.siteCta : p.loginCta}
            siteChip={group.id === "marinas" ? p.marinas.siteChip : undefined}
            siteTitle={group.id === "marinas" ? p.marinas.siteTitle : undefined}
            siteBody={group.id === "marinas" ? p.marinas.siteBody : undefined}
            items={copy.items}
            images={images}
            tone={i % 2 === 0 ? "plain" : "mute"}
            flipImage={flipImage}
          />
        );
      })}

      <Section tone="mute">
        <div className="mx-auto max-w-2xl text-center">
          <GoldLine className="mx-auto" />
          <h2 className="mt-5 font-display text-3xl font-semibold leading-snug text-navy md:text-4xl">{p.ctaTitle}</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{p.ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Btn to="/app" variant="line">
              {t.cta.download} <CtaArrow />
            </Btn>
            <Btn to="/contact" variant="gold">
              {t.cta.talk} <CtaArrow />
            </Btn>
          </div>
        </div>
      </Section>
    </MarketingShell>
    </>
  );
}
