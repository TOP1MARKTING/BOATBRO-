import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminApp: App | null = null;

export function getFirebaseAdminApp() {
  if (adminApp) return adminApp;
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("missing-service-account");
  const serviceAccount = JSON.parse(raw) as Record<string, unknown>;
  adminApp = initializeApp({ credential: cert(serviceAccount) });
  return adminApp;
}

export async function verifySuperAdminRequest(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) throw new Error("unauthorized");
  getFirebaseAdminApp();
  const decoded = await getAuth().verifyIdToken(authorization.slice(7));
  if (decoded.email?.toLowerCase() !== "admin@boatpro.club") throw new Error("forbidden");
  return decoded;
}

export async function setAuthUserPassword(uid: string, password: string) {
  if (password.length < 6) throw new Error("weak-password");
  getFirebaseAdminApp();
  await getAuth().updateUser(uid, { password });
}
