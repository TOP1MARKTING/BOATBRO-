import { sendPasswordResetEmail } from "firebase/auth";
import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { changeOwnPassword } from "../../lib/admin-auth";
import { clearUserCredential } from "../../lib/db";
import { getFirebaseAuth } from "../../lib/firebase";
import type { AdminPermissions, StaffRole } from "../../lib/admin-permissions";
import { isSuperAdminEmail } from "../../lib/admin";
import { mapAuthError } from "../../lib/auth";
import { ADMIN_FIELD_CLS, AdminSection, AdminPanelShell } from "./shared";

export function AdminProfilePanel({
  user,
  staffRole,
  permissions,
  lang,
  t,
}: {
  user: User;
  staffRole: StaffRole;
  permissions: AdminPermissions;
  lang: "ar" | "en";
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const roleLabel = isSuperAdminEmail(user.email)
    ? t.admin.superAdmin
    : staffRole === "admin"
      ? t.admin.roleAdmin
      : staffRole === "editor"
        ? t.admin.roleEditor
        : staffRole === "moderator"
          ? t.admin.roleModerator
          : t.admin.roleUser;

  const accessList = [
    permissions.overview ? t.admin.overview : null,
    permissions.posts ? t.admin.posts : null,
    permissions.gallery ? t.admin.gallery : null,
    permissions.content ? t.admin.content : null,
    permissions.contacts ? t.admin.contacts : null,
    permissions.users ? t.admin.users : null,
    permissions.settings ? t.admin.settings : null,
  ].filter(Boolean);

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t.admin.passwordMismatch);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await changeOwnPassword(currentPassword, newPassword);
      if (user.uid) await clearUserCredential(user.uid);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(t.admin.passwordChanged);
    } catch (err) {
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code: string }).code)
          : err instanceof Error
            ? err.message
            : "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError(mapAuthError("auth/invalid-credential", lang));
      } else if (code === "weak-password" || code === "auth/weak-password") {
        setError(mapAuthError("auth/weak-password", lang));
      } else {
        setError(mapAuthError(code, lang));
      }
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async () => {
    if (!user.email) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), user.email);
      setMessage(t.admin.passwordResetSent);
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
      setError(mapAuthError(code, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPanelShell title={t.admin.profile}>
      <div className="grid gap-5 lg:grid-cols-2">
        <AdminSection title={t.admin.profileAccount}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[12px] text-muted-foreground">{t.admin.user}</dt>
              <dd className="font-medium text-navy">{user.displayName || user.email}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">{t.auth.email}</dt>
              <dd className="font-medium text-navy" dir="ltr">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">{t.admin.role}</dt>
              <dd className="font-medium text-gold-ink">{roleLabel}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-foreground">{t.admin.limits}</dt>
              <dd className="text-muted-foreground">{accessList.join(" · ") || "—"}</dd>
            </div>
          </dl>
        </AdminSection>

        <AdminSection title={t.admin.changePassword} hint={t.admin.changePasswordHint}>
          <form onSubmit={(e) => void onChangePassword(e)} className="space-y-4">
            <label>
              <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.currentPassword}</span>
              <input
                required
                type="password"
                dir="ltr"
                autoComplete="current-password"
                className={ADMIN_FIELD_CLS}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.newPassword}</span>
              <input
                required
                type="password"
                dir="ltr"
                minLength={6}
                autoComplete="new-password"
                className={ADMIN_FIELD_CLS}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-[12px] font-medium text-navy">{t.admin.confirmPassword}</span>
              <input
                required
                type="password"
                dir="ltr"
                minLength={6}
                autoComplete="new-password"
                className={ADMIN_FIELD_CLS}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? t.admin.loading : t.admin.changePassword}
            </button>
          </form>
          <button
            type="button"
            disabled={busy || !user.email}
            onClick={() => void onResetPassword()}
            className="mt-4 rounded-full border border-gold/45 px-5 py-2.5 text-[13px] font-medium text-gold-ink hover:bg-gold hover:text-white disabled:opacity-60"
          >
            {t.admin.passwordReset}
          </button>
          {message ? <p className="mt-3 text-sm text-gold-ink">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </AdminSection>
      </div>
    </AdminPanelShell>
  );
}
