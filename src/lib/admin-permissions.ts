export type StaffRole = "user" | "editor" | "moderator" | "admin";

export type AdminTab =
  "overview" | "posts" | "gallery" | "content" | "contacts" | "users" | "settings" | "profile";

export type AdminPermissions = Record<AdminTab, boolean>;

export const ADMIN_TAB_ORDER: AdminTab[] = [
  "overview",
  "posts",
  "gallery",
  "content",
  "contacts",
  "users",
  "settings",
  "profile",
];

/** Tabs the super admin can toggle per user. */
export const ASSIGNABLE_TABS: AdminTab[] = ADMIN_TAB_ORDER;

export const EMPTY_PERMISSIONS: AdminPermissions = {
  overview: false,
  posts: false,
  gallery: false,
  content: false,
  contacts: false,
  users: false,
  settings: false,
  profile: false,
};

export const FULL_PERMISSIONS: AdminPermissions = {
  overview: true,
  posts: true,
  gallery: true,
  content: true,
  contacts: true,
  users: true,
  settings: true,
  profile: true,
};

/** Legacy presets — used when migrating old accounts without a permissions map. */
const ROLE_PRESETS: Record<StaffRole, AdminPermissions> = {
  user: { ...EMPTY_PERMISSIONS },
  editor: {
    ...EMPTY_PERMISSIONS,
    overview: true,
    posts: true,
    gallery: true,
    content: true,
    profile: true,
  },
  moderator: { ...EMPTY_PERMISSIONS, overview: true, contacts: true, profile: true },
  admin: { ...FULL_PERMISSIONS },
};

export function normalizeStaffRole(value: unknown, legacyRole?: "admin" | "user"): StaffRole {
  if (value === "editor" || value === "moderator" || value === "admin") return value;
  if (legacyRole === "admin") return "admin";
  return "user";
}

function readPermissionFlag(raw: unknown): boolean {
  return raw === true;
}

export function parsePermissions(
  data: Record<string, unknown> | null | undefined,
  adminRole?: StaffRole,
  role?: "admin" | "user",
): AdminPermissions {
  const stored = data?.["permissions"];
  if (stored && typeof stored === "object") {
    const row = stored as Record<string, unknown>;
    return {
      overview: readPermissionFlag(row["overview"]),
      posts: readPermissionFlag(row["posts"]),
      gallery: readPermissionFlag(row["gallery"]),
      content: readPermissionFlag(row["content"]),
      contacts: readPermissionFlag(row["contacts"]),
      users: readPermissionFlag(row["users"]),
      settings: readPermissionFlag(row["settings"]),
      profile: readPermissionFlag(row["profile"]),
    };
  }
  const legacyRole = adminRole ?? normalizeStaffRole(data?.["adminRole"], role);
  if (legacyRole !== "user") return { ...ROLE_PRESETS[legacyRole] };
  if (role === "admin") return { ...ROLE_PRESETS.admin };
  return { ...EMPTY_PERMISSIONS };
}

export function hasAnyPermission(permissions: AdminPermissions) {
  return ADMIN_TAB_ORDER.some((tab) => permissions[tab]);
}

/** Staff always need profile when they have any other admin section. */
export function normalizeStaffPermissions(permissions: AdminPermissions): AdminPermissions {
  const next = { ...permissions };
  if (ADMIN_TAB_ORDER.some((tab) => tab !== "profile" && next[tab])) {
    next.profile = true;
  }
  return next;
}

export function permissionsSummary(
  permissions: AdminPermissions,
  labels: Record<AdminTab, string>,
) {
  return ADMIN_TAB_ORDER.filter((tab) => permissions[tab]).map((tab) => labels[tab]);
}

export function resolvePermissions(
  email: string | null | undefined,
  stored: AdminPermissions | null | undefined,
  active: boolean,
  isSuperAdmin: boolean,
  isWhitelistedAdmin: boolean,
): AdminPermissions {
  if (isSuperAdmin || isWhitelistedAdmin) return { ...FULL_PERMISSIONS };
  if (!active) return { ...EMPTY_PERMISSIONS };
  return stored ? { ...stored } : { ...EMPTY_PERMISSIONS };
}

export function canAccessAdmin(
  permissions: AdminPermissions,
  active: boolean,
  isSuperAdmin: boolean,
  isWhitelistedAdmin: boolean,
) {
  if (isSuperAdmin || isWhitelistedAdmin) return true;
  return active && hasAnyPermission(permissions);
}

export function canManageUsers(isSuperAdmin: boolean, permissions?: AdminPermissions | null) {
  return isSuperAdmin || permissions?.users === true;
}

/** Tabs a staff user-manager may assign (cannot escalate to users/settings). */
export function assignableTabsFor(isSuperAdmin: boolean): AdminTab[] {
  if (isSuperAdmin) return ASSIGNABLE_TABS;
  return ASSIGNABLE_TABS.filter((tab) => tab !== "users" && tab !== "settings");
}

/** Strip privilege-escalation flags when a non-super manager assigns access. */
export function sanitizeAssignablePermissions(
  permissions: AdminPermissions,
  isSuperAdmin: boolean,
): AdminPermissions {
  const next = normalizeStaffPermissions(permissions);
  if (!isSuperAdmin) {
    next.users = false;
    next.settings = false;
  }
  return next;
}

export function canEditUserAccess(
  canManage: boolean,
  targetIsSuper: boolean,
  isSelf: boolean,
  options?: {
    isSuperAdmin?: boolean;
    targetPermissions?: AdminPermissions | null;
  },
) {
  if (!canManage) return false;
  if (isSelf || targetIsSuper) return false;
  if (
    !options?.isSuperAdmin &&
    (options?.targetPermissions?.users === true || options?.targetPermissions?.settings === true)
  ) {
    return false;
  }
  return true;
}

export function firstAllowedTab(permissions: AdminPermissions): AdminTab {
  return ADMIN_TAB_ORDER.find((tab) => permissions[tab]) ?? "profile";
}

export function staffRoleFromPermissions(permissions: AdminPermissions): StaffRole {
  if (!hasAnyPermission(permissions)) return "user";
  if (permissions.users) return "admin";
  if (permissions.posts || permissions.gallery) return "editor";
  if (permissions.contacts) return "moderator";
  return "editor";
}

export function accessFromPermissions(permissions: AdminPermissions, active = true) {
  const normalized = normalizeStaffPermissions(permissions);
  const staff = active && hasAnyPermission(normalized);
  return {
    permissions: normalized,
    active: staff ? active : false,
    role: staff ? ("admin" as const) : ("user" as const),
    adminRole: staffRoleFromPermissions(normalized),
  };
}
