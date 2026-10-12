import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, getFirebaseApp } from "./firebase";

/** Creates a Firebase Auth user without signing out the current admin session. */
export async function createAuthUserAsAdmin(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const primary = getFirebaseApp();
  const secondary = initializeApp(primary.options, `admin-create-${Date.now()}`);
  try {
    const auth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const name = displayName.trim();
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    return cred.user;
  } finally {
    await deleteApp(secondary);
  }
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error("not-signed-in");
  if (newPassword.length < 6) throw new Error("weak-password");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function resetStaffUserAuthPassword(uid: string, password: string) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("not-signed-in");
  if (password.length < 6) throw new Error("weak-password");

  const apiUrl = import.meta.env["VITE_ADMIN_PASSWORD_API_URL"];
  if (typeof apiUrl !== "string" || !apiUrl.startsWith("https://")) {
    throw new Error("missing-service-account");
  }

  const token = await user.getIdToken();
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "password-reset-failed");
  }
}
