import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { HARD_CODED_ADMIN_EMAILS, SUPER_ADMIN_EMAIL } from "./constants.js";
import type { AuthUser } from "./types.js";

export function parseBearerToken(authorization: string | null | undefined) {
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function verifyIdToken(auth: Auth, token: string): Promise<AuthUser> {
  const decoded = await auth.verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email ?? null };
}

export async function requireSuperAdmin(auth: Auth, token: string): Promise<AuthUser> {
  const user = await verifyIdToken(auth, token);
  if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) throw new Error("forbidden");
  return user;
}

export async function requireStaff(auth: Auth, db: Firestore, token: string): Promise<AuthUser> {
  const user = await verifyIdToken(auth, token);
  const email = user.email?.toLowerCase() ?? "";
  if (HARD_CODED_ADMIN_EMAILS.has(email)) return user;

  const staffDoc = await db.collection("users").doc(user.uid).get();
  const data = staffDoc.data();
  if (!staffDoc.exists || data?.role !== "admin" || data?.active === false) {
    throw new Error("forbidden");
  }
  return user;
}
