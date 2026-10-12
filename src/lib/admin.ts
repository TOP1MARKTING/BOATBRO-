export const SUPER_ADMIN_EMAILS = ["admin@boatpro.club"] as const;

export const ADMIN_EMAILS = [
  ...SUPER_ADMIN_EMAILS,
  "info@boatpro.club",
  ...String(import.meta.env["VITE_ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
];

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export function isSuperAdminEmail(email?: string | null) {
  const value = normalizeEmail(email);
  return value !== "" && SUPER_ADMIN_EMAILS.includes(value as (typeof SUPER_ADMIN_EMAILS)[number]);
}

export function isAdminEmail(email?: string | null) {
  const value = normalizeEmail(email);
  return value !== "" && ADMIN_EMAILS.includes(value);
}

export function slugify(title: string) {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return s || `post-${Date.now()}`;
}
