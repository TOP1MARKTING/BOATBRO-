import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { useLang } from "../lib/i18n";
import { SHELL } from "./brand";

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[13px] font-medium text-gold-ink ${className}`}>{children}</p>;
}

export function GoldLine({ className = "" }: { className?: string }) {
  return <span className={`block h-px w-14 bg-gold/70 ${className}`} />;
}

const btnVariants = {
  gold: "bg-gold text-white hover:bg-gold/85",
  ghost: "border border-white/40 text-white hover:border-white hover:bg-white/10",
  line: "border border-gold/50 text-gold-ink hover:bg-gold hover:text-white",
  navy: "bg-navy-deep text-white hover:bg-navy-deep/90",
  whatsapp:
    "border border-[#25D366]/40 bg-gradient-to-l from-[#128C7E] to-[#25D366] text-white shadow-[0_10px_24px_-14px_rgba(37,211,102,0.65)] hover:from-[#0f7a6e] hover:to-[#20bd5c]",
};

type BtnProps = {
  children: ReactNode;
  variant?: keyof typeof btnVariants;
  className?: string;
  disabled?: boolean;
  href?: string;
  to?: string;
  hash?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function Btn({
  children,
  variant = "gold",
  className = "",
  disabled,
  href,
  to,
  hash,
  type = "submit",
  onClick,
}: BtnProps) {
  const cls = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-[14px] font-medium transition-all duration-300 focus-visible:outline-none disabled:opacity-60 ${btnVariants[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to as never} {...(hash ? { hash } : {})} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  if (href) {
    const external = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        className={cls}
        onClick={onClick}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

export function CtaArrow() {
  const { lang } = useLang();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return <Arrow size={16} />;
}

export function Section({
  id,
  tone = "plain",
  children,
  className = "",
}: {
  id?: string;
  tone?: "plain" | "mute" | "navy";
  children: ReactNode;
  className?: string;
}) {
  const bg =
    tone === "mute"
      ? "bg-surface-2 bp-section-mute"
      : tone === "navy"
        ? "bg-navy-deep text-white bp-section-navy"
        : "bg-background bp-section-plain";
  return (
    <section
      id={id}
      className={`border-t border-border ${bg} py-12 sm:py-16 lg:py-24 ${className}`}
    >
      <div className={SHELL}>{children}</div>
    </section>
  );
}
