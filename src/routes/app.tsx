import { createFileRoute } from "@tanstack/react-router";
import { AppHeroPreview, AppScrollShowcase } from "../components/app-screen-frame";
import { JsonLd } from "../components/json-ld";
import { MarketingShell } from "../components/marketing-shell";
import { PageMeta } from "../components/page-meta";
import { StoreButtons } from "../components/store-buttons";
import { SHELL } from "../components/brand";
import { Btn, CtaArrow, GoldLine, Kicker, Section } from "../components/ui";
import { useLang } from "../lib/i18n";
import { SITE_ORIGIN, pageHead, localizedUrl } from "../lib/site";
import { dictionaries } from "../lib/copy";
import { getUrlLang } from "../lib/locale-url";

export const Route = createFileRoute("/app")({
  head: () =>
    pageHead({
      title: dictionaries[getUrlLang()].seo.appTitle,
      description: dictionaries[getUrlLang()].seo.appDesc,
      path: "/app",
    }),
  component: AppPage,
});

function AppPage() {
  const { dir, lang, t } = useLang();
  const p = t.appPage;

  return (
    <>
      <PageMeta title={t.seo.appTitle} description={t.seo.appDesc} />
      <MarketingShell dir={dir}>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "BoatPro",
              applicationCategory: "TravelApplication",
              operatingSystem: "iOS, Android",
              url: localizedUrl("/app", lang),
              description: p.lead,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: t.crumbs.home,
                  item: localizedUrl("/", lang),
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: t.crumbs.app,
                  item: localizedUrl("/app", lang),
                },
              ],
            },
          ]}
        />

        <section className="relative overflow-hidden bg-navy-deep pt-14 sm:pt-16 lg:pt-[72px] text-white">
          <div
            className={`${SHELL} grid items-center gap-8 py-10 sm:gap-10 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16`}
          >
            <div className="text-center lg:text-start">
              <p className="text-[13px] font-medium tracking-[0.14em] text-gold">{p.chip}</p>
              <h1 className="mt-4 font-display text-[clamp(1.7rem,5vw,2.65rem)] font-semibold leading-snug">
                {p.h1}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-white/80 sm:mt-5 sm:text-base sm:leading-8 lg:mx-0">
                {p.lead}
              </p>
              <StoreButtons tone="hero" className="mx-auto mt-6 sm:mt-8 lg:mx-0" showNotice />
            </div>
            <AppHeroPreview />
          </div>
        </section>

        <Section tone="mute">
          <Kicker>{p.whatTitle}</Kicker>
          <GoldLine className="mt-4" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold text-navy">
            {p.whatTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">{p.whatBody}</p>
        </Section>

        <Section>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[1.6rem] border border-border bg-card p-6 sm:p-8">
              <Kicker>{p.guestTitle}</Kicker>
              <h2 className="mt-4 font-display text-2xl font-semibold text-navy">{p.guestTitle}</h2>
              <p className="mt-3 text-base leading-8 text-muted-foreground">{p.guestBody}</p>
            </article>
            <article className="rounded-[1.6rem] border border-border bg-card p-6 sm:p-8">
              <Kicker>{p.ownerTitle}</Kicker>
              <h2 className="mt-4 font-display text-2xl font-semibold text-navy">{p.ownerTitle}</h2>
              <p className="mt-3 text-base leading-8 text-muted-foreground">{p.ownerBody}</p>
            </article>
          </div>
        </Section>

        <Section tone="mute">
          <Kicker>{p.screensTitle}</Kicker>
          <GoldLine className="mt-4" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold text-navy md:text-4xl">
            {p.screensTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            {p.screensLead}
          </p>
          <AppScrollShowcase dir={dir} screens={p.screens} scrollHint={p.scrollHint} />
        </Section>

        <Section tone="mute">
          <div className="mx-auto max-w-2xl text-center">
            <StoreButtons size="lg" showNotice className="mt-0 justify-center" />
          </div>
          <div className="mt-10 rounded-[1.5rem] border border-border bg-navy-deep px-6 py-8 text-center text-white sm:px-8 sm:py-10">
            <h3 className="font-display text-2xl font-semibold sm:text-3xl">{p.ctaTitle}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">{p.ctaBody}</p>
            <Btn to="/contact" variant="gold" className="mt-6">
              {t.cta.talk} <CtaArrow />
            </Btn>
          </div>
        </Section>
      </MarketingShell>
    </>
  );
}
