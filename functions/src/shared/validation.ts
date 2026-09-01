import type {
  AdminSetPasswordInput,
  ChatMessageInput,
  ChatbotContactInput,
  DeleteConversationInput,
  Lang,
} from "./types.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  if (!text || text.length > max) return null;
  return text;
}

function asLang(value: unknown): Lang {
  return value === "en" ? "en" : "ar";
}

export function parseChatMessageInput(body: unknown): ChatMessageInput {
  const data = (body ?? {}) as Record<string, unknown>;
  const message = asString(data.message, 2000);
  if (!message) throw new Error("invalid-message");
  const conversationId = asString(data.conversationId, 128) ?? undefined;
  const sessionId = asString(data.sessionId, 128) ?? undefined;
  return {
    message,
    lang: asLang(data.lang),
    ...(conversationId ? { conversationId } : {}),
    ...(sessionId ? { sessionId } : {}),
  };
}

export function parseChatbotContactInput(body: unknown): ChatbotContactInput {
  const data = (body ?? {}) as Record<string, unknown>;
  const name = asString(data.name, 120);
  const email = asString(data.email, 120);
  const phone = asString(data.phone, 40);
  const content = asString(data.content, 2000);
  if (!name || !email || !phone || !content) throw new Error("invalid-contact");
  if (!EMAIL_RE.test(email)) throw new Error("invalid-email");
  const conversationId = asString(data.conversationId, 128) ?? undefined;
  const userType = asString(data.userType, 80) ?? "chatbot";
  return {
    name,
    email,
    phone,
    content,
    lang: asLang(data.lang),
    userType,
    ...(conversationId ? { conversationId } : {}),
  };
}

export function parseDeleteConversationInput(body: unknown): DeleteConversationInput {
  const data = (body ?? {}) as Record<string, unknown>;
  const conversationId = asString(data.conversationId, 128);
  if (!conversationId) throw new Error("missing-conversation-id");
  return { conversationId };
}

export function parseAdminSetPasswordInput(body: unknown): AdminSetPasswordInput {
  const data = (body ?? {}) as Record<string, unknown>;
  const uid = asString(data.uid, 128);
  const password = String(data.password ?? "");
  if (!uid) throw new Error("missing-uid");
  if (password.length < 6) throw new Error("weak-password");
  return { uid, password };
}
