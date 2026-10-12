import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Ship, Waves } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Logo, SHELL } from "../components/brand";
import { ContactChannels } from "../components/contact-channels";
import { JsonLd } from "../components/json-ld";
import { MarketingShell } from "../components/marketing-shell";
import { PageMeta } from "../components/page-meta";
import { Photo, photoFocusStyle, type PhotoName } from "../components/photo";
import { StoreButtons } from "../components/store-buttons";
import { Btn, CtaArrow, GoldLine, Kicker, Section } from "../components/ui";
import { useLang } from "../lib/i18n";
import type { Lang } from "../lib/page-content";
import { useCmsImage } from "../lib/page-content-context";
import { useSiteSettings } from "../lib/site-settings-context";
import { SITE_ORIGIN, localizedUrl, pageHead } from "../lib/site";
import { getUrlLang } from "../lib/locale-url";

const HOME_SCHEMA_PHONE = "+966502554747";
const HOME_OG_IMAGE = `${SITE_ORIGIN}/og.jpg`;

const HOME_SEO = {
  ar: {
    title: "بوت برو | BoatPro - منصة القوارب واليخوت والخدمات البحرية",
    description:
      "بوت برو منصة بحرية تربط الباحثين عن القوارب واليخوت والرحلات البحرية بملاك القوارب واليخوت والمراسي ومقدمي الخدمات البحرية في السعودية والخليج والأسواق البحرية الدولية.",
  },
  en: {
    title: "BoatPro | Boat & Yacht Rental, Booking & Marine Services",
    description:
      "BoatPro connects guests, boat and yacht owners, marinas and marine service providers through a seamless platform for boat rentals, yacht charters, bookings and marine services.",
  },
} as const;

const HOME_SERVICES: Record<Lang, readonly string[]> = {
  ar: [
    "تأجير قوارب",
    "تأجير يخوت",
    "حجز قوارب",
    "حجز يخوت",
    "استئجار قوارب",
    "استئجار يخوت",
    "رحلات صيد",
    "رحلات غوص",
    "رياضات مائية",
    "تجارب بحرية",
    "تسويق قوارب",
    "تسويق يخوت",
    "إدارة الحجوزات",
    "تحصيل المدفوعات",
    "الخدمات اللوجستية البحرية",
    "حجز المراسي",
    "خدمات الوقود",
    "خدمات الصيانة",
    "خدمات المراسي",
    "حجز المرسى",
    "حجز أرصفة",
    "خدمات الوقود البحرية",
    "صيانة القوارب",
    "صيانة اليخوت",
    "مقدّمو الخدمات البحرية",
  ],
  en: [
    "Boat Rental",
    "Yacht Rental",
    "Boat Booking",
    "Yacht Booking",
    "Boat Charter",
    "Yacht Charter",
    "Fishing Trips",
    "Diving Trips",
    "Water Sports",
    "Marine Experiences",
    "Boat Marketing",
    "Yacht Marketing",
    "Booking Management",
    "Payment Collection",
    "Marine Logistics",
    "Marina Booking",
    "Fuel Services",
    "Maintenance Services",
    "Marina Services",
    "Marina Booking",
    "Berth Booking",
    "Marine Fuel Services",
    "Boat Maintenance",
    "Yacht Maintenance",
    "Marine Service Providers",
  ],
};

type HomeImageAltKey = "hero" | "what" | "partner" | "audience0" | "audience1" | "audience2";

const HOME_IMAGE_ALTS: Record<HomeImageAltKey, Record<Lang, string>> = {
  hero: {
    ar: "تأجير وحجز القوارب واليخوت عبر بوت برو",
    en: "Boat and yacht rental and booking with BoatPro",
  },
  what: {
    ar: "منصة بوت برو للقوارب واليخوت والخدمات البحرية",
    en: "BoatPro platform for boats, yachts and marine services",
  },
  partner: {
    ar: "شراكات المراسي ومقدمي الخدمات البحرية مع بوت برو",
    en: "Marina and marine service partnerships with BoatPro",
  },
  audience0: {
    ar: "تأجير وحجز القوارب واليخوت ورحلات بحرية للضيوف",
    en: "Boat and yacht rental, booking and marine trips for guests",
  },
  audience1: {
    ar: "تسويق وإدارة القوارب واليخوت لملاك الأصول البحرية",
    en: "Boat and yacht marketing and management for owners",
  },
  audience2: {
    ar: "حلول المراسي ومقدمي الخدمات البحرية",
    en: "Marina and marine service provider solutions",
  },
};

