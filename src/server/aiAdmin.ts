import {
  aiDeleteAllConversations as aiDeleteAllConversationsOp,
  aiDeleteConversation as aiDeleteConversationOp,
} from "../../functions/src/shared/operations.js";
import { parseDeleteConversationInput } from "../../functions/src/shared/validation.js";
import { getAdminDb } from "./runtime.js";

export async function handleAiDeleteConversation(body: unknown) {
  const payload = parseDeleteConversationInput(body);
  return aiDeleteConversationOp({ db: getAdminDb(), conversationId: payload.conversationId });
}

export async function handleAiDeleteAllConversations() {
  return aiDeleteAllConversationsOp({ db: getAdminDb() });
}
