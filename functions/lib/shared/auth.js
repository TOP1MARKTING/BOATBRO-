import { HARD_CODED_ADMIN_EMAILS, SUPER_ADMIN_EMAIL } from "./constants.js";
export function parseBearerToken(authorization) {
    if (!authorization?.startsWith("Bearer "))
        return null;
    return authorization.slice(7).trim() || null;
}
export async function verifyIdToken(auth, token) {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null };
}
export async function requireSuperAdmin(auth, token) {
    const user = await verifyIdToken(auth, token);
    if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL)
        throw new Error("forbidden");
    return user;
}
export async function requireStaff(auth, db, token) {
    const user = await verifyIdToken(auth, token);
    const email = user.email?.toLowerCase() ?? "";
    if (HARD_CODED_ADMIN_EMAILS.has(email))
        return user;
    const staffDoc = await db.collection("users").doc(user.uid).get();
    const data = staffDoc.data();
    if (!staffDoc.exists || data?.role !== "admin" || data?.active === false) {
        throw new Error("forbidden");
    }
    return user;
}
