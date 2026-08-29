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
  canEditUserAccess,
  canManageUsers,
  permissionsSummary,
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
    contacts: t.admin.contacts,
    users: t.admin.users,
    settings: t.admin.settings,
    profile: t.admin.profile,
  };
}

function defaultNewUserPermissions(): AdminPermissions {
  return { ...EMPTY_PERMISSIONS, overview: true, posts: true, profile: true };
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
                  className={ADMIN_FIELD_CLS}
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
            users.map((u) => {
              const superAdmin = isSuperAdminEmail(u.email);
              const editable = canEditUserAccess(isSuperAdmin, u.email, superAdmin, u.id === currentUid);
              const summary = superAdmin
                ? [t.admin.superAdmin]
                : permissionsSummary(u.permissions, labels);
              const storedPassword = credentials[u.id];
              const initial = (u.name || u.email || "?").trim().charAt(0).toUpperCase();
              const isEditing = editingId === u.id;

              return (
                <article key={u.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(15,40,70,0.4)]">
                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-navy/8 text-[13px] font-semibold text-navy">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-navy">{u.name || u.email || "—"}</p>
                        {u.email ? (
                          <p className="mt-0.5 truncate text-[12px] text-muted-foreground" dir="ltr">{u.email}</p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-muted-foreground">{summary.join(" · ") || "—"}</p>
                        {!superAdmin ? (
                          <p className="mt-1 text-[11px] text-gold-ink" dir="ltr">
                            {t.auth.password}: {storedPassword || t.admin.passwordUnknown}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        !u.active
                          ? "bg-destructive/10 text-destructive"
                          : superAdmin
                            ? "bg-navy-deep text-white"
                            : u.role === "admin"
                              ? "bg-gold/15 text-gold-ink"
                              : "bg-navy/5 text-muted-foreground"
                      }`}>
                        {!u.active ? t.admin.inactiveAccount : superAdmin ? t.admin.superAdmin : t.admin.roleStaff}
                      </span>
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => (isEditing ? setEditingId(null) : startEdit(u))}
                          className="rounded-full border border-border px-4 py-1.5 text-[12px] font-medium text-navy hover:border-gold/40"
                        >
                          {isEditing ? t.admin.cancel : t.admin.editAccess}
                        </button>
                      ) : null}
                      {isSuperAdmin && !superAdmin && u.id !== currentUid ? (
                        <button type="button" onClick={() => void onDeleteUser(u)} className="text-[12px] text-destructive hover:underline">
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
                            className={`${ADMIN_FIELD_CLS} bg-muted/50`}
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
                            className={ADMIN_FIELD_CLS}
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
                          onClick={() => void onSaveAccess(u)}
                          className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {busy ? t.admin.loading : t.admin.save}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-navy"
                        >
                          {t.admin.cancel}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </div>
    </AdminPanelShell>
  );
}
