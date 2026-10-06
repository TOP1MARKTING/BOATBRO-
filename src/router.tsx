import { createRouter } from "@tanstack/react-router";
import { ensureLocalePrefix, localeRewrite } from "./lib/locale-url";
import { routeTree } from "./routeTree.gen";

ensureLocalePrefix();

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  rewrite: localeRewrite,
});

export type AppRouter = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
