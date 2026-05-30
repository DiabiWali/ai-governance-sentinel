"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LANGUAGE,
  translations,
  type Language,
} from "@/i18n/translations";
import { extraTranslations } from "@/i18n/extraTranslations";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const STORAGE_KEY = "ai-governance-sentinel-language";

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);

    if (storedLanguage === "en" || storedLanguage === "fr") {
      setLanguageState(storedLanguage);
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  function t(key: string): string {
    const value =
      getNestedValue(translations[language], key) ??
      getNestedValue(extraTranslations[language], key);

    if (typeof value === "string") {
      return value;
    }

    const fallback =
      getNestedValue(translations[DEFAULT_LANGUAGE], key) ??
      getNestedValue(extraTranslations[DEFAULT_LANGUAGE], key);

    if (typeof fallback === "string") {
      return fallback;
    }

    return key;
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}

function getNestedValue(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }

    return undefined;
  }, source);
}
