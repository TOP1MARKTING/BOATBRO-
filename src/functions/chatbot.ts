import { createServerFn } from "@tanstack/react-start";
import type { ChatMessageInput, ChatbotContactInput } from "../server/shared/index.js";
import { handleChatbotSendMessage, handleChatbotSubmitContact } from "../server/chatbot.js";

export const chatbotSendMessage = createServerFn({ method: "POST" })
  .validator((data: ChatMessageInput) => data)
  .handler(async ({ data }) => handleChatbotSendMessage(data));

export const chatbotSubmitContact = createServerFn({ method: "POST" })
  .validator((data: ChatbotContactInput) => data)
  .handler(async ({ data }) => handleChatbotSubmitContact(data));
