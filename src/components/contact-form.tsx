import { useState, type FormEvent } from "react";
import { BadgeCheck, Ship } from "lucide-react";
import { useAuth } from "../lib/auth";
import { OWNER_INTEREST_TYPE } from "../lib/contact-user-type";
import { saveContactRequest } from "../lib/db";
import { useLang } from "../lib/i18n";
import { isValidPhone } from "../lib/site";
import { PhoneCountryField } from "./phone-country-field";
import { Btn, CtaArrow } from "./ui";

const fieldCls = [
  "w-full rounded-2xl border border-[#C8A96A]/25 bg-background/80",
  "px-4 py-3.5 text-sm text-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
  "outline-none transition-all duration-200",
  "placeholder:text-muted-foreground/55",
  "hover:border-[#C8A96A]/45",
  "focus:border-[#C8A96A] focus:bg-card focus:ring-2 focus:ring-[#C8A96A]/20",
].join(" ");

const labelCls = "mb-2.5 block text-[13px] font-medium tracking-wide text-gold-ink";

export function ContactForm() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phone, setPhone] = useState("");
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(false);
    setSendError("");
    setPhoneError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!isValidPhone(phone)) {
      setPhoneError(t.contact.phoneInvalid);
      return;
    }
    setSending(true);
    try {
      await saveContactRequest({
        userType: OWNER_INTEREST_TYPE,
        name: String(fd.get("name") ?? "").trim(),
        phone,
        email: String(fd.get("email") ?? "").trim(),
        address: String(fd.get("address") ?? "").trim(),
        boatsCount: String(fd.get("boatsCount") ?? "").trim(),
        content: String(fd.get("content") ?? "").trim(),
        lang,
        uid: user?.uid ?? null,
      });
      setSent(true);
      form.reset();
      setPhone("");
      setFormKey((k) => k + 1);
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
      if (import.meta.env.DEV) console.error("[contact]", code, err);
      setSendError(
        code === "unimplemented" || code === "failed-precondition" || code === "not-found"
          ? t.cta.firestoreOff
          : code === "permission-denied"
            ? t.cta.firestoreDenied
            : t.cta.sendError,
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form key={formKey} onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="flex items-start gap-3 border-b border-[#C8A96A]/20 pb-5">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#C8A96A]/30 bg-[#C8A96A]/12 text-[#A8894E]">
          <Ship size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-navy">{t.contact.partnerType}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.contact.formBody}</p>
          <span className="mt-3 inline-flex items-center rounded-full border border-[#C8A96A]/35 bg-[#C8A96A]/12 px-3 py-1 text-[12px] font-medium text-[#A8894E]">
            {t.contact.formAudience}
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label htmlFor="contact-name">
          <span className={labelCls}>{t.contact.name}</span>
          <input required id="contact-name" name="name" maxLength={120} type="text" autoComplete="name" className={fieldCls} />
        </label>
        <label htmlFor="contact-email">
          <span className={labelCls}>{t.contact.mail}</span>
          <input required id="contact-email" name="email" maxLength={120} type="email" autoComplete="email" className={fieldCls} />
        </label>
        <PhoneCountryField
          id="contact-phone"
          label={t.contact.phone}
          lang={lang}
          searchPlaceholder={t.contact.phoneCountrySearch}
          numberPlaceholder={t.contact.phoneNumberHint}
          value={phone}
          onChange={setPhone}
          {...(phoneError ? { error: phoneError } : {})}
          required
        />
        <label htmlFor="contact-boats">
          <span className={labelCls}>{t.contact.boatsField}</span>
          <input
            required
            id="contact-boats"
            name="boatsCount"
            type="number"
            min={1}
            max={9999}
            step={1}
            inputMode="numeric"
            pattern="[0-9]*"
            dir="ltr"
            className={`${fieldCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          />
        </label>
        <label htmlFor="contact-address" className="sm:col-span-2">
          <span className={labelCls}>{t.contact.addressField}</span>
          <input
            required
            id="contact-address"
            name="address"
            maxLength={160}
            type="text"
            autoComplete="address-level2"
            placeholder={t.contact.addressHint}
            className={fieldCls}
          />
        </label>
        <label htmlFor="contact-content" className="sm:col-span-2">
          <span className={labelCls}>{t.contact.content}</span>
          <textarea
            required
            id="contact-content"
            name="content"
            maxLength={1000}
            rows={5}
            className={`${fieldCls} min-h-[8.5rem] resize-none`}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[#C8A96A]/15 pt-5">
        <Btn variant="gold" disabled={sending} className="min-w-[10.5rem]">
          {sending ? t.cta.sending : t.cta.send} <CtaArrow />
        </Btn>
        {sent ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-3.5 py-2 text-sm text-gold-ink">
            <BadgeCheck size={16} /> {t.cta.sent}
          </span>
        ) : null}
        {sendError ? <span className="text-sm text-destructive">{sendError}</span> : null}
      </div>
    </form>
  );
}
