import { createServerFn } from "@tanstack/react-start";
import { parseBearerToken, requireStaff } from "../server/shared/index.js";
import { handleAiTriggerKnowledgeSync } from "../server/chatbot.js";
import { getAdminAuth, getAdminDb } from "../server/runtime.js";

type AuthedInput = { authorization?: string };

export const aiTriggerKnowledgeSync = createServerFn({ method: "POST" })
  .validator((data: AuthedInput) => data)
  .handler(async ({ data }) => {
    const token = parseBearerToken(data.authorization ?? null);
    if (!token) throw new Error("unauthorized");
    await requireStaff(getAdminAuth(), getAdminDb(), token);
    return handleAiTriggerKnowledgeSync();
  });
