import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSiteSettings } from "./db";
import { CONTACT, SERVICE_LOGIN_URLS, STORES } from "./site";
import { defaultSiteSettings, resolvedContact, type SiteSettings } from "./site-settings";

type SiteSettingsContextValue = {
  settings: SiteSettings;
  ready: boolean;
  refresh: () => Promise<void>;
  contact: ReturnType<typeof resolvedContact>;
  stores: typeof STORES;
  serviceLogins: typeof SERVICE_LOGIN_URLS;
};

/** An app the super admin has not marked as published shows "Coming soon" even if its links are filled in. */
const NOT_LAUNCHED = { appStore: "", playStore: "" };

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings());
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    try {
      setSettings(await getSiteSettings());
    } catch {
      setSettings(defaultSiteSettings());
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      settings,
      ready,
      refresh,
      contact: resolvedContact(settings),
      stores: {
        guests: settings.apps.guestsLive
          ? {
              appStore: settings.apps.guestsAppStore || STORES.guests.appStore,
              playStore: settings.apps.guestsPlayStore || STORES.guests.playStore,
            }
          : NOT_LAUNCHED,
        owners: settings.apps.ownersLive
          ? {
              appStore: settings.apps.ownersAppStore || STORES.owners.appStore,
              playStore: settings.apps.ownersPlayStore || STORES.owners.playStore,
            }
          : NOT_LAUNCHED,
      },
      serviceLogins: {
        marinas: settings.apps.marinasLogin || SERVICE_LOGIN_URLS.marinas,
      },
    }),
    [settings, ready],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    const fallback = defaultSiteSettings();
    return {
      settings: fallback,
      ready: true,
      refresh: async () => {},
      contact: resolvedContact(fallback),
      stores: { guests: NOT_LAUNCHED, owners: NOT_LAUNCHED },
      serviceLogins: SERVICE_LOGIN_URLS,
    } satisfies SiteSettingsContextValue;
  }
  return ctx;
}

export { CONTACT };
