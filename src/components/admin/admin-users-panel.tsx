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
  canEditUserAccess,
  canManageUsers,
  type AdminPermissions,
  type AdminTab,
} from "../../lib/admin-permissions";
import { isSuperAdminEmail } from "../../lib/admin";
import { mapAuthError } from "../../lib/auth";
import { ADMIN_FIELD_CLS, AdminPanelShell, AdminSection } from "./shared";
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
  isSuperAdmin,
  currentUid,
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
  isSuperAdmin: boolean;
  currentUid: string;
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
  const canDelete = isSuperAdmin && !superAdmin && user.id !== currentUid;

  const statusCls = !user.active
    ? "bg-destructive/10 text-destructive"
    : superAdmin
      ? "bg-navy-deep text-white"
      : user.role === "admin"
        ? "bg-gold/15 text-gold-ink"
        : "bg-navy/5 text-muted-foreground";

  const statusLabel = !user.active
    ? t.admin.inactiveAccount
    : superAdmin
      ? t.admin.superAdmin
      : t.admin.roleStaff;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(15,40,70,0.35)]">
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy/8 text-[15px] font-semibold text-navy">
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

            {!superAdmin ? (
              <div className="mt-4 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
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
              className="rounded-full border border-border bg-card px-4 py-2 text-[12px] font-medium text-navy transition-colors hover:border-gold/40"
            >
              {isEditing ? t.admin.cancel : t.admin.editAccess}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
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
          />

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

          <label className="mt-5 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[13px]">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-gold"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
            />
            <span className="font-medium text-navy">{t.admin.activeAccount}</span>
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onSave}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? t.admin.loading : t.admin.save}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-navy"
            >
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
  onChange,
  t,
  lang,
}: {
  users: UserRecord[];
  currentUid: string;
  isSuperAdmin: boolean;
  onChange: () => Promise<void>;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  lang: "ar" | "en";
}) {
  const labels = useMemo(() => permissionLabels(t), [t]);
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
  const canManage = canManageUsers(isSuperAdmin);

  const loadCredentials = async () => {
    if (!canManage) return;
    try {
      setCredentials(await listUserCredentials());
    } catch {
      setCredentials({});
    }
  };

  useEffect(() => {
    void loadCredentials();
  }, [canManage]);

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setEditPermissions({ ...user.permissions });
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
        permissions: newPermissions,
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
    if (!canEditUserAccess(isSuperAdmin, user.email, isSuperAdminEmail(user.email), user.id === currentUid)) {
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await setUserAccess(user.id, {
        permissions: editPermissions,
        active: editActive,
      });
      if (editPassword.trim()) {
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
    if (!isSuperAdmin || isSuperAdminEmail(user.email) || user.id === currentUid) return;
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
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{t.admin.roleDenied}</p>
      </AdminPanelShell>
    );
  }

  return (
    <AdminPanelShell title={t.admin.users} hideTitle>
      <div className="space-y-6">
        <AdminSection title={t.admin.permissionsTitle} hint={t.admin.permissionsHint}>
          <p className="text-[13px] leading-7 text-muted-foreground">{t.admin.permissionsGuide}</p>
        </AdminSection>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
              />
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-[13px]">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-gold"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
              />
              <span className="font-medium text-navy">{t.admin.activeAccount}</span>
            </label>

            <button type="submit" disabled={busy} className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60">
              {busy ? t.admin.loading : t.admin.createUser}
            </button>
          </form>
        </section>

        {error ? <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        {message ? <p className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold-ink">{message}</p> : null}

        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">{t.admin.noUsers}</p>
          ) : (
            users.map((u) => (
              <UserAccessCard
                key={u.id}
                user={u}
                labels={labels}
                storedPassword={credentials[u.id]}
                superAdmin={isSuperAdminEmail(u.email)}
                editable={canEditUserAccess(isSuperAdmin, u.email, isSuperAdminEmail(u.email), u.id === currentUid)}
                isEditing={editingId === u.id}
                isSuperAdmin={isSuperAdmin}
                currentUid={currentUid}
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