function homeImageAlt(key: HomeImageAltKey, lang: Lang) {
  return HOME_IMAGE_ALTS[key][lang];
}

function useHomeOpenGraph(seo: (typeof HOME_SEO)[Lang], lang: Lang) {
  useEffect(() => {
    const pageUrl = localizedUrl("/", lang);
    const ogLocale = lang === "ar" ? "ar_SA" : "en";

    const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", pageUrl);
    upsertMeta("property", "og:image", HOME_OG_IMAGE);
    upsertMeta("property", "og:locale", ogLocale);
    upsertMeta("property", "og:site_name", "BoatPro");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", HOME_OG_IMAGE);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrl);
  }, [seo, lang]);
}

function buildHomeJsonLd(lang: Lang, seo: (typeof HOME_SEO)[Lang], email: string) {
  const inLanguage = lang === "ar" ? "ar-SA" : "en";
  const pageUrl = localizedUrl("/", lang);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_ORIGIN}/#organization`,
      name: "BoatPro",
      alternateName: "بوت برو",
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo.png`,
      email,
      telephone: HOME_SCHEMA_PHONE,
      description: seo.description,
      areaServed: [
        { "@type": "Country", name: "Saudi Arabia" },
        { "@type": "AdministrativeArea", name: "Gulf Cooperation Council" },
        { "@type": "Continent", name: "Europe" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      name: "BoatPro",
      url: SITE_ORIGIN,
      inLanguage,
      publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: seo.title,
      description: seo.description,
      inLanguage,
      isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
      about: { "@id": `${SITE_ORIGIN}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: lang === "ar" ? "خدمات بوت برو البحرية" : "BoatPro marine services",
      itemListElement: HOME_SERVICES[lang].map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
      })),
    },
  ];
}

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: HOME_SEO[getUrlLang()].title,
      description: HOME_SEO[getUrlLang()].description,
      path: "/",
    }),
  component: HomePage,
});

const AUDIENCE_PHOTOS: PhotoName[] = ["audience-guests", "audience-owners", "audience-marinas"];
const AUDIENCE_ICONS = [Waves, Ship, Compass];

const actionPill =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors";

