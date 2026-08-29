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
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import type { LocalizedFaq, LocalizedText, PostBlock } from "./post-content";
import {
  blocksPlainText,
  createParagraph,
  emptyLocalized,
  migrateLegacyBody,
  newBlockId,
} from "./post-content";
import {
  defaultSiteSettings,
  mapSiteSettings,
  normalizeSiteSettingsInput,
  type SiteSettings,
  type SiteSettingsInput,
} from "./site-settings";
import { getDb, getStorageBucket } from "./firebase";
import { createAuthUserAsAdmin, resetStaffUserAuthPassword } from "./admin-auth";
import type { AdminPermissions, StaffRole } from "./admin-permissions";
import {
  accessFromPermissions,
  normalizeStaffRole,
  parsePermissions,
  staffRoleFromPermissions,
} from "./admin-permissions";

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

export type PostFaqItem = LocalizedFaq;

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
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  ogImage: string;
  noindex: boolean;
  faq: PostFaqItem[];
  titleI18n: LocalizedText;
  excerptI18n: LocalizedText;
  categoryI18n: LocalizedText;
  authorI18n: LocalizedText;
  coverAlt: LocalizedText;
  tags: { ar: string[]; en: string[] };
  metaTitleI18n: LocalizedText;
  metaDescriptionI18n: LocalizedText;
  focusKeywordI18n: LocalizedText;
  blocks: PostBlock[];
  featured: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  active: boolean;
  permissions: AdminPermissions;
  adminRole: StaffRole;
  createdAt: Date | null;
};

export type AdminInvite = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  permissions: AdminPermissions;
  createdBy: string;
  createdAt: Date | null;
};

export type GalleryImage = {
  id: string;
  url: string;
  storagePath: string;
  name: string;
  alt: LocalizedText;
  caption: LocalizedText;
  uploadedBy: string;
  createdAt: Date | null;
};

export type GalleryInput = {
  name: string;
  alt: LocalizedText;
  caption: LocalizedText;
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
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  ogImage: string;
  noindex: boolean;
  faq: PostFaqItem[];
  titleI18n: LocalizedText;
  excerptI18n: LocalizedText;
  categoryI18n: LocalizedText;
  authorI18n: LocalizedText;
  coverAlt: LocalizedText;
  tags: { ar: string[]; en: string[] };
  metaTitleI18n: LocalizedText;
  metaDescriptionI18n: LocalizedText;
  focusKeywordI18n: LocalizedText;
  blocks: PostBlock[];
  featured: boolean;
};

function mapLocalizedField(value: unknown, fallback = ""): LocalizedText {
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    return { ar: String(row.ar ?? fallback), en: String(row.en ?? fallback) };
  }
  const single = String(value ?? fallback);
  return { ar: single, en: single };
}

function mapLocalizedFromLegacy(data: Record<string, unknown>, key: string, i18nKey: string): LocalizedText {
  const nested = data[i18nKey];
  if (nested) return mapLocalizedField(nested);
  const single = String(data[key] ?? "");
  return { ar: single, en: single };
}

function mapTags(data: Record<string, unknown>) {
  const raw = data.tags;
  if (raw && typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    const ar = Array.isArray(row.ar) ? row.ar.map(String).filter(Boolean).slice(0, 12) : [];
    const en = Array.isArray(row.en) ? row.en.map(String).filter(Boolean).slice(0, 12) : [];
    return { ar, en };
  }
  return { ar: [] as string[], en: [] as string[] };
}

