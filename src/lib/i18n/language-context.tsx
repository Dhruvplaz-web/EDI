'use client'

import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
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
    welcome: "प्राक्सिस एआई टेली-साइकियाट्री प्लेटफॉर्म में आपका स्वागत है",
    teleConsultation: "टेली-परामर्श (Tele-Consultation)",
    patient: "मरीज़ (Patient)",
    clinicalPortal: "नैदानिक निर्णय-सहायता पोर्टल",
    startCalibration: "10 सेकंड का बेसलाइन अंशांकन शुरू करें",
    emergencySOS: "आपातकालीन संकट बटन (SOS)",
    boxBreathing: "बायो-फीडबैक बॉक्स ब्रीदिंग (4-4-4-4)"
  },
  mr: {
    welcome: "प्रॅक्सिस एआय टेली-सायकियाट्री प्लॅटफॉर्मवर आपले स्वागत आहे",
    teleConsultation: "टेली-सल्ला (Tele-Consultation)",
    patient: "रुग्ण (Patient)",
    clinicalPortal: "वैद्यकीय निर्णय-सहाय्य पोर्टल",
    startCalibration: "10 सेकंदांचे बेसलाइन कॅलिब्रेशन सुरू करा",
    emergencySOS: "आपत्कालीन संकटाचे बटण (SOS)",
    boxBreathing: "बायो-फीडबॅक बॉक्स ब्रीथिंग (4-4-4-4)"
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
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
