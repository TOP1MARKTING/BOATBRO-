import {
  chatbotSendMessage as chatbotSendMessageOp,
  chatbotSubmitContact as chatbotSubmitContactOp,
  aiTriggerKnowledgeSync as aiTriggerKnowledgeSyncOp,
} from "../../functions/src/shared/operations.js";
import {
  parseChatMessageInput,
  parseChatbotContactInput,
} from "../../functions/src/shared/validation.js";
import { getAdminDb, getGeminiApiKey } from "./runtime.js";

export async function handleChatbotSendMessage(body: unknown) {
  return chatbotSendMessageOp({
    db: getAdminDb(),
    geminiApiKey: getGeminiApiKey(),
    payload: parseChatMessageInput(body),
  });
}

export async function handleChatbotSubmitContact(body: unknown) {
  return chatbotSubmitContactOp({
    db: getAdminDb(),
    payload: parseChatbotContactInput(body),
  });
}

export async function handleAiTriggerKnowledgeSync() {
  return aiTriggerKnowledgeSyncOp({ db: getAdminDb() });
}
