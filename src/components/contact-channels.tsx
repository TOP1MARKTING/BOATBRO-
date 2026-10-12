import { Mail, MapPin } from "lucide-react";
import { WhatsAppIcon } from "./whatsapp-icon";
import { useLang } from "../lib/i18n";
import { useSiteSettings } from "../lib/site-settings-context";

export function ContactChannels({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const { contact } = useSiteSettings();
  const c = t.contact;

  const cards = [
    {
      key: "whatsapp",
      href: contact.whatsapp,
      label: c.whatsapp,
      value: contact.phoneDisplay,
      hint: c.whatsappHint,
      icon: "whatsapp" as const,
      external: true,
      ltr: true,
      accent:
        "from-[#25D366]/18 via-[#25D366]/6 to-card dark:from-[#25D366]/28 dark:via-[#0f2a22]/55 dark:to-card",
      iconWrap:
        "bg-[#25D366]/15 text-[#128C7E] ring-[#25D366]/30 dark:text-[#5EE09A] dark:ring-[#25D366]/40",
      hover: "hover:border-[#25D366]/45",
      labelCls: "text-[#128C7E] dark:text-[#5EE09A]",
      lineCls: "bg-[#25D366]/55",
    },
    {
      key: "email",
      href: contact.mailto,
      label: c.email,
      value: contact.email,
      hint: c.emailHint,
      icon: "mail" as const,
      external: true,
      ltr: true,
      accent:
        "from-[#1e3a5f]/16 via-[#2b4a6f]/8 to-card dark:from-[#1e3a5f]/55 dark:via-[#243b55]/40 dark:to-card",
      iconWrap:
        "bg-[#1e3a5f]/12 text-[#1e3a5f] ring-[#1e3a5f]/25 dark:bg-white/10 dark:text-[#9eb6d4] dark:ring-white/20",
      hover: "hover:border-[#1e3a5f]/40 dark:hover:border-[#9eb6d4]/40",
      labelCls: "text-[#1e3a5f] dark:text-[#9eb6d4]",
      lineCls: "bg-[#1e3a5f]/50 dark:bg-[#9eb6d4]/50",
    },
    {
      key: "office",
      href: undefined as string | undefined,
      label: c.office,
      value: c.address,
      secondary: c.country,
      hint: c.officeHint,
      icon: "map" as const,
      external: false,
      ltr: false,
      accent:
        "from-sky-400/20 via-sky-200/15 to-card dark:from-sky-500/25 dark:via-sky-950/45 dark:to-card",
      iconWrap:
        "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-400/35",
      hover: "hover:border-sky-500/40",
      labelCls: "text-sky-800 dark:text-sky-300",
      lineCls: "bg-sky-500/50",
    },
  ] as const;

  return (
    <div className={`mx-auto w-full max-w-5xl ${className}`}>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {cards.map((card) => {
          const icon =
            card.icon === "whatsapp" ? (
              <WhatsAppIcon size={22} />
            ) : card.icon === "mail" ? (
              <Mail size={20} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <MapPin size={20} strokeWidth={1.75} aria-hidden="true" />
            );

          const secondary = "secondary" in card ? card.secondary : undefined;

          const inner = (
            <>
              <span
                className={`relative mx-auto inline-flex size-12 items-center justify-center rounded-2xl ring-1 sm:size-14 ${card.iconWrap}`}
              >
                {icon}
              </span>
              <p
                className={`mt-4 text-[12px] font-medium tracking-[0.14em] sm:mt-5 ${card.labelCls}`}
              >
                {card.label}
              </p>
              <span className={`mt-2.5 block h-px w-10 ${card.lineCls}`} aria-hidden="true" />
              <p
                className="mt-4 break-words font-display text-[1.05rem] font-semibold leading-7 text-navy/90 sm:text-lg sm:leading-8 dark:text-white/90"
                dir={card.ltr ? "ltr" : undefined}
              >
                {card.value}
              </p>
              {secondary ? (
                <p className="mt-2 break-words text-[0.95rem] leading-7 text-navy/65 sm:text-base sm:leading-8 dark:text-white/65">
                  {secondary}
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.hint}</p>
            </>
          );

          const cls = [
            "group relative flex h-full flex-col items-center overflow-hidden rounded-[1.5rem]",
            "border border-border/70 bg-gradient-to-b px-5 py-7 text-center sm:px-6 sm:py-8",
            "shadow-[0_8px_20px_-18px_rgba(15,40,70,0.35)]",
            "transition-colors duration-300",
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
