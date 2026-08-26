import { useState, type FormEvent } from "react";
import { BadgeCheck } from "lucide-react";
import { useAuth } from "../lib/auth";
import { saveContactRequest } from "../lib/db";
import { useLang } from "../lib/i18n";
import { isValidPhone } from "../lib/site";
import { Btn, CtaArrow } from "./ui";

const fieldCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none transition-colors focus:border-gold";

export function ContactForm() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [roleId, setRoleId] = useState(t.contact.roles[0]?.id ?? "guest");
  const fallbackRole = { id: "guest", label: "ضيف", needsAddress: false };
  const role = t.contact.roles.find((r) => r.id === roleId) ?? t.contact.roles[0] ?? fallbackRole;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(false);
    setSendError("");
    setPhoneError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const phone = String(fd.get("phone") ?? "").trim();
    if (!isValidPhone(phone)) {
      setPhoneError(t.contact.phoneInvalid);
      return;
    }
    setSending(true);
    try {
      await saveContactRequest({
        userType: role.label,
        name: String(fd.get("name") ?? "").trim(),
        phone,
        email: String(fd.get("email") ?? "").trim(),
        address: String(fd.get("address") ?? "").trim(),
        content: String(fd.get("content") ?? "").trim(),
        lang,
        uid: user?.uid ?? null,
      });
      setSent(true);
      form.reset();
      setRoleId(t.contact.roles[0]?.id ?? "guest");
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
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-5 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className="mb-3 text-[13px] font-medium text-gold-ink">{t.contact.userType}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.contact.userType}>
          {t.contact.roles.map((r) => {
            const active = roleId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRoleId(r.id)}
                className={
                  active
                    ? "inline-flex min-h-10 items-center rounded-full border border-navy bg-navy-deep px-4 text-[13px] font-medium text-white"
                    : "inline-flex min-h-10 items-center rounded-full border border-border bg-background px-4 text-[13px] font-medium text-navy transition-colors hover:border-gold hover:text-gold"
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label htmlFor="contact-name">
        <span className="mb-2 block text-[13px] font-medium text-gold-ink">{t.contact.name}</span>
        <input required id="contact-name" name="name" maxLength={120} type="text" autoComplete="name" className={fieldCls} />
      </label>
      <label htmlFor="contact-phone">
        <span className="mb-2 block text-[13px] font-medium text-gold-ink">{t.contact.phone}</span>
        <input
          required
          id="contact-phone"
          name="phone"
          maxLength={40}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={phoneError ? true : undefined}
          aria-describedby={phoneError ? "contact-phone-error" : undefined}
          className={fieldCls}
        />
        {phoneError && (
          <p id="contact-phone-error" className="mt-2 text-sm text-destructive" role="alert">
            {phoneError}
          </p>
        )}
      </label>
      <label htmlFor="contact-email" className={role.needsAddress ? "" : "sm:col-span-2"}>
        <span className="mb-2 block text-[13px] font-medium text-gold-ink">{t.contact.mail}</span>
        <input required id="contact-email" name="email" maxLength={120} type="email" autoComplete="email" className={fieldCls} />
      </label>
      {role.needsAddress && (
        <label htmlFor="contact-address">
          <span className="mb-2 block text-[13px] font-medium text-gold-ink">{t.contact.addressField}</span>
          <input required id="contact-address" name="address" maxLength={160} type="text" autoComplete="street-address" className={fieldCls} />
        </label>
      )}
      {!role.needsAddress && (
        <p className="sm:col-span-2 text-[12px] text-muted-foreground">{t.contact.addressHint}</p>
      )}
      <label htmlFor="contact-content" className="sm:col-span-2">
        <span className="mb-2 block text-[13px] font-medium text-gold-ink">{t.contact.content}</span>
        <textarea
          required
          id="contact-content"
          name="content"
          maxLength={1000}
          rows={5}
          className={`${fieldCls} resize-none`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Btn variant="gold" disabled={sending}>
          {sending ? t.cta.sending : t.cta.send} <CtaArrow />
        </Btn>
        {sent && (
          <span className="flex items-center gap-2 text-sm text-gold-ink">
            <BadgeCheck size={16} /> {t.cta.sent}
          </span>
        )}
        {sendError && <span className="text-sm text-destructive">{sendError}</span>}
      </div>
    </form>
  );
}
