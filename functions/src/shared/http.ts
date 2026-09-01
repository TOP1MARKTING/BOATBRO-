import type { Request, Response } from "express";

export function applyCors(req: Request, res: Response) {
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin.length > 0) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export function readJsonBody<T>(req: Request): T {
  if (req.body && typeof req.body === "object") return req.body as T;
  return {} as T;
}

export function mapErrorToStatus(message: string) {
  if (message === "unauthorized" || message === "forbidden") return 403;
  if (
    message === "invalid-message" ||
    message === "invalid-contact" ||
    message === "invalid-email" ||
    message === "missing-conversation-id" ||
    message === "missing-uid" ||
    message === "weak-password"
  ) {
    return 400;
  }
  if (message.startsWith("gemini-error:")) return 502;
  return 500;
}

export async function handleHttpOperation(
  req: Request,
  res: Response,
  handler: () => Promise<unknown>,
) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("method-not-allowed");
    return;
  }
  try {
    const result = await handler();
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "error";
    console.error(error);
    res.status(mapErrorToStatus(message)).send(message);
  }
}
