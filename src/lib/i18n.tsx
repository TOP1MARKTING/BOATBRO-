import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Dictionary } from "./copy";
import type { Lang } from "./page-content";
import { usePageContent } from "./page-content-context";

export type { Lang };const STORAGE_KEY = "boatpro-lang";

type LangContextValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLang: (lang: Lang) => void;
  toggle: () => void;
};

const LangContext = createContext<LangContextValue | null>(null);

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "ar";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "ar";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { dictionary } = usePageContent();
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (next: Lang) => setLangState(next);
  const toggle = () => setLangState((prev) => (prev === "ar" ? "en" : "ar"));

  const t = useMemo(() => dictionary(lang), [dictionary, lang]);

  return (
    <LangContext.Provider
      value={{
        lang,
        dir: lang === "ar" ? "rtl" : "ltr",
        t,
        setLang,
        toggle,
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
