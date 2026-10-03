import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSiteSettings } from "./db";
import { CONTACT, SERVICE_LOGIN_URLS, STORES } from "./site";
import {
  defaultSiteSettings,
  resolvedContact,
  type SiteSettings,
} from "./site-settings";

type SiteSettingsContextValue = {
  settings: SiteSettings;
  ready: boolean;
  refresh: () => Promise<void>;
  contact: ReturnType<typeof resolvedContact>;
  stores: typeof STORES;
  serviceLogins: typeof SERVICE_LOGIN_URLS;
};

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
        guests: {
          appStore: settings.apps.guestsAppStore || STORES.guests.appStore,
          playStore: settings.apps.guestsPlayStore || STORES.guests.playStore,
        },
        owners: {
          appStore: settings.apps.ownersAppStore || STORES.owners.appStore,
          playStore: settings.apps.ownersPlayStore || STORES.owners.playStore,
        },
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
      stores: STORES,
      serviceLogins: SERVICE_LOGIN_URLS,
    } satisfies SiteSettingsContextValue;
  }
  return ctx;
}

export { CONTACT };
