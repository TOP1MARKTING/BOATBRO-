import { adminSetUserPassword as adminSetUserPasswordOp } from "../../functions/src/shared/operations.js";
import { parseAdminSetPasswordInput } from "../../functions/src/shared/validation.js";
import { getAdminAuth } from "./runtime.js";

export async function handleAdminSetUserPassword(body: unknown) {
  const payload = parseAdminSetPasswordInput(body);
  return adminSetUserPasswordOp({
    auth: getAdminAuth(),
    uid: payload.uid,
    password: payload.password,
  });
}
