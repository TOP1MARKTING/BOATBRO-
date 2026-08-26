import { CONTACT } from "../lib/site";
import { useLang } from "../lib/i18n";
import { WhatsAppIcon } from "./whatsapp-icon";

export function WhatsAppFab() {
  const { lang, t } = useLang();
  const isAr = lang === "ar";

  return (
    <a
      href={CONTACT.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.cta.whatsapp}
      className={`fixed bottom-5 z-[60] inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-8px_rgba(18,140,126,0.65)] transition-transform hover:scale-105 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isAr ? "right-4 sm:right-5" : "left-4 sm:left-5"
      }`}
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
