import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getDb, getStorageBucket } from "./firebase";

function toDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate();
  }
  return null;
}

export type ContactRequest = {
  userType: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  content: string;
  lang: "ar" | "en";
  uid: string | null;
};

export type ContactRecord = ContactRequest & {
  id: string;
  status: "new" | "handled";
  createdAt: Date | null;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  category: string;
  lang: "ar" | "en";
  published: boolean;
  authorName: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date | null;
};

export type PostInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  category: string;
  lang: "ar" | "en";
  published: boolean;
  authorName: string;
};

function mapPost(id: string, data: Record<string, unknown>): BlogPost {
  return {
    id,
    slug: String(data.slug ?? id),
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    body: String(data.body ?? ""),
    coverUrl: String(data.coverUrl ?? ""),
    category: String(data.category ?? ""),
    lang: data.lang === "en" ? "en" : "ar",
    published: Boolean(data.published),
    authorName: String(data.authorName ?? ""),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function saveContactRequest(data: ContactRequest) {
  await addDoc(collection(getDb(), "contactRequests"), {
    userType: data.userType.slice(0, 80),
    name: data.name.slice(0, 120),
    phone: data.phone.slice(0, 40),
    email: data.email.slice(0, 120),
    address: data.address.slice(0, 160),
    content: data.content.slice(0, 2000),
    lang: data.lang === "en" ? "en" : "ar",
    uid: data.uid,
    status: "new",
    createdAt: serverTimestamp(),
  });
}

export async function saveUserProfile(
  uid: string,
  data: { name: string; email: string; role?: "admin" | "user" },
) {
  await setDoc(
    doc(getDb(), "users", uid),
    {
      name: data.name,
      email: data.email,
      ...(data.role ? { role: data.role } : {}),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(getDb(), "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    role: data.role === "admin" ? "admin" as const : "user" as const,
  };
}

export async function listPublishedPosts() {
  const snap = await getDocs(
    query(collection(getDb(), "posts"), where("published", "==", true), limit(48)),
  );
  return snap.docs
    .map((d) => mapPost(d.id, d.data()))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function listAllPosts() {
  const snap = await getDocs(query(collection(getDb(), "posts"), limit(100)));
  return snap.docs
    .map((d) => mapPost(d.id, d.data()))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export function pickRelatedPosts(posts: BlogPost[], current: BlogPost, n = 3) {
  const others = posts.filter((p) => p.id !== current.id && p.published);
  const same = others.filter((p) => p.category && p.category === current.category);
  const rest = others.filter((p) => !p.category || p.category !== current.category);
  return [...same, ...rest].slice(0, n);
}

export async function getPostBySlug(slug: string) {
  try {
    const byId = await getDoc(doc(getDb(), "posts", slug));
    if (byId.exists()) return mapPost(byId.id, byId.data());
  } catch {
    // Public rules hide unpublished/missing docs as permission-denied.
  }
  try {
    const snap = await getDocs(
      query(
        collection(getDb(), "posts"),
        where("slug", "==", slug),
        where("published", "==", true),
        limit(1),
      ),
    );
    const first = snap.docs[0];
    if (first) return mapPost(first.id, first.data());
  } catch {
    const published = await listPublishedPosts().catch(() => []);
    return published.find((p) => p.slug === slug || p.id === slug) ?? null;
  }
  return null;
}

export async function savePost(id: string | null, input: PostInput) {
  const payload = {
    ...input,
    updatedAt: serverTimestamp(),
  };
  if (id) {
    await updateDoc(doc(getDb(), "posts", id), payload);
    return id;
  }
  const created = await addDoc(collection(getDb(), "posts"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return created.id;
}

export async function deletePost(id: string) {
  await deleteDoc(doc(getDb(), "posts", id));
}

export async function listContacts() {
  const snap = await getDocs(query(collection(getDb(), "contactRequests"), limit(100)));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userType: String(data.userType ?? ""),
        name: String(data.name ?? ""),
        phone: String(data.phone ?? ""),
        email: String(data.email ?? ""),
        address: String(data.address ?? ""),
        content: String(data.content ?? ""),
        lang: data.lang === "en" ? "en" as const : "ar" as const,
        uid: (data.uid as string | null) ?? null,
        status: data.status === "handled" ? "handled" as const : "new" as const,
        createdAt: toDate(data.createdAt),
      } satisfies ContactRecord;
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function setContactStatus(id: string, status: "new" | "handled") {
  await updateDoc(doc(getDb(), "contactRequests", id), { status });
}

export async function deleteContact(id: string) {
  await deleteDoc(doc(getDb(), "contactRequests", id));
}

export async function listUsers() {
  const snap = await getDocs(query(collection(getDb(), "users"), limit(100)));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        role: data.role === "admin" ? "admin" as const : "user" as const,
        createdAt: toDate(data.createdAt),
      } satisfies UserRecord;
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function setUserRole(uid: string, role: "admin" | "user") {
  await setDoc(doc(getDb(), "users", uid), { role, updatedAt: serverTimestamp() }, { merge: true });
}

export async function uploadCover(file: File, uid: string) {
  const safe = file.name.replace(/[^\w.\-]+/g, "-").slice(-80);
  const path = `covers/${uid}/${Date.now()}-${safe}`;
  const fileRef = ref(getStorageBucket(), path);
  await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(fileRef);
}
