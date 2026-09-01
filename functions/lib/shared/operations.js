import { randomUUID } from "node:crypto";
import { COLLECTIONS } from "./constants.js";
import { generateChatReply } from "./gemini.js";
import { loadKnowledgeChunks, rankKnowledgeChunks } from "./knowledge.js";
export async function chatbotSendMessage(input) {
    const conversationId = input.payload.conversationId?.trim() || randomUUID();
    const lang = input.payload.lang ?? "ar";
    const now = new Date().toISOString();
    const ref = input.db.collection(COLLECTIONS.conversations).doc(conversationId);
    const existing = await ref.get();
    const history = (existing.exists ? existing.data()?.messages : []) ?? [];
    const knowledge = rankKnowledgeChunks(await loadKnowledgeChunks(input.db), input.payload.message, 5);
    const reply = await generateChatReply({
        apiKey: input.geminiApiKey,
        lang,
        message: input.payload.message,
        history: history.map((entry) => ({ role: entry.role, content: entry.content })),
        knowledge,
    });
    const messages = [
        ...history,
        { role: "user", content: input.payload.message, at: now },
        { role: "model", content: reply, at: new Date().toISOString() },
    ].slice(-40);
    await ref.set({
        id: conversationId,
        lang,
        sessionId: input.payload.sessionId ?? null,
        updatedAt: new Date().toISOString(),
        createdAt: existing.exists ? existing.data()?.createdAt ?? now : now,
        messages,
    }, { merge: true });
    return {
        conversationId,
        reply,
        sources: knowledge.map((chunk) => ({ id: chunk.id, title: chunk.title })),
    };
}
export async function chatbotSubmitContact(input) {
    const now = new Date().toISOString();
    const ref = input.db.collection(COLLECTIONS.contactRequests).doc();
    await ref.set({
        name: input.payload.name,
        email: input.payload.email,
        phone: input.payload.phone,
        content: input.payload.content,
        userType: input.payload.userType ?? "chatbot",
        status: "new",
        lang: input.payload.lang ?? "ar",
        source: "chatbot",
        conversationId: input.payload.conversationId ?? null,
        createdAt: now,
    });
    return { ok: true, contactId: ref.id };
}
export async function aiTriggerKnowledgeSync(input) {
    const synced = await import("./knowledge.js").then((m) => m.syncKnowledgeBase(input.db));
    return { ok: true, synced };
}
export async function aiDeleteConversation(input) {
    await input.db.collection(COLLECTIONS.conversations).doc(input.conversationId).delete();
    return { ok: true };
}
export async function aiDeleteAllConversations(input) {
    const snap = await input.db.collection(COLLECTIONS.conversations).limit(500).get();
    const batch = input.db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return { ok: true, deleted: snap.size };
}
export async function adminSetUserPassword(input) {
    await input.auth.updateUser(input.uid, { password: input.password });
    return { ok: true };
}
