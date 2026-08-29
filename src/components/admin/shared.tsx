import type { ReactNode } from "react";

export const ADMIN_FIELD_CLS =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/15";

export function AdminStatCard({
  label,
  value,
  hint,
  onClick,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  onClick?: () => void;
  tone?: "default" | "warn" | "success";
}) {
  const toneCls =
    tone === "warn"
      ? "border-amber-500/30 bg-amber-500/5"
      : tone === "success"
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-border bg-card";
  const cls = `rounded-2xl border p-5 text-start shadow-[0_10px_30px_-24px_rgba(15,40,70,0.35)] transition-all sm:p-6 ${toneCls}`;
  const inner = (
    <>
      <p className="text-[12px] font-medium tracking-[0.12em] text-gold-ink">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-2 text-[12px] text-muted-foreground">{hint}</p> : null}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} hover:-translate-y-0.5 hover:border-gold/40`}>
        {inner}
      </button>
    );
  }
  return <article className={cls}>{inner}</article>;
}

export function AdminPanelShell({
  title,
  action,
  children,
  hideTitle = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  hideTitle?: boolean;
}) {
  const showBar = !hideTitle || Boolean(action);
  return (
    <div>
      {showBar ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {hideTitle ? <span className="sr-only">{title}</span> : (
            <h2 className="font-display text-2xl font-semibold text-navy">{title}</h2>
          )}
          {action}
        </div>
      ) : (
        <span className="sr-only">{title}</span>
      )}
      {children}
    </div>
  );
}

export function AdminSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-2/50 p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
        {hint ? <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminFilterBar({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="mb-5 flex flex-wrap items-center gap-3">{children}</div>;
}
