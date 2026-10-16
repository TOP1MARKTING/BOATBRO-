import { createServerFn } from "@tanstack/react-start";
import { parseBearerToken, requireSuperAdmin } from "../server/shared/index.js";
import { handleAdminSetUserPassword } from "../server/adminUsers.js";
import { getAdminAuth } from "../server/runtime.js";

type AdminSetPasswordInput = {
  uid: string;
  password: string;
  authorization?: string;
};

export const adminSetUserPassword = createServerFn({ method: "POST" })
  .validator((data: AdminSetPasswordInput) => data)
  .handler(async ({ data }) => {
    const token = parseBearerToken(data.authorization ?? null);
    if (!token) throw new Error("unauthorized");
    await requireSuperAdmin(getAdminAuth(), token);
    return handleAdminSetUserPassword({ uid: data.uid, password: data.password });
  });
