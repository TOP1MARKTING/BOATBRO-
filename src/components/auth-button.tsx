import { Link } from "@tanstack/react-router";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";

export function AuthButton({
  variant = "header",
  onNavigate,
}: {
  variant?: "header" | "menu";
  onNavigate?: () => void;
}) {
  const { user, ready, logout } = useAuth();
  const { t } = useLang();

  const headerCls =
    "hidden rounded-full border border-gold/55 px-5 py-2.5 text-[13px] font-medium text-gold-ink transition-colors hover:bg-gold hover:text-white sm:block";
  const menuCls =
    "mt-auto block w-full rounded-full bg-gold py-3.5 text-center text-sm font-medium text-white hover:bg-gold/85";

  if (!ready) {
    return variant === "header"
      ? <span className="hidden h-[42px] w-28 rounded-full bg-muted sm:block" />
      : <span className="mt-auto block h-12 w-full rounded-full bg-muted" />;
  }

  if (user) {
    const label = t.auth.logout;
    if (variant === "menu") {
      return (
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void logout();
          }}
          className={menuCls}
        >
          {label}
        </button>
      );
    }
    return (
      <button type="button" onClick={() => void logout()} className={headerCls}>
        {label}
      </button>
    );
  }

  if (variant === "menu") {
    return (
      <Link to="/login" search={{ redirect: undefined }} onClick={onNavigate} className={menuCls}>
        {t.cta.membership}
      </Link>
    );
  }

  return (
    <Link to="/login" search={{ redirect: undefined }} className={headerCls}>
      {t.cta.membership}
    </Link>
  );
}
