import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "../components/json-ld";
import { Photo } from "../components/photo";
import { MarketingShell } from "../components/marketing-shell";
import { PageMeta } from "../components/page-meta";
import { PageHero } from "../components/page-hero";
import { SHELL } from "../components/brand";
import { Btn, CtaArrow, GoldLine, Kicker, Section } from "../components/ui";
import { useLang } from "../lib/i18n";
import { CONTACT, SITE_ORIGIN, pageHead } from "../lib/site";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: "عن بوت برو | الرؤية والرسالة في السوق البحري السعودي",
      description:
        "قصة بوت برو ورؤيتها ورسالتها: جسر بين عشق البحر وتمكين الأعمال البحرية في المملكة والمنطقة، من مكتب جدة.",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  const { dir, t } = useLang();

  return (
    <>
      <PageMeta title={t.seo.aboutTitle} description={t.seo.aboutDesc} />
      <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: t.aboutPage.h1,
            url: `${SITE_ORIGIN}/about`,
            isPartOf: { "@type": "WebSite", name: "BoatPro", url: SITE_ORIGIN },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.crumbs.home, item: `${SITE_ORIGIN}/` },
              { "@type": "ListItem", position: 2, name: t.crumbs.about, item: `${SITE_ORIGIN}/about` },
            ],
          },
        ]}
      />

      <PageHero
        dir={dir}
        image="hero-about"
        chip={t.aboutPage.chip}
        title={t.aboutPage.h1}
        lead={t.aboutPage.lead}
      />

      <Section tone="mute">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Kicker>{t.aboutPage.storyChip}</Kicker>
            <GoldLine className="mt-4" />
            <h2 className="mt-6 font-display text-3xl font-semibold text-navy">{t.aboutPage.storyTitle}</h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">{t.aboutPage.story}</p>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] lg:col-span-6">
            <Photo
              name="luxury-marina"
              alt=""
              className="aspect-[16/10] w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              width={960}
              height={600}
            />
          </div>
        </div>
      </Section>

      <Section>
        <Kicker>{t.aboutPage.problemChip}</Kicker>
        <GoldLine className="mt-4" />
        <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold text-navy">
          {t.aboutPage.problemTitle}
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {t.aboutPage.problems.map(([title, body]) => (
            <article key={title} className="rounded-[1.4rem] border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-navy">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="mute">
        <div className="grid overflow-hidden rounded-[1.75rem] border border-border lg:grid-cols-2">
          <article className="bg-navy-deep px-7 py-10 text-white sm:px-10 lg:p-12">
            <Kicker>{t.aboutPage.visionChip}</Kicker>
            <GoldLine className="mt-5" />
            <h2 className="mt-6 font-display text-3xl font-semibold leading-snug">
              {t.aboutPage.visionTitle}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/75">{t.aboutPage.visionBody}</p>
          </article>
          <article className="bg-card px-7 py-10 sm:px-10 lg:p-12">
            <Kicker>{t.aboutPage.missionChip}</Kicker>
            <GoldLine className="mt-5" />
            <h2 className="mt-6 font-display text-3xl font-semibold leading-snug text-navy">
              {t.aboutPage.missionTitle}
            </h2>
            <div className="mt-8 space-y-8">
              <div>
                <h3 className="font-display text-xl text-navy">{t.aboutPage.loversLabel}</h3>
                <p className="mt-2 text-[15px] leading-8 text-muted-foreground">{t.aboutPage.loversBody}</p>
              </div>
              <div>
                <h3 className="font-display text-xl text-navy">{t.aboutPage.ownersLabel}</h3>
                <p className="mt-2 text-[15px] leading-8 text-muted-foreground">{t.aboutPage.ownersBody}</p>
              </div>
            </div>
          </article>
        </div>
      </Section>

      <Section>
        <Kicker>{t.aboutPage.servesChip}</Kicker>
        <GoldLine className="mt-4" />
        <h2 className="mt-6 font-display text-3xl font-semibold text-navy">{t.aboutPage.servesTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {t.aboutPage.serves.map(([title, body]) => (
            <article key={title} className="rounded-[1.4rem] border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-navy">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
        <Btn to="/features" variant="line" className="mt-8">
          {t.cta.allFeatures} <CtaArrow />
        </Btn>
      </Section>

      <Section tone="mute">
        <Kicker>{t.aboutPage.marketChip}</Kicker>
        <GoldLine className="mt-4" />
        <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold text-navy">
          {t.aboutPage.marketTitle}
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">{t.aboutPage.marketBody}</p>
      </Section>

      <Section>
        <Kicker>{t.aboutPage.officeChip}</Kicker>
        <GoldLine className="mt-4" />
        <h2 className="mt-6 font-display text-3xl font-semibold text-navy">{t.aboutPage.officeTitle}</h2>
        <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">{t.aboutPage.close}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.3rem] border border-border bg-card p-5">
            <p className="text-[13px] font-medium text-gold-ink">{t.contact.office}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t.contact.address}
              <br />
              {t.contact.country}
            </p>
          </div>
          <a href={CONTACT.mailto} className="rounded-[1.3rem] border border-border bg-card p-5 hover:border-gold">
            <p className="text-[13px] font-medium text-gold-ink">{t.contact.email}</p>
            <p className="mt-2 font-display text-lg text-navy" dir="ltr">
              {CONTACT.email}
            </p>
          </a>
          <a href={CONTACT.whatsapp} className="rounded-[1.3rem] border border-border bg-card p-5 hover:border-gold">
            <p className="text-[13px] font-medium text-gold-ink">{t.contact.whatsapp}</p>
            <p className="mt-2 font-display text-lg text-navy" dir="ltr">
              {CONTACT.phoneDisplay}
            </p>
          </a>
        </div>
        <Btn to="/contact" variant="gold" className="mt-8">
          {t.cta.talk} <CtaArrow />
        </Btn>
      </Section>
    </MarketingShell>
    </>
  );
}
