import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "./constants.js";
import type { KnowledgeChunk } from "./types.js";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 2);
}

export async function loadKnowledgeChunks(db: Firestore, limit = 48): Promise<KnowledgeChunk[]> {
  const snap = await db.collection(COLLECTIONS.knowledge).orderBy("updatedAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => doc.data() as KnowledgeChunk);
}

export function rankKnowledgeChunks(chunks: KnowledgeChunk[], query: string, take = 5): KnowledgeChunk[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return chunks.slice(0, take);

  return [...chunks]
    .map((chunk) => {
      const haystack = `${chunk.title} ${chunk.body}`.toLowerCase();
      let score = 0;
      for (const token of queryTokens) {
        if (haystack.includes(token)) score += 1;
      }
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((entry) => entry.chunk);
}

export async function syncKnowledgeBase(db: Firestore): Promise<number> {
  const now = new Date().toISOString();
  const batch = db.batch();
  let count = 0;

  const settingsDoc = await db.collection(COLLECTIONS.siteSettings).doc("public").get();
  if (settingsDoc.exists) {
    const data = settingsDoc.data() ?? {};
    const body = [
      data.taglineAr,
      data.taglineEn,
      data.descriptionAr,
      data.descriptionEn,
      data.whatsapp,
      data.supportEmail,
    ]
      .filter(Boolean)
      .join("\n");
    if (body.trim()) {
      const ref = db.collection(COLLECTIONS.knowledge).doc("site-settings");
      batch.set(ref, {
        id: ref.id,
        source: "siteSettings/public",
        title: "BoatPro site settings",
        body: body.slice(0, 8000),
        updatedAt: now,
      });
      count += 1;
    }
  }

  const postsSnap = await db.collection(COLLECTIONS.posts).where("published", "==", true).limit(48).get();
  for (const doc of postsSnap.docs) {
    const data = doc.data();
    const title = String(data.metaTitleI18n?.ar ?? data.titleI18n?.ar ?? data.slug ?? doc.id);
    const body = [
      data.metaDescriptionI18n?.ar,
      data.metaDescriptionI18n?.en,
      data.excerptI18n?.ar,
      data.excerptI18n?.en,
      data.contentI18n?.ar,
      data.contentI18n?.en,
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 8000);
    if (!body.trim()) continue;
    const ref = db.collection(COLLECTIONS.knowledge).doc(`post-${doc.id}`);
    batch.set(ref, {
      id: ref.id,
      source: `posts/${doc.id}`,
      title,
      body,
      updatedAt: now,
    });
    count += 1;
  }

  batch.set(db.collection(COLLECTIONS.knowledge).doc("_meta"), {
    id: "_meta",
    source: "system",
    title: "Knowledge sync metadata",
    body: `Last sync ${now}`,
    updatedAt: now,
  });

  await batch.commit();
  return count;
}
