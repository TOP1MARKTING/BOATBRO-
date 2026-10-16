import type { Dictionary } from "./copy";

/** Stable contact request type stored in Firestore (language-independent). */
export const OWNER_INTEREST_TYPE = "owner-interest";

export function localizeContactUserType(userType: string, t: Dictionary) {
  const raw = userType.trim();
  const ownerInterestLabel = `${t.contact.partnerType} — ${t.contact.formAudience}`;

  if (
    !raw ||
    raw === OWNER_INTEREST_TYPE ||
    raw.includes("انضم للمهتمين") ||
    raw.includes("Join the interested") ||
    raw.includes("لأصحاب القوارب واليخوت فقط") ||
    raw.includes("For boat and yacht owners only") ||
    raw.includes("طلب شراكة")
  ) {
    return ownerInterestLabel;
  }

  return raw;
}
