import { Mail, MapPin } from "lucide-react";
import { WhatsAppIcon } from "./whatsapp-icon";
import { useLang } from "../lib/i18n";
import { CONTACT } from "../lib/site";

export function ContactChannels({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const c = t.contact;

  const cards = [
    {
      key: "whatsapp",
      href: CONTACT.whatsapp,
      label: c.whatsapp,
      value: CONTACT.phoneDisplay,
      hint: c.whatsappHint,
      icon: "whatsapp" as const,
      external: true,
      ltr: true,
      accent: "from-[#25D366]/12 via-card to-card",
      iconWrap: "bg-[#25D366]/15 text-[#128C7E] ring-[#25D366]/25",
      hover: "hover:border-[#25D366]/45 hover:shadow-[0_20px_40px_-24px_rgba(18,140,126,0.55)]",
    },
    {
      key: "email",
      href: CONTACT.mailto,
      label: c.email,
      value: CONTACT.email,
      hint: c.emailHint,
      icon: "mail" as const,
      external: true,
      ltr: true,
      accent: "from-gold-dim/50 via-card to-card",
      iconWrap: "bg-navy/10 text-navy ring-navy/15",
      hover: "hover:border-gold/50 hover:shadow-[0_20px_40px_-24px_rgba(15,40,70,0.35)]",
    },
    {
      key: "office",
      href: undefined as string | undefined,
      label: c.office,
      value: c.address,
      hint: c.officeHint,
      icon: "map" as const,
      external: false,
      ltr: false,
      accent: "from-sea/15 via-card to-card",
      iconWrap: "bg-sea/15 text-sea ring-sea/20",
      hover: "hover:border-sea/40 hover:shadow-[0_20px_40px_-24px_rgba(40,120,160,0.4)]",
    },
  ] as const;

  return (
    <div className={`mx-auto w-full max-w-5xl ${className}`}>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const icon =
            card.icon === "whatsapp" ? (
              <WhatsAppIcon size={22} />
            ) : card.icon === "mail" ? (
              <Mail size={20} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <MapPin size={20} strokeWidth={1.75} aria-hidden="true" />
            );

          const inner = (
            <>
              <span
                className={`relative mx-auto inline-flex size-14 items-center justify-center rounded-2xl ring-1 ${card.iconWrap}`}
              >
                {icon}
              </span>
              <p className="mt-5 text-[12px] font-medium tracking-[0.14em] text-gold-ink">{card.label}</p>
              <span className="mt-3 block h-px w-10 bg-gold/55" aria-hidden="true" />
              <p
                className="mt-4 break-words font-display text-[1.05rem] font-semibold leading-snug text-navy sm:text-lg"
                dir={card.ltr ? "ltr" : undefined}
              >
                {card.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.hint}</p>
            </>
          );

          const cls = [
            "group relative flex h-full flex-col items-center overflow-hidden rounded-[1.6rem]",
            "border border-border/80 bg-gradient-to-b px-5 py-8 text-center sm:px-6 sm:py-9",
            "shadow-[0_14px_32px_-28px_rgba(15,40,70,0.45)]",
            "transition-all duration-300 hover:-translate-y-1",
            card.accent,
            card.hover,
          ].join(" ");

          if (card.href) {
            return (
              <a
                key={card.key}
                href={card.href}
                target={card.external ? "_blank" : undefined}
                rel={card.external ? "noopener noreferrer" : undefined}
                className={cls}
              >
                {inner}
              </a>
            );
          }

          return (
            <div key={card.key} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
