"use client";
/**
 * LanguageContext — نظام تعدد اللغات
 *
 * الاستخدام في أي مكوّن:
 *   const { t, lang, setLang, dir } = useLanguage();
 *   <p>{t("products.title")}</p>
 */
import {
  createContext, useContext, useState,
  useEffect, useCallback, type ReactNode,
} from "react";
import ar from "@/i18n/locales/ar.json";
import fr from "@/i18n/locales/fr.json";

export type Lang = "ar" | "fr";

const translations: Record<Lang, typeof ar> = { ar, fr };

interface LanguageContextType {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  // قراءة اللغة المحفوظة من localStorage عند أول تحميل
  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_language") as Lang | null;
      if (saved === "ar" || saved === "fr") setLangState(saved);
    } catch {}
  }, []);

  // تحديث dir و lang على عنصر <html> عند تغيير اللغة
  useEffect(() => {
    document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem("app_language", l); } catch {}
    setLangState(l);
  }, []);

  // دالة الترجمة — تقبل مسار مثل "products.title"
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
    <LanguageContext.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}