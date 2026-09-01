import { createFileRoute } from "@tanstack/react-router";
import { ContactChannels } from "../components/contact-channels";
import { ContactForm } from "../components/contact-form";
import { JsonLd } from "../components/json-ld";
import { MarketingShell } from "../components/marketing-shell";
import { PageMeta } from "../components/page-meta";
import { PageHero } from "../components/page-hero";
import { Btn, CtaArrow, GoldLine, Kicker, Section } from "../components/ui";
import { useLang } from "../lib/i18n";
import { useCmsImage } from "../lib/page-content-context";
import { useSiteSettings } from "../lib/site-settings-context";
import { SITE_ORIGIN, pageHead } from "../lib/site";
import { dictionaries } from "../lib/copy";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      title: dictionaries.ar.seo.contactTitle,
      description: dictionaries.ar.seo.contactDesc,
      path: "/contact",
    }),
  component: ContactPage,
});

function ContactPage() {
  const { dir, t } = useLang();
  const { contact } = useSiteSettings();
  const c = t.contact;
  const heroImage = useCmsImage("contact", "hero", "hero-contact");

  return (
    <>
      <PageMeta title={t.seo.contactTitle} description={t.seo.contactDesc} />
      <MarketingShell dir={dir}>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: c.h1,
            url: `${SITE_ORIGIN}/contact`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.crumbs.home, item: `${SITE_ORIGIN}/` },
              { "@type": "ListItem", position: 2, name: t.crumbs.contact, item: `${SITE_ORIGIN}/contact` },
            ],
          },
        ]}
      />

      <PageHero
        dir={dir}
        image={heroImage}
        chip={c.chip}
        title={c.h1}
        lead={c.lead}
      />

      <Section tone="mute">
        <Kicker>{c.chip}</Kicker>
        <GoldLine className="mt-4" />
        <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold leading-snug text-navy md:text-4xl">
          {c.title1} {c.title2}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">{c.body}</p>

        <ContactChannels className="mt-10" />
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <Kicker>{c.chip}</Kicker>
            <GoldLine className="mt-4" />
            <h2 className="mt-6 font-display text-3xl font-semibold leading-snug text-navy">
              {c.title1}
              <br />
              {c.title2}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">{c.body}</p>
            <div className="mt-8 space-y-3">
              {c.paths.map(([title, body], i) => (
                <article
                  key={title}
                  className="relative overflow-hidden rounded-[1.35rem] border border-border bg-card p-5 ps-6"
                >
                  <span className="absolute inset-y-0 start-0 w-1 bg-gold" aria-hidden="true" />
                  <p className="font-display text-[12px] tracking-[0.14em] text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-navy">{title}</h3>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-[1.85rem] border border-border bg-surface-2 p-1.5 sm:p-2">
              <div className="rounded-[1.6rem] bg-card p-5 sm:p-7 lg:p-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="mute">
        <div className="rounded-[1.75rem] border border-border bg-card px-6 py-12 sm:px-10 lg:flex lg:items-end lg:justify-between lg:gap-10 lg:px-14 lg:py-14">
          <div className="max-w-xl">
            <GoldLine />
            <h2 className="mt-5 font-display text-3xl font-semibold leading-snug text-navy">
              {c.title1} {c.title2}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">{c.body}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 lg:mt-0">
            <Btn href={contact.whatsapp} variant="gold">
              {t.cta.whatsapp} <CtaArrow />
            </Btn>
            <Btn to="/app" variant="line">
              {t.cta.download} <CtaArrow />
            </Btn>
          </div>
        </div>
      </Section>
    </MarketingShell>
    </>
  );
}
