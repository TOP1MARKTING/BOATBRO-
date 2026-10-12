import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, initAnalytics } from "./firebase";
import { applyAdminInvite, getUserProfile, saveUserProfile, setUserRole } from "./db";
import { isAdminEmail, isSuperAdminEmail } from "./admin";
import {
  EMPTY_PERMISSIONS,
  FULL_PERMISSIONS,
  canAccessAdmin,
  canManageUsers,
  firstAllowedTab,
  normalizeStaffRole,
  resolvePermissions,
  type AdminPermissions,
  type AdminTab,
  type StaffRole,
} from "./admin-permissions";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  staffRole: StaffRole;
  permissions: AdminPermissions;
  canAccessTab: (tab: AdminTab) => boolean;
  canManageUsers: boolean;
  defaultAdminTab: AdminTab;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function mapAuthError(code: string, lang: "ar" | "en") {
  const ar: Record<string, string> = {
    "auth/email-already-in-use": "هذا البريد مسجّل مسبقاً.",
    "auth/invalid-email": "البريد الإلكتروني غير صالح.",
    "auth/weak-password": "كلمة المرور قصيرة. استخدم ٦ أحرف على الأقل.",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحة.",
    "auth/too-many-requests": "محاولات كثيرة. حاول بعد قليل.",
    "auth/network-request-failed": "تعذّر الاتصال. تحقق من الشبكة.",
  };
  const en: Record<string, string> = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-email": "That email address is not valid.",
    "auth/weak-password": "Password is too short. Use at least 6 characters.",
    "auth/user-not-found": "No account exists with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  const dict = lang === "ar" ? ar : en;
  return (
    dict[code] ??
    (lang === "ar"
      ? "تعذّر إتمام العملية. حاول مرة أخرى."
      : "Something went wrong. Please try again.")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [staffRole, setStaffRole] = useState<StaffRole>("user");
  const [storedPermissions, setStoredPermissions] = useState<AdminPermissions>(EMPTY_PERMISSIONS);
  const [staffActive, setStaffActive] = useState(true);

  useEffect(() => {
    initAnalytics();
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (!next) {
        setStaffRole("user");
        setStoredPermissions(EMPTY_PERMISSIONS);
        setStaffActive(true);
        setReady(true);
        return;
      }
      void (async () => {
        const email = next.email?.trim() ?? "";
        try {
          await applyAdminInvite(next.uid, email);
        } catch {
          // Invite apply is optional.
        }

        const profile = await getUserProfile(next.uid).catch(() => null);
        const name = next.displayName?.trim() || profile?.name || email.split("@")[0] || "";
        const whitelisted = isAdminEmail(email);
        const nextStaffRole = whitelisted
          ? ("admin" as const)
          : normalizeStaffRole(profile?.adminRole, profile?.role);
        const nextPermissions = whitelisted
          ? FULL_PERMISSIONS
          : (profile?.permissions ?? EMPTY_PERMISSIONS);
        const nextActive = whitelisted ? true : (profile?.active ?? nextStaffRole !== "user");

        const needsProfileSync =
          !profile ||
          !profile.email ||
          (name && profile.name !== name) ||
          (whitelisted && profile.adminRole !== "admin");

        if (needsProfileSync && email) {
          try {
            await saveUserProfile(next.uid, {
              name,
              email,
              role: nextStaffRole === "user" ? "user" : "admin",
              adminRole: nextStaffRole,
              permissions: nextPermissions,
              active: nextActive,
            });
          } catch {
            if (whitelisted) {
              try {
                await setUserRole(next.uid, "admin");
              } catch {
                // ignore
              }
            }
          }
        }

        setStaffRole(nextStaffRole);
        setStoredPermissions(nextPermissions);
        setStaffActive(nextActive);
      })()
        .catch(() => {
          setStaffRole(isAdminEmail(next.email) ? "admin" : "user");
          setStoredPermissions(isAdminEmail(next.email) ? FULL_PERMISSIONS : EMPTY_PERMISSIONS);
          setStaffActive(true);
        })
        .finally(() => setReady(true));
    });
  }, []);

  const isSuperAdmin = isSuperAdminEmail(user?.email);
  const isWhitelisted = isAdminEmail(user?.email);
  const permissions = resolvePermissions(
    user?.email,
    storedPermissions,
    staffActive,
    isSuperAdmin,
    isWhitelisted,
  );
  const isAdmin = canAccessAdmin(permissions, staffActive, isSuperAdmin, isWhitelisted);
  const defaultAdminTab = firstAllowedTab(permissions);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      isAdmin,
      isSuperAdmin,
      staffRole,
      permissions,
      canAccessTab: (tab) => permissions[tab],
      canManageUsers: canManageUsers(isSuperAdmin, permissions),
      defaultAdminTab,
      login: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      },
      register: async (name, email, password) => {
        const cred = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          email.trim(),
          password,
        );
        await updateProfile(cred.user, { displayName: name.trim() });
        try {
          const applied = await applyAdminInvite(cred.user.uid, email.trim());
          if (!applied) {
            await saveUserProfile(cred.user.uid, {
              name: name.trim(),
              email: email.trim(),
              role: isAdminEmail(email) ? "admin" : "user",
              adminRole: isAdminEmail(email) ? "admin" : "user",
              permissions: isAdminEmail(email) ? FULL_PERMISSIONS : EMPTY_PERMISSIONS,
              active: isAdminEmail(email),
            });
          }
        } catch {
          // Auth succeeded even if the profile write is blocked by rules.
        }
      },
      logout: async () => {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [
      user,
      ready,
      isAdmin,
      isSuperAdmin,
      staffRole,
      permissions,
      defaultAdminTab,
      storedPermissions,
      staffActive,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
