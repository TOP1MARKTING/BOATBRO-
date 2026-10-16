import { createServerFn } from "@tanstack/react-start";
import { parseBearerToken, requireStaff, requireSuperAdmin } from "../server/shared/index.js";
import { handleAiDeleteAllConversations, handleAiDeleteConversation } from "../server/aiAdmin.js";
import { getAdminAuth, getAdminDb } from "../server/runtime.js";

type DeleteConversationInput = { conversationId: string; authorization?: string };

export const aiDeleteConversation = createServerFn({ method: "POST" })
  .validator((data: DeleteConversationInput) => data)
  .handler(async ({ data }) => {
    const token = parseBearerToken(data.authorization ?? null);
    if (!token) throw new Error("unauthorized");
    await requireStaff(getAdminAuth(), getAdminDb(), token);
    return handleAiDeleteConversation({ conversationId: data.conversationId });
  });

export const aiDeleteAllConversations = createServerFn({ method: "POST" })
  .validator((data: { authorization?: string }) => data)
  .handler(async ({ data }) => {
    const token = parseBearerToken(data.authorization ?? null);
    if (!token) throw new Error("unauthorized");
    await requireSuperAdmin(getAdminAuth(), token);
    return handleAiDeleteAllConversations();
  });
