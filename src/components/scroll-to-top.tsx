import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useLayoutEffect } from "react";

function resetWindowScroll() {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  html.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.querySelectorAll("main").forEach((el) => {
    el.scrollTop = 0;
  });
  html.style.scrollBehavior = prev;
}

function jumpToHashOrTop(hash: string) {
  const id = hash.replace(/^#/, "");
  if (id) {
    const el = document.getElementById(id);
    if (el) {
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      el.scrollIntoView({ behavior: "auto", block: "start" });
      html.style.scrollBehavior = prev;
      return;
    }
  }
  resetWindowScroll();
}

export function ScrollToTop() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    jumpToHashOrTop(hash);
    const frame = window.requestAnimationFrame(() => jumpToHashOrTop(hash));
    const retries = [0, 80, 200, 400].map((ms) =>
      window.setTimeout(() => jumpToHashOrTop(hash), ms),
    );
    return () => {
      window.cancelAnimationFrame(frame);
      retries.forEach((id) => window.clearTimeout(id));
    };
  }, [pathname, hash]);

  useEffect(() => {
    const onNav = (event: { toLocation: { hash: string } }) => {
      jumpToHashOrTop(event.toLocation.hash);
    };
    const unsubBefore = router.subscribe("onBeforeNavigate", onNav);
    const unsubResolved = router.subscribe("onResolved", onNav);
    const unsubRendered = router.subscribe("onRendered", onNav);
    return () => {
      unsubBefore();
      unsubResolved();
      unsubRendered();
    };
  }, [router]);

  return null;
}
