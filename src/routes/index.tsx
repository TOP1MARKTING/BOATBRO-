import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Ship, Waves } from "lucide-react";
import { Logo, SHELL } from "../components/brand";
import { ContactChannels } from "../components/contact-channels";
import { JsonLd } from "../components/json-ld";
import { MarketingShell } from "../components/marketing-shell";
import { PageMeta } from "../components/page-meta";
import { Photo, type PhotoName } from "../components/photo";
import { StoreButtons } from "../components/store-buttons";
import { Btn, CtaArrow, GoldLine, Kicker, Section } from "../components/ui";
import { useLang } from "../lib/i18n";
import { CONTACT, SITE_ORIGIN, pageHead } from "../lib/site";
import { useSiteSettings } from "../lib/site-settings-context";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: "بوت برو | منصّة حجز اليخوت والأعمال البحرية",
      description:
        "بوت برو منصّة تقنية بحرية للضيوف وملاك اليخوت والمراسي: اكتشف التجربة، احجزها، أو أدر أصلك البحري من تطبيق واحد في المملكة.",
      path: "/",
    }),
  component: HomePage,
});

const AUDIENCE_PHOTOS: PhotoName[] = ["audience-guests", "audience-owners", "audience-marinas"];
const AUDIENCE_ICONS = [Waves, Ship, Compass];

const actionPill =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors";

function AudienceActions({ id }: { id: "guests" | "owners" | "marinas" }) {
  const { t } = useLang();
  const { serviceLogins } = useSiteSettings();
  const loginHref = id === "marinas" ? serviceLogins.marinas : "";
  const showStores = id === "guests" || id === "owners";

  return (
    <div className="mt-auto flex flex-col gap-3 pt-5">
      <div className="flex flex-wrap gap-2">
        <Link
          to="/features"
          hash={id}
          className={`${actionPill} border border-gold/50 text-gold-ink hover:bg-gold hover:text-white`}
        >
          {t.cta.more} <CtaArrow />
        </Link>
        {loginHref ? (
          <a
            href={loginHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionPill} bg-gold text-white hover:bg-gold/85`}
          >
            {t.featuresPage.loginCta} <CtaArrow />
          </a>
        ) : null}
      </div>
      {showStores ? <StoreButtons size="sm" /> : null}
    </div>
  );
}

function HomePage() {
  const { dir, t } = useLang();

  return (
    <>
      <PageMeta title={t.seo.homeTitle} description={t.seo.homeDesc} />
      <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "بوت برو",
            alternateName: "BoatPro",
            url: SITE_ORIGIN,
            logo: `${SITE_ORIGIN}/logo.png`,
            email: CONTACT.email,
            telephone: "+966502554747",
            address: {
              "@type": "PostalAddress",
              streetAddress: "طريق الأمير سلطان، حي الروضة، برج المرجانه",
              addressLocality: "جدة",
              addressCountry: "SA",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "BoatPro",
            url: SITE_ORIGIN,
            inLanguage: "ar",
          },
        ]}
      />

      <section className="relative isolate h-[100svh] max-h-[100svh] overflow-hidden bg-navy-deep">
        <Photo
          name="luxury-sailing"
          alt={t.home.hero.imageAlt}
          className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-[center_40%]"
          sizes="100vw"
          eager
          bright
          width={1440}
          height={900}
        />
        <div className="absolute inset-0 bg-navy-deep/20 dark:bg-navy-deep/8" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/40 via-navy-deep/20 to-navy-deep/60 dark:from-navy-deep/25 dark:via-navy-deep/10 dark:to-navy-deep/40" />
        <div className="absolute inset-0 bg-gradient-to-l from-navy-deep/50 via-navy-deep/25 to-transparent dark:from-navy-deep/30 dark:via-navy-deep/12" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy-deep/70 to-transparent dark:from-navy-deep/45" />

        <div className={`${SHELL} relative flex h-full items-center py-5 pt-[68px] sm:py-6 sm:pt-[80px] lg:pt-[88px]`}>
          <div className="animate-fade-up w-full max-w-xl rounded-[1.35rem] border border-white/15 bg-navy-deep/45 p-4 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md sm:max-w-2xl sm:p-6 lg:bg-navy-deep/40 lg:p-7">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <p className="font-display text-[14px] tracking-[0.2em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  BOATPRO
                </p>
                <p className="mt-0.5 text-[12px] text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                  {t.home.hero.tagline}
                </p>
              </div>
            </div>

            <GoldLine className="mt-4 !bg-gold" />

            <h1 className="mt-4 font-display text-[clamp(1.65rem,3.8vw+1.2vh,3.1rem)] font-semibold leading-[1.28] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
              <span className="block">{t.home.hero.title1}</span>
              <span className="block text-gradient-gold-soft">{t.home.hero.title2}</span>
              <span className="block text-gradient-gold-soft">{t.home.hero.title3}</span>
            </h1>

            <p className="mt-3 max-w-xl text-[13px] leading-7 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] sm:mt-4 sm:text-[15px] sm:leading-8">
              {t.home.hero.body}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-5 sm:gap-3">
              <Btn to="/app" variant="gold" className="min-h-11 px-6 py-2.5">
                {t.cta.download} <CtaArrow />
              </Btn>
              <Btn to="/contact" variant="ghost" className="min-h-11 px-6 py-2.5">
                {t.cta.talk}
              </Btn>
            </div>

            <StoreButtons tone="hero" size="sm" className="mt-3 sm:mt-4" />
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
                name="night-yacht"
                alt=""
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
          <p className="mt-4 text-base leading-8 text-muted-foreground">{t.home.audiences.body}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {t.home.audiences.cards.map((card, i) => {
            const Icon = AUDIENCE_ICONS[i] ?? Waves;
            const photo = AUDIENCE_PHOTOS[i] ?? "luxury-dive";
            return (
              <article
                key={card.id}
                className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_18px_40px_-28px_rgba(15,40,70,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Photo
                    name={photo}
                    alt=""
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
            <article key={title} className="relative overflow-hidden rounded-[1.4rem] border border-border bg-card p-6 ps-7">
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
              name="luxury-night"
              alt=""
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
              <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-white/70">{t.home.partner.body}</p>
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
            <h2 className="font-display text-3xl font-semibold leading-snug md:text-4xl">{t.home.final.title}</h2>
            <p className="mt-4 text-base leading-8 text-white/70">{t.home.final.body}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <Btn to="/contact" variant="gold">
              {t.cta.talk} <CtaArrow />
            </Btn>
            <Btn href={CONTACT.whatsapp} variant="ghost">
              {t.cta.whatsapp}
            </Btn>
          </div>
        </div>
      </Section>
    </MarketingShell>
    </>
  );
}
