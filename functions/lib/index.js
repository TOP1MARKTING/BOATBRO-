import { initializeApp } from "firebase-admin/app";
initializeApp();
export { chatbotSendMessageFn as chatbotSendMessage } from "./chatbot.js";
export { chatbotSubmitContactFn as chatbotSubmitContact } from "./chatbot.js";
export { aiTriggerKnowledgeSyncFn as aiTriggerKnowledgeSync } from "./chatbot.js";
export { aiDeleteConversationFn as aiDeleteConversation } from "./aiAdmin.js";
export { aiDeleteAllConversationsFn as aiDeleteAllConversations } from "./aiAdmin.js";
export { adminSetUserPasswordFn as adminSetUserPassword } from "./adminUsers.js";
// Backward-compatible alias from Phase 1 scaffold
export { adminSetUserPasswordFn as setUserPassword } from "./adminUsers.js";
