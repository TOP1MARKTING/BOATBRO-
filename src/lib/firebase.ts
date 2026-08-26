import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDJtQaLK0MPTYdoe0v4rZQQLPKRZWhuAXs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "boatpro1-18c6d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "boatpro1-18c6d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "boatpro1-18c6d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "189817551905",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:189817551905:web:f6db4c230422b2fc2e7760",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-V4THC78HLB",
};

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getStorageBucket(): FirebaseStorage {
  return getStorage(getFirebaseApp());
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
