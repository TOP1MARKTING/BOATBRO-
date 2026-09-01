import type { ApiOperation } from "./api-types.js";
import {
  adminSetUserPassword,
  aiDeleteAllConversations,
  aiDeleteConversation,
  aiTriggerKnowledgeSync,
  chatbotSendMessage,
  chatbotSubmitContact,
} from "../functions/index.js";

type AuthedBody = Record<string, unknown> & { authorization?: string };

export async function callServerFnTransport<T>(
  operation: ApiOperation,
  body: AuthedBody,
): Promise<T> {
  switch (operation) {
    case "chatbotSendMessage":
      return chatbotSendMessage({ data: body as never }) as Promise<T>;
    case "chatbotSubmitContact":
      return chatbotSubmitContact({ data: body as never }) as Promise<T>;
    case "aiTriggerKnowledgeSync":
      return aiTriggerKnowledgeSync({ data: body as never }) as Promise<T>;
    case "aiDeleteConversation":
      return aiDeleteConversation({ data: body as never }) as Promise<T>;
    case "aiDeleteAllConversations":
      return aiDeleteAllConversations({ data: body as never }) as Promise<T>;
    case "adminSetUserPassword":
      return adminSetUserPassword({ data: body as never }) as Promise<T>;
    default:
      throw new Error("unknown-operation");
  }
}
