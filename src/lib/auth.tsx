import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, initAnalytics } from "./firebase";
import { getUserProfile, saveUserProfile, setUserRole } from "./db";
import { isAdminEmail, isSuperAdminEmail } from "./admin";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
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
  return dict[code] ?? (lang === "ar" ? "تعذّر إتمام العملية. حاول مرة أخرى." : "Something went wrong. Please try again.");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    initAnalytics();
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (!next) {
        setRole(null);
        setReady(true);
        return;
      }
      void getUserProfile(next.uid)
        .then(async (profile) => {
          const email = next.email?.trim() ?? "";
          const name = next.displayName?.trim() || profile?.name || email.split("@")[0] || "";
          const shouldBeAdmin = isAdminEmail(email);
          const nextRole = shouldBeAdmin ? ("admin" as const) : profile?.role ?? ("user" as const);

          const needsProfileSync =
            !profile ||
            !profile.email ||
            (name && profile.name !== name) ||
            (shouldBeAdmin && profile.role !== "admin");

          if (needsProfileSync && email) {
            try {
              await saveUserProfile(next.uid, { name, email, role: nextRole });
            } catch {
              // Email whitelist still grants admin access even if profile write fails.
              if (shouldBeAdmin) {
                try {
                  await setUserRole(next.uid, "admin");
                } catch {
                  // ignore
                }
              }
            }
          }

          setRole(nextRole);
        })
        .catch(() => setRole(isAdminEmail(next.email) ? "admin" : "user"))
        .finally(() => setReady(true));
    });
  }, []);

  const isSuperAdmin = isSuperAdminEmail(user?.email);
  const isAdmin = isSuperAdmin || isAdminEmail(user?.email) || role === "admin";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      isAdmin,
      isSuperAdmin,
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
          await saveUserProfile(cred.user.uid, {
            name: name.trim(),
            email: email.trim(),
            role: isAdminEmail(email) ? "admin" : "user",
          });
        } catch {
          // Auth succeeded even if the profile write is blocked by rules.
        }
      },
      logout: async () => {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [user, ready, isAdmin, isSuperAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
