import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import "./styles.css";
import { initAnalytics } from "./lib/firebase";
import { installPostImageFallback } from "./lib/post-images";

initAnalytics();
installPostImageFallback();

// Head tags injected by public/seo/blog.php for crawlers; the router renders the same tags client-side.
document.querySelectorAll("[data-seo-ssr]").forEach((node) => node.remove());

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
