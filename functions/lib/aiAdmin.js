import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { parseBearerToken, requireStaff, requireSuperAdmin } from "./shared/auth.js";
import { CORS_ORIGINS } from "./shared/constants.js";
import { handleHttpOperation, readJsonBody } from "./shared/http.js";
import { aiDeleteAllConversations, aiDeleteConversation } from "./shared/operations.js";
import { parseDeleteConversationInput } from "./shared/validation.js";
export const aiDeleteConversationFn = onRequest({ cors: CORS_ORIGINS, maxInstances: 5 }, async (req, res) => {
    await handleHttpOperation(req, res, async () => {
        const token = parseBearerToken(req.headers.authorization);
        if (!token)
            throw new Error("unauthorized");
        await requireStaff(getAuth(), getFirestore(), token);
        const payload = parseDeleteConversationInput(readJsonBody(req));
        return aiDeleteConversation({ db: getFirestore(), conversationId: payload.conversationId });
    });
});
export const aiDeleteAllConversationsFn = onRequest({ cors: CORS_ORIGINS, maxInstances: 3 }, async (req, res) => {
    await handleHttpOperation(req, res, async () => {
        const token = parseBearerToken(req.headers.authorization);
        if (!token)
            throw new Error("unauthorized");
        await requireSuperAdmin(getAuth(), token);
        return aiDeleteAllConversations({ db: getFirestore() });
    });
});
