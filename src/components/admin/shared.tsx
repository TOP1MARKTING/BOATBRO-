import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Champagne gold accents for admin luxury surfaces (independent of site teal "gold"). */
export const ADMIN_LUX = {
  champagne: "#C8A96A",
  champagneSoft: "rgba(200,169,106,0.14)",
  champagneBorder: "rgba(200,169,106,0.35)",
  ink: "#0a1628",
  inkSoft: "#111c30",
  panel: "rgba(10,22,40,0.04)",
} as const;

export const ADMIN_FIELD_CLS =
  "w-full rounded-2xl border border-[#C8A96A]/25 bg-card px-4 py-3.5 text-sm text-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] outline-none transition-all placeholder:text-navy/35 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/20";

export const ADMIN_BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#D4B87A] via-[#C8A96A] to-[#A8894E] px-6 text-[13px] font-semibold text-[#0a1628] shadow-[0_12px_28px_-12px_rgba(200,169,106,0.65)] transition-all hover:brightness-105 disabled:opacity-60";

export const ADMIN_BTN_SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#C8A96A]/40 bg-card px-5 text-[13px] font-medium text-[#A8894E] transition-colors hover:border-[#C8A96A] hover:bg-[#C8A96A]/10 disabled:opacity-60";

export const ADMIN_BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60";

export const ADMIN_CARD_CLS =
  "rounded-[1.35rem] border border-[#C8A96A]/18 bg-card shadow-[0_14px_36px_-28px_rgba(10,22,40,0.4)]";

export const ADMIN_BADGE_ACTIVE =
  "rounded-full bg-[#C8A96A]/15 px-2.5 py-1 text-[11px] font-medium text-[#A8894E]";

export const ADMIN_BADGE_MUTED =
  "rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground";

export function AdminStatCard({
  label,
  value,
  hint,
  onClick,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  onClick?: () => void;
  tone?: "default" | "warn" | "success";
  icon?: LucideIcon;
}) {
  const toneCls =
    tone === "warn"
      ? "border-amber-500/35 bg-gradient-to-br from-amber-500/10 to-card"
      : tone === "success"
        ? "border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 to-card"
        : "border-[#C8A96A]/20 bg-gradient-to-br from-card via-card to-[rgba(200,169,106,0.06)]";
  const cls = `group relative overflow-hidden rounded-[1.35rem] border p-5 text-start shadow-[0_18px_40px_-28px_rgba(10,22,40,0.45)] transition-all sm:p-6 ${toneCls}`;
  const inner = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-6 -top-6 size-24 rounded-full bg-[#C8A96A]/10 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#A8894E] uppercase">{label}</p>
        {Icon ? (
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#A8894E]">
            <Icon size={16} strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <p className="relative mt-4 font-display text-4xl font-semibold tracking-tight text-navy">{value}</p>
      {hint ? <p className="relative mt-2 text-[12px] text-muted-foreground">{hint}</p> : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cls} hover:-translate-y-0.5 hover:border-[#C8A96A]/45 hover:shadow-[0_22px_44px_-24px_rgba(10,22,40,0.5)]`}
      >
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
          {hideTitle ? (
            <span className="sr-only">{title}</span>
          ) : (
            <div>
              <div className="mb-2 h-px w-10 bg-gradient-to-r from-[#C8A96A] to-transparent" />
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy">{title}</h2>
            </div>
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
    <section className={`${ADMIN_CARD_CLS} bg-gradient-to-br from-card to-[rgba(200,169,106,0.04)] p-5 sm:p-6`}>
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
        {hint ? <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminFilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-3">{children}</div>;
}

export function AdminEmptyState({ message }: { message: string }) {
  return (
    <div className={`${ADMIN_CARD_CLS} px-8 py-16 text-center`}>
      <div className="mx-auto mb-4 h-px w-12 bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function AdminFlash({
  tone,
  children,
}: {
  tone: "ok" | "error";
  children: ReactNode;
}) {
  return (
    <p
      className={`rounded-2xl px-4 py-3 text-sm ${
        tone === "ok"
          ? "border border-[#C8A96A]/30 bg-[#C8A96A]/10 text-[#A8894E]"
          : "border border-destructive/25 bg-destructive/5 text-destructive"
      }`}
    >
      {children}
    </p>
  );
}
