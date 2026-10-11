import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, Mail, Shield } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { ADMIN_BTN_PRIMARY, ADMIN_FIELD_CLS } from "../components/admin/shared";
import { Logo, SHELL } from "../components/brand";
import { LangToggle } from "../components/lang-toggle";
import { ThemeToggle } from "../components/theme-toggle";
import { Photo } from "../components/photo";
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
    <main dir={dir} className="relative isolate min-h-svh overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--gold)_14%,transparent),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(15,40,70,0.08),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_20%_10%,color-mix(in_oklab,var(--gold)_16%,transparent),transparent_45%),radial-gradient(ellipse_at_80%_90%,rgba(40,90,140,0.2),transparent_50%)]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className={`${SHELL} flex h-[84px] items-center justify-between`}>
          <Link to="/" aria-label="BoatPro" className="flex items-center gap-3">
            <Logo />
            <span className="hidden font-display text-[14px] tracking-[0.22em] text-navy sm:block">BOATPRO</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangToggle />
            <Link
              to="/"
              className="rounded-full border border-border bg-card px-5 py-2.5 text-[12px] font-medium tracking-wide text-navy transition-colors hover:border-gold/55 hover:text-gold-ink"
            >
              {t.auth.home}
            </Link>
          </div>
        </div>
      </header>

      <section className={`${SHELL} relative z-10 flex min-h-[calc(100svh-84px)] items-center py-10 sm:py-14`}>
        <div className="grid w-full items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative hidden min-h-[560px] overflow-hidden rounded-[1.75rem] border border-gold/30 bg-card shadow-[0_30px_70px_-36px_rgba(15,40,70,0.45)] lg:block">
            <Photo
              name="luxury-marina"
              alt={lang === "ar" ? "مرسى فاخر — دخول إدارة بوت برو" : "Luxury marina — BoatPro admin access"}
              className="absolute inset-0 h-full w-full object-cover object-center"
              sizes="(min-width: 1024px) 45vw, 100vw"
              eager
              width={960}
              height={1200}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 lg:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-gold/20 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-white">
                <Shield size={13} strokeWidth={1.75} />
                {chip}
              </span>
              <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-white">BoatPro</h2>
              <div className="mt-3 h-px w-14 bg-gradient-to-r from-gold to-transparent" />
              <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">{body}</p>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md items-center lg:mx-0 lg:max-w-none">
            <div className="w-full animate-fade-up rounded-[1.75rem] border border-gold/25 bg-card p-6 shadow-[0_24px_60px_-28px_rgba(15,40,70,0.28)] sm:p-8 lg:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/12 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-gold-ink">
                <Shield size={12} strokeWidth={1.75} />
                {chip}
              </span>
              <div className="mt-5 h-px w-12 bg-gradient-to-r from-gold to-transparent" />
              <h1 className="mt-5 font-display text-[clamp(1.75rem,3.2vw,2.35rem)] font-semibold leading-snug tracking-tight text-navy">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px] sm:leading-8 lg:hidden">{body}</p>

              <form onSubmit={(e) => void onSubmit(e)} className="mt-8 grid gap-5">
                <label htmlFor="login-email" className="block">
                  <span className="mb-2 flex items-center gap-2 text-[12px] font-medium text-navy">
                    <Mail size={13} strokeWidth={1.75} className="text-gold-ink" />
                    {t.auth.email}
                  </span>
                  <input
                    required
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={ADMIN_FIELD_CLS}
                  />
                </label>
                <label htmlFor="login-password" className="block">
                  <span className="mb-2 flex items-center gap-2 text-[12px] font-medium text-navy">
                    <LockKeyhole size={13} strokeWidth={1.75} className="text-gold-ink" />
                    {t.auth.password}
                  </span>
                  <input
                    required
                    id="login-password"
                    name="password"
                    type="password"
                    minLength={6}
                    autoComplete="current-password"
                    className={ADMIN_FIELD_CLS}
                  />
                </label>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}

                <button type="submit" disabled={busy} className={`${ADMIN_BTN_PRIMARY} mt-1 w-full`}>
                  {submitLabel}
                  {!busy ? <ArrowRight size={16} className={dir === "rtl" ? "rotate-180" : ""} /> : null}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
