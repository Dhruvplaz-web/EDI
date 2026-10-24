'use client';

import React from 'react';
import { Phone, ShieldAlert, AlertTriangle, ExternalLink, X, HeartPulse } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { VERIFIED_INDIA_CRISIS_HELPLINES, CRISIS_DISCLAIMER_TEXTS, ClinicEscalationOfficer } from '@/lib/config/crisis-contacts';

interface CrisisSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicOfficer?: ClinicEscalationOfficer;
  patientName?: string;
}

export function CrisisSafetyModal({ isOpen, onClose, clinicOfficer, patientName }: CrisisSafetyModalProps) {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const disclaimer = CRISIS_DISCLAIMER_TEXTS[language] || CRISIS_DISCLAIMER_TEXTS.en;

  const titles = {
    en: {
      header: 'Immediate Crisis & Mental Health Helplines (India)',
      subHeader: 'Verified free 24/7 government mental health and emergency services across India.',
      clinicSupport: 'Your Clinic Escalation Contact',
      callNow: 'Direct Call',
      lastVerified: 'All helpline numbers verified: 24 October 2026',
    },
    hi: {
      header: 'आपातकालीन संकट एवं मानसिक स्वास्थ्य हेल्पलाइन (भारत)',
      subHeader: 'भारत भर में सत्यापित निःशुल्क 24/7 सरकारी मानसिक स्वास्थ्य एवं आपातकालीन सेवाएं।',
      clinicSupport: 'आपके क्लिनिक का संकट संपर्क',
      callNow: 'कॉल करें',
      lastVerified: 'सभी हेल्पलाइन नंबर सत्यापित: 24 अक्टूबर 2026 [NEEDS HUMAN REVIEW]',
    },
    mr: {
      header: 'तात्काळ संकट आणि मानसिक आरोग्य हेल्पलाइन (भारत)',
      subHeader: 'भारतभरातील मोफत २४/७ शासकीय मानसिक आरोग्य आणि आपत्कालीन सेवा.',
      clinicSupport: 'आपल्या क्लिनिकचा आपत्कालीन संपर्क',
      callNow: 'कॉल करा',
      lastVerified: 'सर्व हेल्पलाइन क्रमांक पडताळलेले: २४ ऑक्टोबर २०२६ [NEEDS HUMAN REVIEW]',
    },
  };

  const t = titles[language] || titles.en;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-rose-500/80 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-rose-600">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h2 id="crisis-modal-title" className="text-xl font-bold tracking-tight text-rose-900 dark:text-rose-200">
                {t.header}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t.subHeader}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close crisis resources dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex gap-2.5 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>{disclaimer}</div>
        </div>

        {/* Helplines List */}
        <div className="mt-5 space-y-3">
          {VERIFIED_INDIA_CRISIS_HELPLINES.map((line) => {
            const lineName = line.name[language] || line.name.en;
            return (
              <div
                key={line.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-rose-300 dark:hover:border-rose-800 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{lineName}</span>
                    {line.tollFree && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full">
                        Toll-Free
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{line.operatingHours}</span>
                    <span>•</span>
                    <span>{line.governingBody}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">{line.primaryFocus}</p>
                </div>

                <a
                  href={`tel:${line.dialNumber}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-md shadow-rose-600/20 active:scale-95 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{line.displayNumber}</span>
                </a>
              </div>
            );
          })}
        </div>

        {/* Optional Clinic On-Call Officer */}
        {clinicOfficer && (
          <div className="mt-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                {t.clinicSupport}
              </div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {clinicOfficer.name} ({clinicOfficer.role})
              </div>
              <div className="text-xs text-slate-500">Available: {clinicOfficer.availableHours}</div>
            </div>
            <a
              href={`tel:${clinicOfficer.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
            >
              <Phone className="w-3 h-3" />
              <span>{clinicOfficer.phone}</span>
            </a>
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
          <span>{t.lastVerified}</span>
          <div className="flex items-center gap-3">
            <a
              href="https://telemanas.mohfw.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline text-rose-600 dark:text-rose-400"
            >
              Tele-MANAS MoHFW <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://112.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline text-slate-600 dark:text-slate-400"
            >
              ERSS 112 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
