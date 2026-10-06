import { HeadContent, Link, Outlet, createRootRoute, useRouter } from "@tanstack/react-router";
import { Fragment, useEffect } from "react";
import { AuthProvider } from "../lib/auth";
import { PageContentProvider } from "../lib/page-content-context";
import { SiteSettingsProvider } from "../lib/site-settings-context";
import { LanguageProvider, useLang } from "../lib/i18n";
import { getUrlLang, localizePath } from "../lib/locale-url";
import { ThemeProvider } from "../lib/theme";
import { ScrollToTop } from "../components/scroll-to-top";

function NotFoundComponent() {
  const { t, lang } = useLang();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold">{lang === "ar" ? "٤٠٤" : "404"}</h1>
        <h2 className="mt-4 font-display text-xl text-foreground">{t.notFound.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.notFound.body}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.notFound.home}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">تعذّر تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حدث خطأ غير متوقع. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            حاول مرة أخرى
          </button>
          <a
            href={localizePath("/", getUrlLang())}
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { lang, localized } = useLang();
  return (
    <>
      <HeadContent />
      <ScrollToTop />
      {/* Links cache their href per internal path, so public pages remount when /ar ↔ /en changes. */}
      <Fragment key={localized ? lang : "static"}>
        <Outlet />
      </Fragment>
    </>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "بوت برو | BoatPro" },
      { name: "author", content: "شركة بوت برو" },
      { name: "application-name", content: "BoatPro" },
      { name: "apple-mobile-web-app-title", content: "BoatPro" },
    ],
    links: [
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  component: () => (
    <ThemeProvider>
      <PageContentProvider>
        <LanguageProvider>
          <AuthProvider>
            <SiteSettingsProvider>
              <AppShell />
            </SiteSettingsProvider>
          </AuthProvider>
        </LanguageProvider>
      </PageContentProvider>
    </ThemeProvider>
  ),
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
