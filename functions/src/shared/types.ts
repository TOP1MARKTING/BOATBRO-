export type Lang = "ar" | "en";

export type ChatMessageInput = {
  conversationId?: string;
  message: string;
  lang?: Lang;
  sessionId?: string;
};

export type ChatMessageResult = {
  conversationId: string;
  reply: string;
  sources: Array<{ id: string; title: string }>;
};

export type ChatbotContactInput = {
  conversationId?: string;
  name: string;
  email: string;
  phone: string;
  content: string;
  lang?: Lang;
  userType?: string;
};

export type KnowledgeSyncResult = {
  ok: true;
  synced: number;
};

export type DeleteConversationInput = {
  conversationId: string;
};

export type DeleteAllConversationsResult = {
  ok: true;
  deleted: number;
};

export type AdminSetPasswordInput = {
  uid: string;
  password: string;
};

export type AuthUser = {
  uid: string;
  email: string | null;
};

export type KnowledgeChunk = {
  id: string;
  source: string;
  title: string;
  body: string;
  updatedAt: string;
};
