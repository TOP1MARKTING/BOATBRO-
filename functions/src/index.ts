import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { onRequest, type Request } from "firebase-functions/v2/https";
import type { Response } from "express";

initializeApp();

const SUPER_ADMIN_EMAIL = "admin@boatpro.club";

export const setUserPassword = onRequest({ cors: true, maxInstances: 5 }, async (req: Request, res: Response) => {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("method-not-allowed");
    return;
  }

  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      res.status(403).send("unauthorized");
      return;
    }

    const decoded = await getAuth().verifyIdToken(authorization.slice(7));
    if (decoded.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      res.status(403).send("forbidden");
      return;
    }

    const uid = String(req.body?.uid ?? "").trim();
    const password = String(req.body?.password ?? "");
    if (!uid) {
      res.status(400).send("missing-uid");
      return;
    }
    if (password.length < 6) {
      res.status(400).send("weak-password");
      return;
    }

    await getAuth().updateUser(uid, { password });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("error");
  }
});
