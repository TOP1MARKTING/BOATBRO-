import fs from "node:fs";
import path from "node:path";

const routesDir = path.resolve("src/routes");

function routeFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(filePath);
    return /\.(?:tsx|ts|jsx|js)$/.test(entry.name) ? [filePath] : [];
  });
}

export function discoverPublicRoutes() {
  const routes = new Set();

  for (const filePath of routeFiles(routesDir)) {
    const source = fs.readFileSync(filePath, "utf8");
    const route = source.match(/createFileRoute\(\s*["']([^"']+)["']\s*\)/)?.[1];
    if (!route || route.includes("$") || /noindex\s*:\s*true/.test(source)) continue;

    const normalized = route === "/" ? "/" : `/${route.split("/").filter(Boolean).join("/")}`;
    routes.add(normalized);
  }

  if (!routes.has("/")) {
    throw new Error(`Could not discover the public home route in ${routesDir}`);
  }

  return [...routes].sort((a, b) => a.localeCompare(b));
}
