"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "@/i18n/en.json";
import vi from "@/i18n/vi.json";

export type Language = "en" | "vi";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language;
    if (saved) setLangState(saved);
    setMounted(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  };

  const t = lang === "vi" ? vi : en;

  // Prevent hydration mismatch
  if (!mounted) return <div className="min-h-screen bg-[#FAFAFA]"></div>;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
