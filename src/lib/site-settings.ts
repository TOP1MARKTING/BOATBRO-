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
    guestsAppStore: string;
    guestsPlayStore: string;
    ownersAppStore: string;
    ownersPlayStore: string;
    marinasLogin: string;
    /** Set by the super admin once the app is published; until then its store buttons show "Coming soon". */
    guestsLive: boolean;
    ownersLive: boolean;
  };
};

export const APP_LAUNCH_KEYS = ["guestsLive", "ownersLive"] as const;

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
      guestsAppStore: STORES.guests.appStore,
      guestsPlayStore: STORES.guests.playStore,
      ownersAppStore: STORES.owners.appStore,
      ownersPlayStore: STORES.owners.playStore,
      marinasLogin: SERVICE_LOGIN_URLS.marinas,
      guestsLive: false,
      ownersLive: false,
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
      guestsAppStore: normalizeExternalUrl(input.apps.guestsAppStore),
      guestsPlayStore: normalizeExternalUrl(input.apps.guestsPlayStore),
      ownersAppStore: normalizeExternalUrl(input.apps.ownersAppStore),
      ownersPlayStore: normalizeExternalUrl(input.apps.ownersPlayStore),
      marinasLogin: normalizeExternalUrl(input.apps.marinasLogin),
      guestsLive: input.apps.guestsLive === true,
      ownersLive: input.apps.ownersLive === true,
    },
  };
}

export function mapSiteSettings(data: Record<string, unknown> | null | undefined): SiteSettings {
  const base = defaultSiteSettings();
  if (!data) return base;

  const social =
    data["social"] && typeof data["social"] === "object"
      ? (data["social"] as Record<string, unknown>)
      : {};
  const contact =
    data["contact"] && typeof data["contact"] === "object"
      ? (data["contact"] as Record<string, unknown>)
      : {};
  const apps =
    data["apps"] && typeof data["apps"] === "object"
      ? (data["apps"] as Record<string, unknown>)
      : {};

  return {
    social: {
      instagram: String(social["instagram"] ?? base.social.instagram),
      linkedin: String(social["linkedin"] ?? base.social.linkedin),
      tiktok: String(social["tiktok"] ?? base.social.tiktok),
      x: String(social["x"] ?? base.social.x),
    },
    contact: {
      email: String(contact["email"] ?? base.contact.email),
      phone: String(contact["phone"] ?? base.contact.phone),
      whatsapp: String(contact["whatsapp"] ?? base.contact.whatsapp),
    },
    apps: {
      guestsAppStore: String(
        apps["guestsAppStore"] ?? apps["appStore"] ?? base.apps.guestsAppStore,
      ),
      guestsPlayStore: String(
        apps["guestsPlayStore"] ?? apps["playStore"] ?? base.apps.guestsPlayStore,
      ),
      ownersAppStore: String(apps["ownersAppStore"] ?? base.apps.ownersAppStore),
      ownersPlayStore: String(apps["ownersPlayStore"] ?? base.apps.ownersPlayStore),
      marinasLogin: String(apps["marinasLogin"] ?? base.apps.marinasLogin),
      guestsLive: apps["guestsLive"] === true,
      ownersLive: apps["ownersLive"] === true,
    },
    updatedAt:
      data["updatedAt"] &&
      typeof (data["updatedAt"] as { toDate?: () => Date }).toDate === "function"
        ? (data["updatedAt"] as { toDate: () => Date }).toDate()
        : data["updatedAt"] instanceof Date
          ? data["updatedAt"]
          : null,
  };
}

function phoneToTel(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return CONTACT.tel;
  if (trimmed.startsWith("tel:")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return CONTACT.tel;
  if (digits.startsWith("966")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+966${digits.slice(1)}`;
  return `tel:+${digits}`;
}

export function resolvedContact(settings: SiteSettings) {
  const email = settings.contact.email.trim() || CONTACT.email;
  const phone = settings.contact.phone.trim() || CONTACT.phoneDisplay;
  const whatsapp = settings.contact.whatsapp.trim() || CONTACT.whatsapp;
  return {
    email,
    mailto: `mailto:${email}`,
    phoneDisplay: phone,
    tel: phoneToTel(phone),
    whatsapp,
  };
}

/** E.164-style telephone string for JSON-LD from a display phone. */
export function jsonLdTelephone(phoneDisplay: string): string {
  const digits = phoneDisplay.replace(/\D/g, "");
  if (!digits) return "+966502554747";
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("0")) return `+966${digits.slice(1)}`;
  return `+${digits}`;
}

export function activeSocialLinks(social: SocialLinks) {
  return SOCIAL_KEYS.filter((key) => Boolean(social[key]?.trim()));
}
