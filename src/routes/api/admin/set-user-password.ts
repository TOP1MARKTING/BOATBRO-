import { createFileRoute } from "@tanstack/react-router";
import { setAuthUserPassword, verifySuperAdminRequest } from "../../../lib/server/firebase-admin";

export const Route = createFileRoute("/api/admin/set-user-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await verifySuperAdminRequest(request.headers.get("authorization"));
          const body = (await request.json()) as { uid?: string; password?: string };
          const uid = String(body.uid ?? "").trim();
          const password = String(body.password ?? "");
          if (!uid) {
            return new Response("missing-uid", { status: 400 });
          }
          await setAuthUserPassword(uid, password);
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "error";
          const status =
            message === "unauthorized" || message === "forbidden"
              ? 403
              : message === "missing-service-account"
                ? 503
                : message === "weak-password"
                  ? 400
                  : 500;
          return new Response(message, { status });
        }
      },
    },
  },
});
