import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Logo, SHELL } from "../components/brand";
import { LangToggle } from "../components/lang-toggle";
import { ThemeToggle } from "../components/theme-toggle";
import { Photo } from "../components/photo";
import { GoldLine } from "../components/ui";
import { mapAuthError, useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { pageHead } from "../lib/site";

type LoginSearch = {
  /** Clean destination key, e.g. `admin` → `/login?to=admin` */
  to?: "admin";
  /** Legacy path redirect, still accepted */
  redirect?: string;
};

function isAdminSearch(search: LoginSearch) {
  return search.to === "admin" || search.redirect === "/admin";
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const to = search.to === "admin" ? "admin" : undefined;
    const redirect =
      typeof search.redirect === "string" &&
      search.redirect.startsWith("/") &&
      !search.redirect.startsWith("//")
        ? search.redirect
        : undefined;
    return { to, redirect };
  },
  head: () =>
    pageHead({
      title: "دخول الإدارة | بوت برو",
      description: "سجّل الدخول للوصول إلى لوحة تحكم بوت برو.",
      path: "/login",
      noindex: true,
    }),
  component: LoginPage,
});

const fieldCls =
  "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-gold focus:ring-2 focus:ring-gold/15";

function LoginPage() {
  const { dir, lang, t } = useLang();
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const toAdmin = isAdminSearch(search);

  // Public marketing site: visitor login lives elsewhere. Keep this route for staff only.
  useEffect(() => {
    if (!toAdmin) void navigate({ to: "/" });
  }, [toAdmin, navigate]);

  const next = "/admin";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) void navigate({ to: next });
  }, [ready, user, navigate, next]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    setBusy(true);
    try {
      await login(email, password);
      await navigate({ to: next });
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
      setError(mapAuthError(code, lang));
    } finally {
      setBusy(false);
    }
  };

  if (!toAdmin) {
    return (
      <main dir={dir} className="grid min-h-svh place-items-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">{lang === "ar" ? "جاري التحويل…" : "Redirecting…"}</p>
      </main>
    );
  }

  const title = t.auth.adminTitle;
  const body = t.auth.adminBody;
  const chip = t.auth.adminChip;
  const submitLabel = busy ? t.auth.working : t.auth.submitAdmin;

  return (
    <main dir={dir} className="relative isolate min-h-svh overflow-hidden bg-transparent text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(200,169,106,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(15,40,70,0.06),_transparent_50%)]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-border/70 bg-card/80 backdrop-blur-md">
        <div className={`${SHELL} flex h-[84px] items-center justify-between`}>
          <Link to="/" aria-label="BoatPro" className="flex items-center gap-3">
            <Logo />
            <span className="hidden font-display text-[14px] tracking-[0.2em] text-navy sm:block">BOATPRO</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangToggle />
            <Link
              to="/"
              className="rounded-full border border-border px-5 py-2.5 text-[12px] font-medium tracking-wide text-navy transition-colors hover:border-gold hover:text-gold"
            >
              {t.auth.home}
            </Link>
          </div>
        </div>
      </header>

      <section className={`${SHELL} relative z-10 flex min-h-[calc(100svh-84px)] items-center py-10 sm:py-14`}>
        <div className="grid w-full items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative hidden min-h-[520px] overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm lg:block">
            <Photo
              name="luxury-marina"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              sizes="(min-width: 1024px) 45vw, 100vw"
              eager
              width={960}
              height={1200}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <p className="text-[13px] font-medium tracking-[0.14em] text-gold-ink">{chip}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-navy">BoatPro</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md items-center lg:mx-0 lg:max-w-none">
            <div className="w-full animate-fade-up rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_24px_60px_-28px_rgba(15,40,70,0.22)] sm:p-8 lg:p-10">
              <p className="inline-flex rounded-full border border-gold/35 bg-gold/10 px-3.5 py-1 text-[12px] font-medium text-gold-ink">
                {chip}
              </p>
              <GoldLine className="mt-5" />
              <h1 className="mt-5 font-display text-[clamp(1.7rem,3.2vw,2.2rem)] font-semibold leading-snug text-navy">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px] sm:leading-8 lg:hidden">
                {body}
              </p>

              <form onSubmit={(e) => void onSubmit(e)} className="mt-7 grid gap-4">
                <label htmlFor="login-email">
                  <span className="mb-2 block text-[12px] font-medium text-navy">{t.auth.email}</span>
                  <input required id="login-email" name="email" type="email" autoComplete="email" className={fieldCls} />
                </label>
                <label htmlFor="login-password">
                  <span className="mb-2 block text-[12px] font-medium text-navy">{t.auth.password}</span>
                  <input
                    required
                    id="login-password"
                    name="password"
                    type="password"
                    minLength={6}
                    autoComplete="current-password"
                    className={fieldCls}
                  />
                </label>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-7 text-[14px] font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-60"
                >
                  {submitLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
