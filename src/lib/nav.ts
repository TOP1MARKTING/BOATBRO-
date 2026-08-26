export const NAV = [
  { key: "home", to: "/" },
  { key: "about", to: "/about" },
  { key: "features", to: "/features" },
  { key: "app", to: "/app" },
  { key: "blog", to: "/blog" },
  { key: "contact", to: "/contact" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];
