import { useRouter, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Dictionary } from "./copy";
import { LANG_STORAGE_KEY, localizePath, readStoredLang, splitLocale } from "./locale-url";
import type { Lang } from "./page-content";
import { usePageContent } from "./page-content-context";

export type { Lang };

type LangContextValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Dictionary;
  /** True on public pages whose URL carries `/ar` or `/en`. */
  localized: boolean;
  setLang: (lang: Lang) => void;
  toggle: () => void;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { dictionary } = usePageContent();
  const router = useRouter();
  const publicPath = useRouterState({
    select: (s) => s.location.publicHref.split(/[?#]/)[0] ?? "/",
  });
  const urlLang = splitLocale(publicPath).lang;
  const [storedLang, setStoredLang] = useState<Lang>(() => urlLang ?? readStoredLang());
  const lang = urlLang ?? storedLang;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (next: Lang) => {
    setStoredLang(next);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
    if (!urlLang || next === urlLang) return;
    const { pathname, search, hash } = window.location;
    router.history.push(`${localizePath(splitLocale(pathname).path, next)}${search}${hash}`);
  };

  const t = useMemo(() => dictionary(lang), [dictionary, lang]);

  return (
    <LangContext.Provider
      value={{
        lang,
        dir: lang === "ar" ? "rtl" : "ltr",
        t,
        localized: urlLang !== null,
        setLang,
        toggle: () => setLang(lang === "ar" ? "en" : "ar"),
      }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
