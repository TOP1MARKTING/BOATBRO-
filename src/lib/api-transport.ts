import type { ApiOperation } from "./api-types.js";
import { callServerFnTransport } from "./api-transport.server-fn.stub.js";

export type ApiTransport = "http" | "server-fn";

export type { ApiOperation };

function transportMode(): ApiTransport {
  const mode = import.meta.env["VITE_API_TRANSPORT"];
  return mode === "http" ? "http" : "server-fn";
}

function functionsBaseUrl() {
  const base = import.meta.env["VITE_FUNCTIONS_BASE_URL"];
  if (typeof base !== "string" || !base.startsWith("http")) {
    throw new Error("missing-functions-base-url");
  }
  return base.replace(/\/$/, "");
}

async function callHttp<T>(operation: ApiOperation, body: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;

  const res = await fetch(`${functionsBaseUrl()}/${operation}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${operation}-failed`);
  }
  return (await res.json()) as T;
}

type AuthedBody = Record<string, unknown> & { authorization?: string };

export async function callApi<T>(
  operation: ApiOperation,
  body: AuthedBody = {},
  token?: string,
): Promise<T> {
  const authedBody = token ? { ...body, authorization: `Bearer ${token}` } : body;

  if (transportMode() === "http") {
    return callHttp<T>(operation, authedBody, token);
  }

  return callServerFnTransport<T>(operation, authedBody);
}
