import { useEffect, useState, type FormEvent } from "react";
import { getSiteSettings, saveSiteSettings } from "../../lib/db";
import { SOCIAL_KEYS, defaultSiteSettings, type SiteSettingsInput } from "../../lib/site-settings";
import { AdminLicensesSection } from "./admin-licenses-section";
import { ADMIN_BTN_PRIMARY, ADMIN_FIELD_CLS, AdminFlash, AdminPanelShell, AdminSection } from "./shared";

function SettingsField({
  label,
  value,
  onChange,
  dir = "ltr",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "ltr" | "rtl";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      <input
        dir={dir}
        className={ADMIN_FIELD_CLS}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function AdminSettingsPanel({
  uid,
  t,
  onSaved,
}: {
  uid: string;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<SiteSettingsInput>(defaultSiteSettings());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void getSiteSettings()
      .then((settings) => {
        setForm({
          social: settings.social,
          contact: settings.contact,
          apps: settings.apps,
        });
      })
      .catch(() => setForm(defaultSiteSettings()))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveSiteSettings(form);
      setMessage(t.admin.settingsSaved);
      onSaved?.();
    } catch {
      setError(t.admin.error);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AdminPanelShell title={t.admin.settings}>
        <div className="h-48 animate-pulse rounded-2xl bg-card/80" />
      </AdminPanelShell>
    );
  }

  const socialLabels: Record<(typeof SOCIAL_KEYS)[number], string> = {
    instagram: "Instagram",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    x: "X",
  };

  return (
    <AdminPanelShell title={t.admin.settings}>
      <div className="space-y-6">
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
          <AdminSection title={t.admin.socialLinks} hint={t.admin.socialLinksHint}>
            <div className="grid gap-4">
              {SOCIAL_KEYS.map((key) => (
                <SettingsField
                  key={key}
                  label={socialLabels[key]}
                  value={form.social[key]}
                  placeholder="https://"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      social: { ...prev.social, [key]: value },
                    }))
                  }
                />
              ))}
            </div>
          </AdminSection>

          <AdminSection title={t.admin.contactSettings} hint={t.admin.contactSettingsHint}>
            <div className="grid gap-4 md:grid-cols-2">
              <SettingsField
                label="Email"
                value={form.contact.email}
                onChange={(value) => setForm((prev) => ({ ...prev, contact: { ...prev.contact, email: value } }))}
              />
              <SettingsField
                label="Phone (display)"
                value={form.contact.phone}
                onChange={(value) => setForm((prev) => ({ ...prev, contact: { ...prev.contact, phone: value } }))}
              />
              <SettingsField
                label="WhatsApp link"
                value={form.contact.whatsapp}
                placeholder="https://wa.me/..."
                onChange={(value) => setForm((prev) => ({ ...prev, contact: { ...prev.contact, whatsapp: value } }))}
              />
            </div>
          </AdminSection>

          <AdminSection title={t.admin.appLinks} hint={t.admin.appLinksHint}>
            <div className="grid gap-4 md:grid-cols-2">
              <SettingsField
                label="App Store"
                value={form.apps.appStore}
                placeholder="https://"
                onChange={(value) => setForm((prev) => ({ ...prev, apps: { ...prev.apps, appStore: value } }))}
              />
              <SettingsField
                label="Play Store"
                value={form.apps.playStore}
                placeholder="https://"
                onChange={(value) => setForm((prev) => ({ ...prev, apps: { ...prev.apps, playStore: value } }))}
              />
              <SettingsField
                label={t.admin.settingGuestsLogin}
                value={form.apps.guestsLogin}
                placeholder="https://"
                onChange={(value) => setForm((prev) => ({ ...prev, apps: { ...prev.apps, guestsLogin: value } }))}
              />
              <SettingsField
                label={t.admin.settingMarinasLogin}
                value={form.apps.marinasLogin}
                placeholder="https://"
                onChange={(value) => setForm((prev) => ({ ...prev, apps: { ...prev.apps, marinasLogin: value } }))}
              />
            </div>
          </AdminSection>

          {error ? <AdminFlash tone="error">{error}</AdminFlash> : null}
          {message ? <AdminFlash tone="ok">{message}</AdminFlash> : null}

          <button type="submit" disabled={busy} className={ADMIN_BTN_PRIMARY}>
            {busy ? t.admin.loading : t.admin.save}
          </button>
        </form>

        <AdminLicensesSection uid={uid} t={t} />
      </div>
    </AdminPanelShell>
  );
}
