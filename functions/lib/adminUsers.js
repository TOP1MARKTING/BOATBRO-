import { getAuth } from "firebase-admin/auth";
import { onRequest } from "firebase-functions/v2/https";
import { parseBearerToken, requireSuperAdmin } from "./shared/auth.js";
import { CORS_ORIGINS } from "./shared/constants.js";
import { handleHttpOperation, readJsonBody } from "./shared/http.js";
import { adminSetUserPassword } from "./shared/operations.js";
import { parseAdminSetPasswordInput } from "./shared/validation.js";
export const adminSetUserPasswordFn = onRequest({ cors: CORS_ORIGINS, maxInstances: 5 }, async (req, res) => {
    await handleHttpOperation(req, res, async () => {
        const token = parseBearerToken(req.headers.authorization);
        if (!token)
            throw new Error("unauthorized");
        await requireSuperAdmin(getAuth(), token);
        const payload = parseAdminSetPasswordInput(readJsonBody(req));
        return adminSetUserPassword({
            auth: getAuth(),
            uid: payload.uid,
            password: payload.password,
        });
    });
});
