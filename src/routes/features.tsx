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
import { SITE_ORIGIN, SERVICE_LOGIN_URLS, pageHead } from "../lib/site";

export const Route = createFileRoute("/features")({
  head: () =>
    pageHead({
      title: "خدمات بوت برو للضيوف وملاك اليخوت والمراسي",
      description:
        "خدمات بوت برو حسب نوع المستخدم: اكتشاف وحجز للضيوف، إدارة وتحصيل للملاك، وفرص تشغيل للمراسي.",
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

function useFeatureHash() {
  const routerHash = useRouterState({ select: (s) => s.location.hash });
  const [hash, setHash] = useState(() => readHash(routerHash));

  useEffect(() => {
    const sync = () => setHash(readHash(routerHash || window.location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [routerHash]);

  return hash;
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
  items: [string, string][];
  images: PhotoName[];
  tone: "plain" | "mute";
  flipImage: boolean;
}) {
  const bg = tone === "mute" ? "bg-surface-2 dark:bg-surface-2/70" : "bg-background dark:bg-transparent";
  const showLogin = Boolean(loginCta && loginLabel);

  return (
    <section id={id} className={`scroll-mt-[120px] ${bg} py-10 sm:py-14 lg:py-20`}>
      <div className={SHELL}>
        <div className="rounded-[1.5rem] border-2 border-border bg-surface-2 p-1 sm:rounded-[1.75rem] sm:p-1.5 md:p-2">
          <div className="rounded-[1.25rem] border border-border bg-card p-5 sm:rounded-[1.5rem] sm:p-8 lg:p-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-gold-ink">
                <Icon size={18} aria-hidden="true" />
                <Kicker className="!text-gold-ink">{kicker}</Kicker>
              </div>
              <GoldLine className="mx-auto mt-4" />
              <h2 className="mt-5 font-display text-3xl font-semibold leading-snug text-navy md:text-4xl">{title}</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">{intro}</p>
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

            {closing ? (
              <div className="mx-auto mt-10 max-w-3xl text-center">
                <p className="text-base leading-8 text-muted-foreground">{closing}</p>
                {downloadTitle ? (
                  <div className="mt-8 rounded-[1.35rem] border border-border bg-surface-2 p-6 sm:p-7">
                    <p className="font-display text-xl font-semibold text-navy">{downloadTitle}</p>
                    <StoreButtons size="lg" className="mt-5 justify-center" />
                  </div>
                ) : null}
              </div>
            ) : null}

            {showLogin ? (
              <div className="mt-10 flex justify-center">
                {loginHref ? (
                  <Btn href={loginHref} variant="gold">
                    {loginLabel} <CtaArrow />
                  </Btn>
                ) : (
                  <Btn variant="gold" disabled>
                    {loginLabel}
                  </Btn>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesPage() {
  const { dir, t } = useLang();
  const p = t.featuresPage;
  const hash = useFeatureHash();
  const flipImage = dir === "ltr";

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
        image="hero-features"
        chip={p.chip}
        title={p.h1}
        lead={p.lead}
      />

      <nav
        aria-label={p.tabsLabel}
        className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-md sm:top-16 lg:top-[72px]"
      >
        <div className={`${SHELL} py-3.5`}>
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {GROUPS.map((group) => {
              const active = hash === group.id;
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

      {GROUPS.map((group, i) => {
        const copy = p[group.key];
        const loginHref = group.id === "marinas" ? SERVICE_LOGIN_URLS.marinas : "";
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
            loginLabel={p.loginCta}
            items={copy.items}
            images={group.images}
            tone={i % 2 === 0 ? "plain" : "mute"}
            flipImage={flipImage}
          />
        );
      })}

      <Section tone="navy">
        <div className="mx-auto max-w-2xl text-center">
          <GoldLine className="mx-auto" />
          <h2 className="mt-5 font-display text-3xl font-semibold leading-snug text-white md:text-4xl">{p.ctaTitle}</h2>
          <p className="mt-4 text-lg leading-8 text-white/85">{p.ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Btn to="/app" variant="ghost">
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
