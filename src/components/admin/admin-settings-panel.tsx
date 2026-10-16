import { useEffect, useState, type FormEvent } from "react";
import { getSiteSettings, saveSiteSettings } from "../../lib/db";
import { SOCIAL_KEYS, defaultSiteSettings, type SiteSettingsInput } from "../../lib/site-settings";
import { AdminLicensesSection } from "./admin-licenses-section";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_FIELD_CLS,
  AdminFlash,
  AdminPanelShell,
  AdminSection,
} from "./shared";

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

function AppLaunchToggle({
  checked,
  dirty,
  missingStores,
  onChange,
  t,
}: {
  checked: boolean;
  dirty: boolean;
  missingStores: string[];
  onChange: (value: boolean) => void;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
}) {
  return (
    <div className="mb-4 space-y-2">
      <label
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] ${
          checked ? "border-gold/40 bg-gold/10" : "border-border bg-card"
        } cursor-pointer`}
      >
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-border accent-gold"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          <span className="block font-semibold text-navy">{t.admin.appLaunched}</span>
          <span className="mt-0.5 block text-muted-foreground">
            {checked ? t.admin.appLaunchedOn : t.admin.appLaunchedOff}
          </span>
        </span>
      </label>
      {checked
        ? missingStores.map((store) => (
            <AdminFlash key={store} tone="error">
              {t.admin.appLaunchMissingLink.replaceAll("{store}", store)}
            </AdminFlash>
          ))
        : null}
      {dirty ? (
        <p className="text-[12px] font-medium text-gold-ink">{t.admin.appLaunchSaveHint}</p>
      ) : null}
    </div>
  );
}

export function AdminSettingsPanel({
  uid,
  t,
  isSuperAdmin = false,
  onSaved,
}: {
  uid: string;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  isSuperAdmin?: boolean;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<SiteSettingsInput>(defaultSiteSettings());
  const [savedApps, setSavedApps] = useState(defaultSiteSettings().apps);
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
        setSavedApps(settings.apps);
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
      await saveSiteSettings(form, { canLaunchApps: isSuperAdmin });
      setSavedApps(form.apps);
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
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, contact: { ...prev.contact, email: value } }))
                }
              />
              <SettingsField
                label="Phone (display)"
                value={form.contact.phone}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, contact: { ...prev.contact, phone: value } }))
                }
              />
              <SettingsField
                label="WhatsApp link"
                value={form.contact.whatsapp}
                placeholder="https://wa.me/..."
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, contact: { ...prev.contact, whatsapp: value } }))
                }
              />
            </div>
          </AdminSection>

          <AdminSection title={t.admin.appLinks} hint={t.admin.appLinksHint}>
            <div className="space-y-4">
              {(
                [
                  [
                    "guests",
                    t.admin.settingGuestsApp,
                    "guestsAppStore",
                    "guestsPlayStore",
                    "guestsLive",
                  ],
                  [
                    "owners",
                    t.admin.settingOwnersApp,
                    "ownersAppStore",
                    "ownersPlayStore",
                    "ownersLive",
                  ],
                ] as const
              ).map(([key, title, appStoreKey, playStoreKey, liveKey]) => (
                <fieldset
                  key={key}
                  className="rounded-2xl border border-border bg-surface-2/60 p-4 sm:p-5"
                >
                  <legend className="px-1 font-display text-[14px] font-semibold text-navy">
                    {title}
                  </legend>
                  {isSuperAdmin ? (
                    <AppLaunchToggle
                      checked={form.apps[liveKey]}
                      dirty={form.apps[liveKey] !== savedApps[liveKey]}
                      missingStores={[
                        ...(form.apps[appStoreKey].trim() ? [] : ["App Store"]),
                        ...(form.apps[playStoreKey].trim() ? [] : ["Play Store"]),
                      ]}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, apps: { ...prev.apps, [liveKey]: value } }))
                      }
                      t={t}
                    />
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2">
                    <SettingsField
                      label="App Store"
                      value={form.apps[appStoreKey]}
                      placeholder="https://"
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          apps: { ...prev.apps, [appStoreKey]: value },
                        }))
                      }
                    />
                    <SettingsField
                      label="Play Store"
                      value={form.apps[playStoreKey]}
                      placeholder="https://"
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          apps: { ...prev.apps, [playStoreKey]: value },
                        }))
                      }
                    />
                  </div>
                </fieldset>
              ))}
              <fieldset className="rounded-2xl border border-border bg-surface-2/60 p-4 sm:p-5">
                <legend className="px-1 font-display text-[14px] font-semibold text-navy">
                  {t.admin.settingMarinasSite}
                </legend>
                <SettingsField
                  label={t.admin.settingMarinasLogin}
                  value={form.apps.marinasLogin}
                  placeholder="https://"
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, apps: { ...prev.apps, marinasLogin: value } }))
                  }
                />
              </fieldset>
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
