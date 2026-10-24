'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './translations/en.json';
import hiTranslations from './translations/hi.json';
import mrTranslations from './translations/mr.json';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const dictionaries: Record<Language, Record<string, unknown>> = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations,
};

// Legacy flat mapping fallback
const legacyFallbacks: Record<Language, Record<string, string>> = {
  en: {
    welcome: "Welcome to Praxis AI Tele-Psychiatry Platform",
    teleConsultation: "Tele-Consultation",
    patient: "Patient",
    clinicalPortal: "Clinical Decision-Support Portal",
    startCalibration: "Start 10s Express Calibration",
    emergencySOS: "EMERGENCY CRISIS PANIC BUTTON (SOS)",
    boxBreathing: "Bio-Feedback Box Breathing (4-4-4-4)"
  },
  hi: {
    welcome: "प्राक्सिस एआई टेली-साइकियाट्री प्लेटफॉर्म में आपका स्वागत है [NEEDS HUMAN REVIEW]",
    teleConsultation: "टेली-परामर्श (Tele-Consultation) [NEEDS HUMAN REVIEW]",
    patient: "मरीज़ (Patient) [NEEDS HUMAN REVIEW]",
    clinicalPortal: "नैदानिक निर्णय-सहायता पोर्टल [NEEDS HUMAN REVIEW]",
    startCalibration: "10 सेकंड का बेसलाइन अंशांकन शुरू करें [NEEDS HUMAN REVIEW]",
    emergencySOS: "आपातकालीन संकट बटन (SOS) [NEEDS HUMAN REVIEW]",
    boxBreathing: "बायो-फीडबैक बॉक्स ब्रीदिंग (4-4-4-4) [NEEDS HUMAN REVIEW]"
  },
  mr: {
    welcome: "प्रॅक्सिस एआय टेली-सायकियाट्री प्लॅटफॉर्मवर आपले स्वागत आहे [NEEDS HUMAN REVIEW]",
    teleConsultation: "टेली-सल्ला (Tele-Consultation) [NEEDS HUMAN REVIEW]",
    patient: "रुग्ण (Patient) [NEEDS HUMAN REVIEW]",
    clinicalPortal: "वैद्यकीय निर्णय-सहाय्य पोर्टल [NEEDS HUMAN REVIEW]",
    startCalibration: "10 सेकंदांचे बेसलाइन कॅलिब्रेशन सुरू करा [NEEDS HUMAN REVIEW]",
    emergencySOS: "आपत्कालीन संकटाचे बटण (SOS) [NEEDS HUMAN REVIEW]",
    boxBreathing: "बायो-फीडबॅक बॉक्स ब्रीथिंग (4-4-4-4) [NEEDS HUMAN REVIEW]"
  }
};

function resolveKey(dict: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Restore stored language preference from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('praxis_lang') as Language | null;
      if (stored && ['en', 'hi', 'mr'].includes(stored)) {
        setLanguageState(stored);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('praxis_lang', lang);
    }
  };

  const t = (key: string): string => {
    // 1. Try dot-notation lookup in current language dictionary
    const dict = dictionaries[language];
    const resolved = dict ? resolveKey(dict, key) : undefined;
    if (resolved) return resolved;

    // 2. Try legacy fallback
    const legacy = legacyFallbacks[language]?.[key];
    if (legacy) return legacy;

    // 3. Fallback to English dictionary
    const enDict = dictionaries.en;
    const enResolved = enDict ? resolveKey(enDict, key) : undefined;
    if (enResolved) return enResolved;

    return legacyFallbacks.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