function mapBlocks(data: unknown, body: string): PostBlock[] {
  if (!Array.isArray(data) || !data.length) return migrateLegacyBody(body);
  const blocks: PostBlock[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const id = String(row.id ?? newBlockId());
    const type = row.type;
    if (type === "paragraph" || type === "quote") {
      blocks.push({ id, type, text: mapLocalizedField(row.text) } as PostBlock);
      continue;
    }
    if (type === "heading") {
      blocks.push({
        id,
        type: "heading",
        level: row.level === 3 ? 3 : 2,
        text: mapLocalizedField(row.text),
      });
      continue;
    }
    if (type === "image") {
      blocks.push({
        id,
        type: "image",
        url: String(row.url ?? ""),
        alt: mapLocalizedField(row.alt),
        caption: mapLocalizedField(row.caption),
        afterBlockId: row.afterBlockId === "end" ? "end" : String(row.afterBlockId ?? "end"),
      });
    }
  }
  return blocks.length ? blocks : migrateLegacyBody(body);
}

function mapFaq(data: unknown): PostFaqItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (row.question && typeof row.question === "object") {
        const q = mapLocalizedField(row.question);
        const a = mapLocalizedField(row.answer);
        if (!q.ar && !q.en) return null;
        return { question: q, answer: a };
      }
      const question = String(row.question ?? "").trim();
      const answer = String(row.answer ?? "").trim();
      if (!question || !answer) return null;
      return { question: { ar: question, en: question }, answer: { ar: answer, en: answer } };
    })
    .filter(Boolean)
    .slice(0, 8) as PostFaqItem[];
}

function syncLegacyFields(input: PostInput): PostInput {
  const body = blocksPlainText(input.blocks);
  return {
    ...input,
    title: input.titleI18n.ar.trim() || input.titleI18n.en.trim() || input.title,
    excerpt: input.excerptI18n.ar.trim() || input.excerptI18n.en.trim() || input.excerpt,
    body: body || input.body,
    category: input.categoryI18n.ar.trim() || input.categoryI18n.en.trim() || input.category,
    authorName: input.authorI18n.ar.trim() || input.authorI18n.en.trim() || input.authorName,
    metaTitle: input.metaTitleI18n.ar.trim() || input.metaTitleI18n.en.trim() || input.metaTitle,
    metaDescription:
      input.metaDescriptionI18n.ar.trim() || input.metaDescriptionI18n.en.trim() || input.metaDescription,
    focusKeyword:
      input.focusKeywordI18n.ar.trim() || input.focusKeywordI18n.en.trim() || input.focusKeyword,
  };
}

