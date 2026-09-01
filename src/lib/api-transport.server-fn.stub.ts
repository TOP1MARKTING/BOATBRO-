import type { ApiOperation } from "./api-types.js";

export async function callServerFnTransport<T>(
  _operation: ApiOperation,
  _body: Record<string, unknown>,
): Promise<T> {
  throw new Error("server-fn-transport-unavailable");
}
