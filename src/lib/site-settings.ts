import { CONTACT, SERVICE_LOGIN_URLS, STORES } from "./site";

export type SocialLinks = {
  instagram: string;
  linkedin: string;
  tiktok: string;
  x: string;
};

export type SiteSettingsInput = {
  social: SocialLinks;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
  };
  apps: {
    appStore: string;
    playStore: string;
    guestsLogin: string;
    marinasLogin: string;
  };
};

export type SiteSettings = SiteSettingsInput & {
  updatedAt: Date | null;
};

export const SOCIAL_KEYS = ["instagram", "linkedin", "tiktok", "x"] as const;

export function defaultSiteSettings(): SiteSettings {
  return {
    social: {
      instagram: "",
      linkedin: "",
      tiktok: "",
      x: "",
    },
    contact: {
      email: CONTACT.email,
      phone: CONTACT.phoneDisplay,
      whatsapp: CONTACT.whatsapp,
    },
    apps: {
      appStore: STORES.appStore,
      playStore: STORES.playStore,
      guestsLogin: SERVICE_LOGIN_URLS.guests,
      marinasLogin: SERVICE_LOGIN_URLS.marinas,
    },
    updatedAt: null,
  };
}

export function normalizeExternalUrl(raw: string) {
  const trimmed = raw.trim().replace(/^\/+/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed.slice(0, 500);
  return `https://${trimmed}`.slice(0, 500);
}

export function normalizeSiteSettingsInput(input: SiteSettingsInput): SiteSettingsInput {
  return {
    social: {
      instagram: normalizeExternalUrl(input.social.instagram),
      linkedin: normalizeExternalUrl(input.social.linkedin),
      tiktok: normalizeExternalUrl(input.social.tiktok),
      x: normalizeExternalUrl(input.social.x),
    },
    contact: {
      email: input.contact.email.trim().slice(0, 120),
      phone: input.contact.phone.trim().slice(0, 40),
      whatsapp: normalizeExternalUrl(input.contact.whatsapp),
    },
    apps: {
      appStore: normalizeExternalUrl(input.apps.appStore),
      playStore: normalizeExternalUrl(input.apps.playStore),
      guestsLogin: normalizeExternalUrl(input.apps.guestsLogin),
      marinasLogin: normalizeExternalUrl(input.apps.marinasLogin),
    },
  };
}

export function mapSiteSettings(data: Record<string, unknown> | null | undefined): SiteSettings {
  const base = defaultSiteSettings();
  if (!data) return base;

  const social = data.social && typeof data.social === "object" ? (data.social as Record<string, unknown>) : {};
  const contact = data.contact && typeof data.contact === "object" ? (data.contact as Record<string, unknown>) : {};
  const apps = data.apps && typeof data.apps === "object" ? (data.apps as Record<string, unknown>) : {};

  return {
    social: {
      instagram: String(social.instagram ?? base.social.instagram),
      linkedin: String(social.linkedin ?? base.social.linkedin),
      tiktok: String(social.tiktok ?? base.social.tiktok),
      x: String(social.x ?? base.social.x),
    },
    contact: {
      email: String(contact.email ?? base.contact.email),
      phone: String(contact.phone ?? base.contact.phone),
      whatsapp: String(contact.whatsapp ?? base.contact.whatsapp),
    },
    apps: {
      appStore: String(apps.appStore ?? base.apps.appStore),
      playStore: String(apps.playStore ?? base.apps.playStore),
      guestsLogin: String(apps.guestsLogin ?? base.apps.guestsLogin),
      marinasLogin: String(apps.marinasLogin ?? base.apps.marinasLogin),
    },
    updatedAt: data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
      ? (data.updatedAt as { toDate: () => Date }).toDate()
      : data.updatedAt instanceof Date
        ? data.updatedAt
        : null,
  };
}

export function resolvedContact(settings: SiteSettings) {
  const email = settings.contact.email || CONTACT.email;
  const phone = settings.contact.phone || CONTACT.phoneDisplay;
  const whatsapp = settings.contact.whatsapp || CONTACT.whatsapp;
  const tel = phone === CONTACT.phoneDisplay ? CONTACT.tel : phone.startsWith("tel:") ? phone : CONTACT.tel;
  return {
    email,
    mailto: `mailto:${email}`,
    phoneDisplay: phone,
    tel,
    whatsapp,
  };
}

export function activeSocialLinks(social: SocialLinks) {
  return SOCIAL_KEYS.filter((key) => Boolean(social[key]?.trim()));
}
