import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "../lib/server/firebase-admin";

export function getAdminAuth() {
  getFirebaseAdminApp();
  return getAuth();
}

export function getAdminDb() {
  getFirebaseAdminApp();
  return getFirestore();
}

export function getGeminiApiKey() {
  const key = process.env["GEMINI_API_KEY"]?.trim();
  if (!key) throw new Error("missing-gemini-api-key");
  return key;
}

export function getBearerFromRequest(request: Request) {
  return request.headers.get("authorization");
}