function mapPost(id: string, data: Record<string, unknown>): BlogPost {
  const body = String(data.body ?? "");
  const titleI18n = mapLocalizedFromLegacy(data, "title", "titleI18n");
  const excerptI18n = mapLocalizedFromLegacy(data, "excerpt", "excerptI18n");
  const categoryI18n = mapLocalizedFromLegacy(data, "category", "categoryI18n");
  const authorI18n = mapLocalizedFromLegacy(data, "authorName", "authorI18n");
  const metaTitleI18n = mapLocalizedFromLegacy(data, "metaTitle", "metaTitleI18n");
  const metaDescriptionI18n = mapLocalizedFromLegacy(data, "metaDescription", "metaDescriptionI18n");
  const focusKeywordI18n = mapLocalizedFromLegacy(data, "focusKeyword", "focusKeywordI18n");
  const blocks = mapBlocks(data.blocks, body);

  return {
    id,
    slug: String(data.slug ?? id),
    title: String(data.title ?? titleI18n.ar ?? titleI18n.en),
    excerpt: String(data.excerpt ?? excerptI18n.ar ?? excerptI18n.en),
    body: body || blocksPlainText(blocks),
    coverUrl: String(data.coverUrl ?? ""),
    category: String(data.category ?? categoryI18n.ar ?? categoryI18n.en),
    lang: data.lang === "en" ? "en" : "ar",
    published: Boolean(data.published),
    authorName: String(data.authorName ?? authorI18n.ar ?? authorI18n.en),
    metaTitle: String(data.metaTitle ?? metaTitleI18n.ar ?? metaTitleI18n.en),
    metaDescription: String(data.metaDescription ?? metaDescriptionI18n.ar ?? metaDescriptionI18n.en),
    focusKeyword: String(data.focusKeyword ?? focusKeywordI18n.ar ?? focusKeywordI18n.en),
    ogImage: String(data.ogImage ?? ""),
    noindex: Boolean(data.noindex),
    faq: mapFaq(data.faq),
    titleI18n,
    excerptI18n,
    categoryI18n,
    authorI18n,
    coverAlt: mapLocalizedFromLegacy(data, "coverAlt", "coverAlt"),
    tags: mapTags(data),
    metaTitleI18n,
    metaDescriptionI18n,
    focusKeywordI18n,
    blocks,
    featured: Boolean(data.featured),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function postToInput(post: BlogPost): PostInput {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    coverUrl: post.coverUrl,
    category: post.category,
    lang: post.lang,
    published: post.published,
    authorName: post.authorName,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    focusKeyword: post.focusKeyword,
    ogImage: post.ogImage,
    noindex: post.noindex,
    faq: post.faq,
    titleI18n: post.titleI18n,
    excerptI18n: post.excerptI18n,
    categoryI18n: post.categoryI18n,
    authorI18n: post.authorI18n,
    coverAlt: post.coverAlt,
    tags: post.tags,
    metaTitleI18n: post.metaTitleI18n,
    metaDescriptionI18n: post.metaDescriptionI18n,
    focusKeywordI18n: post.focusKeywordI18n,
    blocks: post.blocks.length ? post.blocks : [createParagraph()],
    featured: post.featured,
  };
}

export function createEmptyPostInput(author: string, category: string): PostInput {
  return {
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    coverUrl: "",
    category,
    lang: "ar",
    published: false,
    authorName: author,
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
    ogImage: "",
    noindex: false,
    faq: [],
    titleI18n: emptyLocalized(),
    excerptI18n: emptyLocalized(),
    categoryI18n: { ar: category, en: category },
    authorI18n: { ar: author, en: author },
    coverAlt: emptyLocalized(),
    tags: { ar: [], en: [] },
    metaTitleI18n: emptyLocalized(),
    metaDescriptionI18n: emptyLocalized(),
    focusKeywordI18n: emptyLocalized(),
    blocks: [createParagraph()],
    featured: false,
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
  data: {
    name: string;
    email: string;
    role?: "admin" | "user";
    adminRole?: StaffRole;
    active?: boolean;
    permissions?: AdminPermissions;
  },
) {
  const adminRole = data.adminRole ?? (data.role === "admin" ? "admin" : "user");
  const permissions = data.permissions ?? parsePermissions(null, adminRole, data.role);
  const access = accessFromPermissions(permissions, data.active ?? adminRole !== "user");
  await setDoc(
    doc(getDb(), "users", uid),
    {
      name: data.name,
      email: data.email.toLowerCase(),
      role: access.role,
      adminRole: access.adminRole,
      active: access.active,
      permissions: access.permissions,
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
  const role = data.role === "admin" ? ("admin" as const) : ("user" as const);
  const adminRole = normalizeStaffRole(data.adminRole, role);
  const permissions = parsePermissions(data, adminRole, role);
  return {
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    role,
    adminRole,
    active: data.active !== false,
    permissions,
  };
}

export async function setUserAccess(
  uid: string,
  input: {
    permissions: AdminPermissions;
    active?: boolean;
    name?: string;
  },
) {
  const access = accessFromPermissions(input.permissions, input.active ?? true);
  await setDoc(
    doc(getDb(), "users", uid),
    {
      ...(input.name ? { name: input.name.slice(0, 120) } : {}),
      permissions: access.permissions,
      active: access.active,
      adminRole: access.adminRole,
      role: access.role,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function setUserRole(uid: string, role: "admin" | "user") {
  if (role === "user") {
    await setUserAccess(uid, { permissions: parsePermissions(null, "user", "user"), active: false });
    return;
  }
  await setUserAccess(uid, {
    permissions: parsePermissions(null, "admin", "admin"),
    active: true,
  });
}

export async function deleteUserProfile(uid: string) {
  await deleteDoc(doc(getDb(), "users", uid));
  await clearUserCredential(uid);
}

function mapAdminInvite(id: string, data: Record<string, unknown>): AdminInvite {
  const permissions = parsePermissions(data);
  return {
    id,
    email: String(data.email ?? "").toLowerCase(),
    name: String(data.name ?? ""),
    active: data.active !== false,
    permissions,
    createdBy: String(data.createdBy ?? ""),
    createdAt: toDate(data.createdAt),
  };
}

export async function listAdminInvites() {
  const snap = await getDocs(query(collection(getDb(), "adminInvites"), limit(100)));
  return snap.docs
    .map((d) => mapAdminInvite(d.id, d.data()))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function createAdminInvite(input: {
  email: string;
  name: string;
  permissions: AdminPermissions;
  active?: boolean;
  createdBy: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("invalid-email");
  const ref = doc(getDb(), "adminInvites", email);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error("invite-exists");
  const access = accessFromPermissions(input.permissions, input.active ?? true);
  await setDoc(ref, {
    email,
    name: input.name.trim().slice(0, 120),
    permissions: access.permissions,
    active: access.active,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  });
  return mapAdminInvite(email, {
    email,
    name: input.name.trim(),
    permissions: access.permissions,
    active: access.active,
    createdBy: input.createdBy,
    createdAt: new Date(),
  });
}

export async function deleteAdminInvite(id: string) {
  await deleteDoc(doc(getDb(), "adminInvites", id.trim().toLowerCase()));
}

export async function applyAdminInvite(uid: string, email: string) {
  const normalized = email.trim().toLowerCase();
  const ref = doc(getDb(), "adminInvites", normalized);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const invite = mapAdminInvite(normalized, snap.data());
  await setUserAccess(uid, {
    permissions: invite.permissions,
    active: invite.active,
    name: invite.name,
  });
  await deleteDoc(ref);
  return true;
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  permissions: AdminPermissions;
  active?: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("invalid-email");
  if (input.password.length < 6) throw new Error("weak-password");

  const authUser = await createAuthUserAsAdmin(email, input.password, input.name);
  const access = accessFromPermissions(input.permissions, input.active ?? true);

  await setDoc(doc(getDb(), "users", authUser.uid), {
    name: input.name.trim().slice(0, 120),
    email,
    role: access.role,
    adminRole: access.adminRole,
    active: access.active,
    permissions: access.permissions,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await saveUserCredential(authUser.uid, input.password);
  return authUser.uid;
}

export async function saveUserCredential(uid: string, password: string) {
  await setDoc(doc(getDb(), "userCredentials", uid), {
    password: password.slice(0, 128),
    updatedAt: serverTimestamp(),
  });
}

export async function clearUserCredential(uid: string) {
  try {
    await deleteDoc(doc(getDb(), "userCredentials", uid));
  } catch {
    // Optional cleanup.
  }
}

export async function getUserCredential(uid: string) {
  const snap = await getDoc(doc(getDb(), "userCredentials", uid));
  if (!snap.exists()) return null;
  return String(snap.data().password ?? "");
}

export async function listUserCredentials() {
  const snap = await getDocs(query(collection(getDb(), "userCredentials"), limit(200)));
  const map: Record<string, string> = {};
  for (const d of snap.docs) {
    map[d.id] = String(d.data().password ?? "");
  }
  return map;
}

export async function resetStaffUserPassword(uid: string, password: string) {
  if (password.length < 6) throw new Error("weak-password");
  await resetStaffUserAuthPassword(uid, password);
  await saveUserCredential(uid, password);
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
  const synced = syncLegacyFields(input);
  const payload = {
    ...synced,
    ogImage: synced.ogImage.slice(0, 500),
    faq: synced.faq
      .filter((item) => (item.question.ar || item.question.en) && (item.answer.ar || item.answer.en))
      .slice(0, 8),
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
      const role = data.role === "admin" ? ("admin" as const) : ("user" as const);
      const adminRole = normalizeStaffRole(data.adminRole, role);
      return {
        id: d.id,
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        role,
        active: data.active !== false,
        permissions: parsePermissions(data, adminRole, role),
        adminRole,
        createdAt: toDate(data.createdAt),
      } satisfies UserRecord;
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function uploadImageFile(file: File, uid: string, folder: "covers" | "gallery") {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("file-too-large");
  }
  const safe = file.name.replace(/[^\w.\-]+/g, "-").slice(-80);
  const storagePath = `${folder}/${uid}/${Date.now()}-${safe}`;
  const fileRef = ref(getStorageBucket(), storagePath);
  await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
  const url = await getDownloadURL(fileRef);
  return { url, storagePath };
}

export async function uploadCover(file: File, uid: string) {
  const { url } = await uploadImageFile(file, uid, "covers");
  return url;
}

function mapGalleryImage(id: string, data: Record<string, unknown>): GalleryImage {
  return {
    id,
    url: String(data.url ?? ""),
    storagePath: String(data.storagePath ?? ""),
    name: String(data.name ?? ""),
    alt: mapLocalizedField(data.alt),
    caption: mapLocalizedField(data.caption),
    uploadedBy: String(data.uploadedBy ?? ""),
    createdAt: toDate(data.createdAt),
  };
}

export async function listGalleryImages() {
  const snap = await getDocs(query(collection(getDb(), "gallery"), limit(200)));
  return snap.docs
    .map((d) => mapGalleryImage(d.id, d.data()))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function uploadGalleryImage(file: File, uid: string, input: Partial<GalleryInput> = {}) {
  const { url, storagePath } = await uploadImageFile(file, uid, "gallery");
  const name = input.name?.trim() || file.name.replace(/\.[^.]+$/, "").slice(0, 120);
  const created = await addDoc(collection(getDb(), "gallery"), {
    url,
    storagePath,
    name,
    alt: input.alt ?? emptyLocalized(),
    caption: input.caption ?? emptyLocalized(),
    uploadedBy: uid,
    createdAt: serverTimestamp(),
  });
  return mapGalleryImage(created.id, {
    url,
    storagePath,
    name,
    alt: input.alt ?? emptyLocalized(),
    caption: input.caption ?? emptyLocalized(),
    uploadedBy: uid,
    createdAt: new Date(),
  });
}

export async function updateGalleryImage(id: string, input: Partial<GalleryInput>) {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (input.name !== undefined) payload.name = input.name.slice(0, 120);
  if (input.alt) payload.alt = input.alt;
  if (input.caption) payload.caption = input.caption;
  await updateDoc(doc(getDb(), "gallery", id), payload);
}

export async function deleteGalleryImage(item: Pick<GalleryImage, "id" | "storagePath">) {
  if (item.storagePath) {
    try {
      await deleteObject(ref(getStorageBucket(), item.storagePath));
    } catch {
      // File may already be gone; still remove metadata.
    }
  }
  await deleteDoc(doc(getDb(), "gallery", item.id));
}

const SITE_SETTINGS_ID = "public";

export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await getDoc(doc(getDb(), "siteSettings", SITE_SETTINGS_ID));
  if (!snap.exists()) return defaultSiteSettings();
  const mapped = mapSiteSettings(snap.data());
  return { ...mapped, updatedAt: toDate(snap.data().updatedAt) };
}

export async function saveSiteSettings(input: SiteSettingsInput) {
  const normalized = normalizeSiteSettingsInput(input);
  await setDoc(
    doc(getDb(), "siteSettings", SITE_SETTINGS_ID),
    {
      ...normalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