function AudienceActions({ id }: { id: string }) {
  const { t } = useLang();
  const { serviceLogins } = useSiteSettings();
  const loginHref = id === "marinas" ? serviceLogins.marinas : "";
  const showStores = id === "guests" || id === "owners";
  const primary =
    id === "owners"
      ? { to: "/contact" as const, hash: "partner-form", label: t.cta.shareInterest }
      : { to: "/features" as const, hash: id, label: t.cta.more };

  return (
    <div className="mt-auto flex flex-col gap-3 pt-5">
      <div className="flex flex-wrap gap-2">
        <Link
          to={primary.to}
          hash={primary.hash}
          className={`${actionPill} border border-gold/50 text-gold-ink hover:bg-gold hover:text-white`}
        >
          {primary.label} <CtaArrow />
        </Link>
        {loginHref ? (
          <a
            href={loginHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionPill} bg-gold text-white hover:bg-gold/85`}
          >
            {id === "marinas" ? t.featuresPage.marinas.siteCta : t.featuresPage.loginCta}{" "}
            <CtaArrow />
          </a>
        ) : null}
      </div>
      {showStores ? (
        <StoreButtons size="sm" showNotice app={id === "owners" ? "owners" : "guests"} />
      ) : null}
    </div>
  );
}

const AUDIENCE_ALT_KEYS: HomeImageAltKey[] = ["audience0", "audience1", "audience2"];

function HomePage() {
  const { dir, t, lang } = useLang();
  const seo = HOME_SEO[lang];
  const { contact } = useSiteSettings();
  const heroImage = useCmsImage("home", "hero", "luxury-sailing");
  const whatImage = useCmsImage("home", "what", "night-yacht");
  const partnerImage = useCmsImage("home", "partner", "luxury-night");
  const audienceImage0 = useCmsImage("home", "audience0", "audience-guests");
  const audienceImage1 = useCmsImage("home", "audience1", "audience-owners");
  const audienceImage2 = useCmsImage("home", "audience2", "audience-marinas");
  const audienceImages = [audienceImage0, audienceImage1, audienceImage2] as const;
  const jsonLd = useMemo(
    () => buildHomeJsonLd(lang, seo, contact.email),
    [lang, seo, contact.email],
  );

  useHomeOpenGraph(seo, lang);

  return (
    <>
      <PageMeta title={seo.title} description={seo.description} />
      <MarketingShell dir={dir}>
        <JsonLd data={jsonLd} />

        <section className="relative isolate overflow-hidden bg-navy-deep pt-14 sm:pt-16 lg:h-[100svh] lg:max-h-[100svh] lg:pt-0">
          <div className="relative aspect-[5/4] overflow-hidden sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
            <Photo
              name={heroImage}
              alt={homeImageAlt("hero", lang)}
              className="absolute inset-0 h-full w-full object-cover object-[var(--photo-focus)] max-lg:fade-bottom lg:scale-[1.03] lg:object-[center_40%]"
              style={photoFocusStyle(heroImage)}
              sizes="100vw"
              eager
              bright
              width={1440}
              height={900}
            />
            <div className="absolute inset-0 hidden bg-navy-deep/20 lg:block dark:bg-navy-deep/8" />
            <div className="absolute inset-0 hidden bg-gradient-to-b from-navy-deep/40 via-navy-deep/20 to-navy-deep/60 lg:block dark:from-navy-deep/25 dark:via-navy-deep/10 dark:to-navy-deep/40" />
            <div className="absolute inset-0 hidden bg-gradient-to-l from-navy-deep/50 via-navy-deep/25 to-transparent lg:block dark:from-navy-deep/30 dark:via-navy-deep/12" />
            <div className="absolute inset-x-0 bottom-0 hidden h-20 bg-gradient-to-t from-navy-deep/70 to-transparent lg:block dark:from-navy-deep/45" />
          </div>

          <div
            className={`${SHELL} relative -mt-16 pb-12 sm:-mt-28 sm:pb-14 lg:mt-0 lg:flex lg:h-full lg:items-center lg:justify-start lg:py-4 lg:pt-[76px] lg:pb-5`}
          >
            <div className="animate-fade-up me-auto w-full max-w-2xl text-white sm:max-w-3xl lg:max-w-[52rem] lg:rounded-[1.25rem] lg:border lg:border-white/15 lg:bg-navy-deep/30 lg:p-6 lg:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] lg:backdrop-blur-[2px]">
              <div className="flex items-center gap-2.5">
                <Logo />
                <div>
                  <p className="font-display text-[13px] tracking-[0.2em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:text-[14px]">
                    BOATPRO
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] sm:text-[12px]">
                    {t.home.hero.tagline}
                  </p>
                </div>
              </div>

              <GoldLine className="mt-2.5 !bg-gold sm:mt-3" />

              <h1 className="mt-3 font-display text-[clamp(1.6rem,5.5vw,2.2rem)] font-semibold leading-[1.25] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] lg:text-[clamp(1.35rem,2.6vw+1vh,2.35rem)] lg:leading-[1.22]">
                <span className="block">{t.home.hero.title1}</span>
                <span className="block text-gradient-gold-soft">{t.home.hero.title2}</span>
                <span className="block text-gradient-gold-soft">{t.home.hero.title3}</span>
              </h1>

              <p className="mt-3 max-w-2xl text-[14.5px] leading-7 text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] lg:mt-2.5 lg:text-[14px] lg:leading-6 lg:text-white">
                {t.home.hero.body}
              </p>

              <div className="mt-5 flex w-full flex-col gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center lg:mt-3">
                <Btn
                  to="/app"
                  variant="gold"
                  className="min-h-10 w-full justify-center px-5 py-2 text-[13px] sm:w-auto sm:min-w-[10.5rem]"
                >
                  {t.cta.download} <CtaArrow />
                </Btn>
                <Btn
                  to="/contact"
                  hash="partner-form"
                  variant="ghost"
                  className="min-h-10 w-full justify-center border-white/55 bg-white/10 px-5 py-2 text-[13px] backdrop-blur-sm sm:w-auto sm:min-w-[10.5rem]"
                >
                  {t.cta.partnerInterest} <CtaArrow />
                </Btn>
              </div>

              <StoreButtons tone="hero" size="sm" showNotice className="mt-5 lg:mt-3" />
            </div>
          </div>
        </section>

        <Section id="what" tone="mute">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Kicker>{t.home.what.chip}</Kicker>
              <GoldLine className="mt-4" />
              <h2 className="mt-6 font-display text-3xl font-semibold leading-snug text-navy md:text-4xl">
                {t.home.what.title}
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">{t.home.what.body}</p>
              <Btn to="/about" variant="line" className="mt-7">
                {t.cta.readStory} <CtaArrow />
              </Btn>
            </div>
            <div className="relative lg:col-span-7">
              <div className="relative overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-32px_rgba(15,40,70,0.45)]">
                <Photo
                  name={whatImage}
                  alt={homeImageAlt("what", lang)}
                  className="aspect-[16/10] w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  width={960}
                  height={600}
                  bright
                />
              </div>
            </div>
          </div>
        </Section>

        <Section id="audiences">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker>{t.home.audiences.chip}</Kicker>
            <GoldLine className="mx-auto mt-4" />
            <h2 className="mt-6 font-display text-3xl font-semibold leading-snug text-navy md:text-4xl">
              {t.home.audiences.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              {t.home.audiences.body}
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.home.audiences.cards.map((card, i) => {
              const Icon = AUDIENCE_ICONS[i] ?? Waves;
              const photo = audienceImages[i] ?? AUDIENCE_PHOTOS[i] ?? "luxury-dive";
              return (
                <article
                  key={card.id}
                  className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_18px_40px_-28px_rgba(15,40,70,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <Photo
                      name={photo}
                      alt={homeImageAlt(AUDIENCE_ALT_KEYS[i] ?? "audience0", lang)}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      width={960}
                      height={768}
                      bright
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-gold backdrop-blur-sm ring-1 ring-white/15">
                        <Icon size={14} />
                        <span className="text-[12px] font-medium">{card.kicker}</span>
                      </div>
                      <h3 className="mt-3 font-display text-xl font-semibold">{card.title}</h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="text-sm leading-7 text-muted-foreground">{card.body}</p>
                    <AudienceActions id={card.id} />
                  </div>
                </article>
              );
            })}
          </div>
        </Section>

        <Section id="features">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker>{t.home.features.chip}</Kicker>
            <GoldLine className="mx-auto mt-4" />
            <h2 className="mt-6 font-display text-3xl font-semibold leading-snug text-navy md:text-4xl">
              {t.home.features.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">{t.home.features.body}</p>
            <Btn to="/features" variant="line" className="mt-7">
              {t.cta.allFeatures} <CtaArrow />
            </Btn>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {t.home.features.items.map(([title, body]) => (
              <article
                key={title}
                className="relative overflow-hidden rounded-[1.4rem] border border-border bg-card p-6 ps-7"
              >
                <span className="absolute inset-y-0 start-0 w-1 bg-gold" aria-hidden="true" />
                <h3 className="font-display text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </Section>

        <section className="bg-background py-8 sm:py-12 dark:bg-transparent">
          <div className={SHELL}>
            <div className="relative overflow-hidden rounded-[1.75rem]">
              <Photo
                name={partnerImage}
                alt={homeImageAlt("partner", lang)}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="100vw"
                width={1440}
                height={900}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-sea/40 via-navy-deep/78 to-navy-deep/92" />
              <div className="relative px-6 py-16 text-center text-white sm:px-10 lg:py-24">
                <Kicker className="text-gold">{t.home.partner.chip}</Kicker>
                <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-snug md:text-4xl">
                  {t.home.partner.title}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-white/70">
                  {t.home.partner.body}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Btn to="/contact" variant="gold">
                    {t.cta.contactPartners}
                  </Btn>
                  <Btn to="/about" variant="ghost">
                    {t.cta.readStory}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Section id="trust" tone="mute">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker>{t.home.trust.chip}</Kicker>
            <GoldLine className="mx-auto mt-4" />
            <h2 className="mt-6 font-display text-3xl font-semibold leading-snug text-navy md:text-4xl">
              {t.home.trust.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">{t.home.trust.body}</p>
          </div>

          <ContactChannels className="mt-10" />
        </Section>

        <Section id="final">
          <div className="rounded-[1.75rem] bg-navy-deep px-6 py-14 text-white sm:px-10 lg:flex lg:items-end lg:justify-between lg:gap-10 lg:px-14 lg:py-16">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold leading-snug md:text-4xl">
                {t.home.final.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-white/70">{t.home.final.body}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
              <Btn to="/contact" variant="gold">
                {t.cta.talk} <CtaArrow />
              </Btn>
              <Btn href={contact.whatsapp} variant="whatsapp">
                {t.cta.whatsapp} <CtaArrow />
              </Btn>
            </div>
          </div>
        </Section>
      </MarketingShell>
    </>
  );
}
