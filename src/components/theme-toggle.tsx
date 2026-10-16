import { Moon, Sun } from "lucide-react";
import { useLang } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { lang } = useLang();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        lang === "ar"
          ? isDark
            ? "التبديل إلى الوضع الفاتح"
            : "التبديل إلى الوضع الداكن"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
      className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 bg-card text-navy transition-colors hover:border-gold/45 hover:text-gold-ink"
    >
      {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}
