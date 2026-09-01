import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { parseBearerToken, requireStaff } from "./shared/auth.js";
import { CORS_ORIGINS } from "./shared/constants.js";
import { handleHttpOperation, readJsonBody } from "./shared/http.js";
import {
  chatbotSendMessage,
  chatbotSubmitContact,
} from "./shared/operations.js";
import {
  parseChatMessageInput,
  parseChatbotContactInput,
} from "./shared/validation.js";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const chatbotSendMessageFn = onRequest(
  { cors: CORS_ORIGINS, secrets: [geminiApiKey], maxInstances: 10 },
  async (req, res) => {
    await handleHttpOperation(req, res, async () => {
      const payload = parseChatMessageInput(readJsonBody(req));
      return chatbotSendMessage({
        db: getFirestore(),
        geminiApiKey: geminiApiKey.value(),
        payload,
      });
    });
  },
);

export const chatbotSubmitContactFn = onRequest(
  { cors: CORS_ORIGINS, maxInstances: 10 },
  async (req, res) => {
    await handleHttpOperation(req, res, async () => {
      const payload = parseChatbotContactInput(readJsonBody(req));
      return chatbotSubmitContact({ db: getFirestore(), payload });
    });
  },
);

export const aiTriggerKnowledgeSyncFn = onRequest(
  { cors: CORS_ORIGINS, maxInstances: 3 },
  async (req, res) => {
    await handleHttpOperation(req, res, async () => {
      const token = parseBearerToken(req.headers.authorization);
      if (!token) throw new Error("unauthorized");
      await requireStaff(getAuth(), getFirestore(), token);
      return import("./shared/operations.js").then((m) =>
        m.aiTriggerKnowledgeSync({ db: getFirestore() }),
      );
    });
  },
);
