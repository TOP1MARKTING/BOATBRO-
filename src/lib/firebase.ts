import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

/** Local testing only: `VITE_FIREBASE_EMULATOR_HOST=127.0.0.1` targets the Auth (9099) / Firestore (8080) emulators. */
const emulatorHost = import.meta.env.DEV
  ? String(import.meta.env["VITE_FIREBASE_EMULATOR_HOST"] ?? "")
  : "";
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDJtQaLK0MPTYdoe0v4rZQQLPKRZWhuAXs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "boatpro1-18c6d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "boatpro1-18c6d",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "boatpro1-18c6d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "189817551905",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:189817551905:web:f6db4c230422b2fc2e7760",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-V4THC78HLB",
};

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  if (emulatorHost && !authEmulatorConnected) {
    authEmulatorConnected = true;
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  }
  return auth;
}

export function getDb(): Firestore {
  const db = getFirestore(getFirebaseApp());
  if (emulatorHost && !firestoreEmulatorConnected) {
    firestoreEmulatorConnected = true;
    connectFirestoreEmulator(db, emulatorHost, 8080);
  }
  return db;
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  void import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) =>
      isSupported().then((ok) => {
        if (ok) getAnalytics(getFirebaseApp());
      }),
    )
    .catch(() => undefined);
}
