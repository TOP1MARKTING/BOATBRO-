import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createStaffUser,
  deleteUserProfile,
  listUserCredentials,
  resetStaffUserPassword,
  setUserAccess,
  type UserRecord,
} from "../../lib/db";
import {
  EMPTY_PERMISSIONS,
  ADMIN_TAB_ORDER,
  assignableTabsFor,
  canEditUserAccess,
  sanitizeAssignablePermissions,
  type AdminPermissions,
  type AdminTab,
} from "../../lib/admin-permissions";
import { isSuperAdminEmail } from "../../lib/admin";
import { mapAuthError } from "../../lib/auth";
import {
  ADMIN_BADGE_ACTIVE,
  ADMIN_BADGE_MUTED,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD_CLS,
  ADMIN_FIELD_CLS,
  AdminEmptyState,
  AdminFlash,
  AdminPanelShell,
  AdminSection,
} from "./shared";
import { AdminPermissionsPicker } from "./admin-permissions-picker";

function permissionLabels(t: ReturnType<typeof import("../../lib/i18n").useLang>["t"]): Record<AdminTab, string> {
  return {
    overview: t.admin.overview,
    posts: t.admin.posts,
    gallery: t.admin.gallery,
    content: t.admin.content,
    contacts: t.admin.contacts,
    users: t.admin.users,
    settings: t.admin.settings,
    profile: t.admin.profile,
  };
}

function defaultNewUserPermissions(): AdminPermissions {
  return { ...EMPTY_PERMISSIONS, overview: true, posts: true, profile: true };
}

