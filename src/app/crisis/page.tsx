'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, ShieldAlert, AlertTriangle, ExternalLink, ArrowLeft, HeartPulse, CheckCircle2 } from 'lucide-react';
import { VERIFIED_INDIA_CRISIS_HELPLINES, CRISIS_DISCLAIMER_TEXTS } from '@/lib/config/crisis-contacts';
import { SupportedLanguage } from '@/lib/consent/consent-store';

export default function CrisisHelpPage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');

  const headers = {
    en: {
      title: 'India Mental Health Crisis & Emergency Helplines',
      subtitle: 'Free, confidential, 24/7 tele-psychiatric and emergency helplines verified for Indian patients and families.',
      immediateDanger: 'If you or someone around you is in immediate life-threatening physical danger, call 112 immediately or visit the casualty department of the nearest hospital.',
      lastVerified: 'All numbers verified against MoHFW, NIMHANS, and MHA directories: 24 October 2026',
      backToHome: 'Back to Clinic Portal',
    },
    hi: {
      title: 'भारत मानसिक स्वास्थ्य संकट एवं आपातकालीन हेल्पलाइन',
      subtitle: 'भारतीय मरीजों और परिवारों के लिए सत्यापित निःशुल्क, गोपनीय, 24/7 मानसिक स्वास्थ्य और आपातकालीन हेल्पलाइन।',
      immediateDanger: 'यदि आप या कोई अन्य व्यक्ति तत्काल जानलेवा खतरे में है, तो तुरंत 112 पर कॉल करें या नजदीकी अस्पताल के आपातकालीन विभाग में जाएं। [NEEDS HUMAN REVIEW]',
      lastVerified: 'सभी नंबर स्वास्थ्य मंत्रालय (MoHFW), NIMHANS और गृह मंत्रालय के अनुसार सत्यापित: 24 अक्टूबर 2026 [NEEDS HUMAN REVIEW]',
      backToHome: 'क्लिनिक पोर्टल पर वापस जाएं',
    },
    mr: {
      title: 'भारत मानसिक आरोग्य आपत्कालीन हेल्पलाइन',
      subtitle: 'भारतीय रुग्ण आणि कुटुंबांसाठी पडताळलेली मोफत, गोपनीय, २४/७ मानसिक आरोग्य आणि आपत्कालीन हेल्पलाइन.',
      immediateDanger: 'आपण किंवा आपल्या सभोवतालची कोणतीही व्यक्ती तात्काळ जीवघेण्या धोक्यात असल्यास, त्वरित ११२ वर कॉल करा किंवा जवळच्या रुग्णालयाशी संपर्क साधा. [NEEDS HUMAN REVIEW]',
      lastVerified: 'आरोग्य मंत्रालय (MoHFW), NIMHANS आणि गृह मंत्रालयानुसार सर्व क्रमांक पडताळलेले: २४ ऑक्टोबर २०२६ [NEEDS HUMAN REVIEW]',
      backToHome: 'क्लिनिक पोर्टलवर परत जा',
    },
  };

  const current = headers[lang] || headers.en;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Navigation & Language Picker */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{current.backToHome}</span>
          </Link>

          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-md transition ${lang === 'en' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-md transition ${lang === 'hi' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLang('mr')}
              className={`px-3 py-1 rounded-md transition ${lang === 'mr' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-full text-xs font-semibold text-rose-800 dark:text-rose-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>24/7 Verified Crisis Intervention (India)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            {current.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{current.subtitle}</p>
        </div>

        {/* Immediate Danger Banner */}
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Immediate Life-Threatening Emergency</span>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300">{current.immediateDanger}</p>
          </div>
          <a
            href="tel:112"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition active:scale-95 shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span>Dial 112 (National ERSS)</span>
          </a>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>{CRISIS_DISCLAIMER_TEXTS[lang]}</div>
        </div>

        {/* Verified Helplines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VERIFIED_INDIA_CRISIS_HELPLINES.map((line) => {
            const name = line.name[lang] || line.name.en;
            return (
              <div
                key={line.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{name}</h3>
                    {line.tollFree && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full shrink-0">
                        Toll-Free
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <div>
                      <strong>Operating:</strong> {line.operatingHours}
                    </div>
                    <div>
                      <strong>Authority:</strong> {line.governingBody}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">{line.primaryFocus}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${line.dialNumber}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-semibold shadow transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
                    <span>Call {line.displayNumber}</span>
                  </a>
                  <a
                    href={line.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Official website for ${name}`}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>{current.lastVerified}</p>
      </footer>
    </div>
  );
}
