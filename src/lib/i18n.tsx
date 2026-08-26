import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionaries, type Dictionary } from "./copy";

export type Lang = "ar" | "en";

const STORAGE_KEY = "boatpro-lang";

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

  return (
    <LangContext.Provider
      value={{
        lang,
        dir: lang === "ar" ? "rtl" : "ltr",
        t: dictionaries[lang],
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
