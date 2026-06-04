"use client";
import {
  createContext, useContext, useState,
  useEffect, useCallback, type ReactNode,
} from "react";
import ar from "@/i18n/locales/ar.json";
import fr from "@/i18n/locales/fr.json";

export type Lang = "ar" | "fr";

const translations: Record<Lang, typeof ar> = { ar, fr };

const CALENDAR_DATA = {
  ar: {
    days:   ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
    months: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
    locale: "ar-DZ",
  },
  fr: {
    days:   ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
    months: ["Janv","Févr","Mars","Avr","Mai","Juin","Juil","Août","Sept","Oct","Nov","Déc"],
    locale: "fr-FR",
  },
};

export interface CalendarData {
  days: string[];
  months: string[];
  locale: string;
}

interface LanguageContextType {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  calendar: CalendarData;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_language") as Lang | null;
      if (saved === "ar" || saved === "fr") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem("app_language", l); } catch {}
    setLangState(l);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split(".");
    let current: unknown = translations[lang];
    for (const k of keys) {
      if (current == null || typeof current !== "object") return key;
      current = (current as Record<string, unknown>)[k];
    }
    return typeof current === "string" ? current : key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t,
      calendar: CALENDAR_DATA[lang],
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}