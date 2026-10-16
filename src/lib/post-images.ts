import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "./firebase";

/**
 * Article images (inline + covers) live in their own Firestore documents so a post document stays far below
 * Firestore's 1 MiB limit. Posts reference them by a stable path that `public/seo/image.php` serves on the
 * production host; anywhere PHP is unavailable (local dev), `installPostImageFallback` loads the data URL instead.
 */
const POST_IMAGE_COLLECTION = "postImages";

const POST_IMAGE_PATH = /^\/media\/posts\/([A-Za-z0-9_-]{6,64})\.(?:jpe?g|png|webp)$/;
const DATA_URL_PREFIX = /^data:(image\/(?:jpeg|png|webp));base64,/;
export const INLINE_DATA_URL = /data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+/g;

function postImagePath(id: string, mimeType: string) {
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `/media/posts/${id}.${ext}`;
}

function postImageIdFromUrl(url: string) {
  if (!url) return null;
  try {
    return POST_IMAGE_PATH.exec(new URL(url, "https://boatpro.club").pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isPermissionDenied(error: unknown) {
  return Boolean(
    error && typeof error === "object" && (error as { code?: string }).code === "permission-denied",
  );
}

/** Saves a compressed data URL as its own document and returns the stable public path. */
export async function storePostImage(dataUrl: string) {
  const mimeType = DATA_URL_PREFIX.exec(dataUrl)?.[1];
  if (!mimeType) throw new Error("invalid-image");
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const created = await addDoc(collection(getDb(), POST_IMAGE_COLLECTION), {
    dataUrl,
    mimeType,
    byteLength: Math.ceil((base64.length * 3) / 4),
    uploadedBy: getFirebaseAuth().currentUser?.uid ?? "",
    createdAt: serverTimestamp(),
  });
  return postImagePath(created.id, mimeType);
}

const loaded = new Map<string, Promise<string | null>>();

function loadPostImageDataUrl(id: string) {
  let pending = loaded.get(id);
  if (!pending) {
    pending = getDoc(doc(getDb(), POST_IMAGE_COLLECTION, id))
      .then((snap) => {
        const dataUrl = snap.exists() ? String(snap.data()["dataUrl"] ?? "") : "";
        return dataUrl.startsWith("data:image/") ? dataUrl : null;
      })
      .catch(() => null);
    loaded.set(id, pending);
  }
  return pending;
}

/** One capture listener covers every <img> (covers, cards, article HTML, admin previews). */
export function installPostImageFallback() {
  if (typeof document === "undefined") return;
  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || img.dataset["fsSrc"] !== undefined) return;
      const src = img.getAttribute("src") ?? "";
      const id = postImageIdFromUrl(src);
      if (!id) return;
      img.dataset["fsSrc"] = src;
      img.dataset["fsPending"] = "";
      void loadPostImageDataUrl(id).then((dataUrl) => {
        if (!dataUrl) return;
        img.src = dataUrl;
        delete img.dataset["fsPending"];
      });
    },
    true,
  );
}