function UserAccessCard({
  user,
  labels,
  storedPassword,
  superAdmin,
  editable,
  isEditing,
  canDelete,
  assignableTabs,
  showPasswordTools,
  busy,
  t,
  onEdit,
  onCancelEdit,
  onDelete,
  editPermissions,
  setEditPermissions,
  editActive,
  setEditActive,
  editPassword,
  setEditPassword,
  onSave,
}: {
  user: UserRecord;
  labels: Record<AdminTab, string>;
  storedPassword?: string;
  superAdmin: boolean;
  editable: boolean;
  isEditing: boolean;
  canDelete: boolean;
  assignableTabs: readonly AdminTab[];
  showPasswordTools: boolean;
  busy: boolean;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  editPermissions: AdminPermissions;
  setEditPermissions: (next: AdminPermissions) => void;
  editActive: boolean;
  setEditActive: (next: boolean) => void;
  editPassword: string;
  setEditPassword: (next: string) => void;
  onSave: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  const activePerms = ADMIN_TAB_ORDER.filter((tab) => user.permissions[tab]).map((tab) => labels[tab]);
  const passwordValue = storedPassword || t.admin.passwordUnknown;

  const statusCls = !user.active
    ? "bg-destructive/10 text-destructive"
    : superAdmin
      ? "bg-navy-deep text-white"
      : user.role === "admin"
        ? ADMIN_BADGE_ACTIVE
        : ADMIN_BADGE_MUTED;

  const statusLabel = !user.active
    ? t.admin.inactiveAccount
    : superAdmin
      ? t.admin.superAdmin
      : t.admin.roleStaff;

  return (
    <article className={`overflow-hidden ${ADMIN_CARD_CLS}`}>
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-[15px] font-semibold text-gold-ink">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-lg font-semibold text-navy">{user.name || user.email || "—"}</h4>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
            {user.email ? (
              <p className="mt-1 truncate text-[13px] text-muted-foreground" dir="ltr">
                {user.email}
              </p>
            ) : null}

            {!superAdmin && activePerms.length > 0 ? (
              <div className="mt-3">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-gold-ink uppercase">
                  {t.admin.permissionsLabel}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activePerms.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-gold/25 bg-gold/5 px-2.5 py-1 text-[11px] font-medium text-gold-ink"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : superAdmin ? (
              <p className="mt-2 text-[12px] text-muted-foreground">{t.admin.superAdmin}</p>
            ) : null}

            {!superAdmin && showPasswordTools ? (
              <div className="mt-4 rounded-xl border border-gold/18 bg-surface-2/60 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {t.auth.password}
                  </p>
                  {storedPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gold-ink hover:underline"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showPassword ? t.admin.hidePassword : t.admin.showPassword}
                    </button>
                  ) : null}
                </div>
                <p className="mt-1.5 font-mono text-[13px] text-navy" dir="ltr">
                  {showPassword || !storedPassword ? passwordValue : "••••••••"}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {editable ? (
            <button
              type="button"
              onClick={() => (isEditing ? onCancelEdit() : onEdit())}
              className={ADMIN_BTN_SECONDARY}
            >
              {isEditing ? t.admin.cancel : t.admin.editAccess}
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" onClick={onDelete} className={ADMIN_BTN_GHOST}>
              <Trash2 size={13} />
              {t.admin.delete}
            </button>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="border-t border-border bg-surface-2/40 px-5 py-5">
          <AdminPermissionsPicker
            value={editPermissions}
            onChange={setEditPermissions}
            labels={labels}
            hint={t.admin.permissionsPickerHint}
            tabs={assignableTabs}
          />

          {showPasswordTools ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.currentPassword}</span>
                <input
                  readOnly
                  dir="ltr"
                  className={`${ADMIN_FIELD_CLS} bg-muted/50 font-mono`}
                  value={storedPassword || t.admin.passwordUnknown}
                />
              </label>
              <label>
                <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.newPassword}</span>
                <input
                  type="text"
                  dir="ltr"
                  minLength={6}
                  autoComplete="new-password"
                  placeholder={t.admin.newPasswordHint}
                  className={`${ADMIN_FIELD_CLS} font-mono`}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </label>
            </div>
          ) : null}

          <label className="mt-5 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-gold/25 bg-card px-4 py-3 text-[13px]">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-gold"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
            />
            <span className="font-medium text-navy">{t.admin.activeAccount}</span>
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" disabled={busy} onClick={onSave} className={ADMIN_BTN_PRIMARY}>
              {busy ? t.admin.loading : t.admin.save}
            </button>
            <button type="button" onClick={onCancelEdit} className={ADMIN_BTN_SECONDARY}>
              {t.admin.cancel}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function AdminUsersPanel({
  users,
  currentUid,
  isSuperAdmin,
  canManageUsersAccess,
  onChange,
  t,
  lang,
}: {
  users: UserRecord[];
  currentUid: string;
  isSuperAdmin: boolean;
  canManageUsersAccess: boolean;
  onChange: () => Promise<void>;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  lang: "ar" | "en";
}) {
  const labels = useMemo(() => permissionLabels(t), [t]);
  const assignableTabs = useMemo(() => assignableTabsFor(isSuperAdmin), [isSuperAdmin]);
  const visibleUsers = useMemo(
    () => (isSuperAdmin ? users : users.filter((u) => !isSuperAdminEmail(u.email))),
    [users, isSuperAdmin],
  );
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPermissions, setNewPermissions] = useState<AdminPermissions>(defaultNewUserPermissions);
  const [newActive, setNewActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermissions>(EMPTY_PERMISSIONS);
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canManage = canManageUsersAccess;

  const loadCredentials = async () => {
    if (!isSuperAdmin) return;
    try {
      setCredentials(await listUserCredentials());
    } catch {
      setCredentials({});
    }
  };

  useEffect(() => {
    void loadCredentials();
  }, [isSuperAdmin]);

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setEditPermissions(sanitizeAssignablePermissions({ ...user.permissions }, isSuperAdmin));
    setEditActive(user.active);
    setEditPassword("");
    setError("");
    setMessage("");
  };

  const mapPasswordError = (code: string) => {
    if (code === "missing-service-account" || code === "password-reset-failed") return t.admin.passwordServerOff;
    if (code === "weak-password" || code === "auth/weak-password") return mapAuthError("auth/weak-password", lang);
    return t.admin.error;
  };

  const onCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const email = newEmail.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === email)) {
        setError(t.admin.emailExists);
        return;
      }
      if (isSuperAdminEmail(email)) {
        setError(t.admin.emailReserved);
        return;
      }
      await createStaffUser({
        name: newName,
        email,
        password: newPassword,
        permissions: sanitizeAssignablePermissions(newPermissions, isSuperAdmin),
        active: newActive,
      });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewPermissions(defaultNewUserPermissions());
      setNewActive(true);
      setMessage(t.admin.userCreated);
      await Promise.all([onChange(), loadCredentials()]);
    } catch (err) {
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code: string }).code)
          : err instanceof Error
            ? err.message
            : "";
      if (code === "auth/email-already-in-use") {
        setError(t.admin.emailInUse);
      } else if (code === "weak-password" || code === "auth/weak-password") {
        setError(mapAuthError("auth/weak-password", lang));
      } else if (code === "invalid-email" || code === "auth/invalid-email") {
        setError(mapAuthError("auth/invalid-email", lang));
      } else {
        setError(t.admin.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const onSaveAccess = async (user: UserRecord) => {
    if (!canEditUserAccess(canManage, isSuperAdminEmail(user.email), user.id === currentUid, {
      isSuperAdmin,
      targetPermissions: user.permissions,
    })) {
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await setUserAccess(user.id, {
        permissions: sanitizeAssignablePermissions(editPermissions, isSuperAdmin),
        active: editActive,
      });
      if (editPassword.trim()) {
        if (!isSuperAdmin) {
          setError(t.admin.passwordServerOff);
          return;
        }
        await resetStaffUserPassword(user.id, editPassword.trim());
      }
      setEditingId(null);
      setEditPassword("");
      setMessage(editPassword.trim() ? t.admin.passwordUpdated : t.admin.saved);
      await Promise.all([onChange(), loadCredentials()]);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(mapPasswordError(code));
    } finally {
      setBusy(false);
    }
  };

  const onDeleteUser = async (user: UserRecord) => {
    if (!canManage || isSuperAdminEmail(user.email) || user.id === currentUid) return;
    if (
      !isSuperAdmin &&
      (user.permissions.users || user.permissions.settings)
    ) {
      return;
    }
    if (!confirm(t.admin.confirmDeleteUser)) return;
    try {
      await deleteUserProfile(user.id);
      if (editingId === user.id) setEditingId(null);
      setMessage(t.admin.userDeleted);
      await Promise.all([onChange(), loadCredentials()]);
    } catch {
      setError(t.admin.error);
    }
  };

  if (!canManage) {
    return (
      <AdminPanelShell title={t.admin.users} hideTitle>
        <p className={`${ADMIN_CARD_CLS} px-4 py-3 text-sm text-muted-foreground`}>{t.admin.roleDenied}</p>
      </AdminPanelShell>
    );
  }

  return (
    <AdminPanelShell title={t.admin.users} hideTitle>
      <div className="space-y-6">
        <AdminSection title={t.admin.permissionsTitle} hint={t.admin.permissionsHint}>
          <p className="text-[13px] leading-7 text-muted-foreground">{t.admin.permissionsGuide}</p>
        </AdminSection>

        <section className={`${ADMIN_CARD_CLS} p-5 sm:p-6`}>
          <h3 className="font-display text-lg font-semibold text-navy">{t.admin.addUser}</h3>
          <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{t.admin.addUserHint}</p>
          <form onSubmit={(e) => void onCreateUser(e)} className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.inviteName}</span>
                <input required className={ADMIN_FIELD_CLS} value={newName} onChange={(e) => setNewName(e.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-[12px] font-medium text-navy">{t.auth.email}</span>
                <input required type="email" dir="ltr" className={ADMIN_FIELD_CLS} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-[12px] font-medium text-navy">{t.auth.password}</span>
                <input
                  required
                  type="text"
                  dir="ltr"
                  minLength={6}
                  autoComplete="new-password"
                  className={`${ADMIN_FIELD_CLS} font-mono`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
            </div>

            <div>
              <p className="mb-3 text-[12px] font-medium text-navy">{t.admin.permissionsTitle}</p>
              <AdminPermissionsPicker
                value={newPermissions}
                onChange={setNewPermissions}
                labels={labels}
                hint={t.admin.permissionsPickerHint}
                tabs={assignableTabs}
              />
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-gold/25 bg-surface-2/60 px-4 py-3 text-[13px]">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-gold"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
              />
              <span className="font-medium text-navy">{t.admin.activeAccount}</span>
            </label>

            <button type="submit" disabled={busy} className={ADMIN_BTN_PRIMARY}>
              {busy ? t.admin.loading : t.admin.createUser}
            </button>
          </form>
        </section>

        {error ? <AdminFlash tone="error">{error}</AdminFlash> : null}
        {message ? <AdminFlash tone="ok">{message}</AdminFlash> : null}

        <div className="space-y-4">
          {visibleUsers.length === 0 ? (
            <AdminEmptyState message={t.admin.noUsers} />
          ) : (
            visibleUsers.map((u) => (
              <UserAccessCard
                key={u.id}
                user={u}
                labels={labels}
                {...(credentials[u.id] ? { storedPassword: credentials[u.id] } : {})}
                superAdmin={isSuperAdminEmail(u.email)}
                editable={canEditUserAccess(canManage, isSuperAdminEmail(u.email), u.id === currentUid, {
                  isSuperAdmin,
                  targetPermissions: u.permissions,
                })}
                isEditing={editingId === u.id}
                canDelete={
                  canManage &&
                  !isSuperAdminEmail(u.email) &&
                  u.id !== currentUid &&
                  (isSuperAdmin || !(u.permissions.users || u.permissions.settings))
                }
                assignableTabs={assignableTabs}
                showPasswordTools={isSuperAdmin}
                busy={busy}
                t={t}
                onEdit={() => startEdit(u)}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => void onDeleteUser(u)}
                editPermissions={editPermissions}
                setEditPermissions={setEditPermissions}
                editActive={editActive}
                setEditActive={setEditActive}
                editPassword={editPassword}
                setEditPassword={setEditPassword}
                onSave={() => void onSaveAccess(u)}
              />
            ))
          )}
        </div>
      </div>
    </AdminPanelShell>
  );
}
