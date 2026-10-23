'use client'

import { useState } from 'react';
import { Pill, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface PrescriptionData {
  patientId: string;
  patientName: string;
  icdCode: string;
  medication: string;
  dosage: string;
  refills: string;
  instructions: string;
  timestamp: string;
}

interface EPrescriptionWriterProps {
  patientName: string;
  patientId: string;
  onIssuePrescription?: (prescription: PrescriptionData) => void;
}

export function EPrescriptionWriter({ patientName, patientId, onIssuePrescription }: EPrescriptionWriterProps) {
  const [icdCode, setIcdCode] = useState('F41.1');
  const [medication, setMedication] = useState('Sertraline HCI 50mg');
  const [dosage, setDosage] = useState('1 tablet daily after breakfast');
  const [refills, setRefills] = useState('2');
  const [instructions, setInstructions] = useState('Combine with daily 4-4-4-4 Box Breathing therapy.');
  const [isIssued, setIsIssued] = useState(false);

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssued(true);
    if (onIssuePrescription) {
      onIssuePrescription({
        patientId,
        patientName,
        icdCode,
        medication,
        dosage,
        refills,
        instructions,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <Pill className="w-4 h-4 mr-2 text-teal-600" /> Digital E-Prescription & Care Plan Writer
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          ICD-11 compliant digital prescription mapped to patient medical profile.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isIssued ? (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs">
            <div className="text-teal-800 font-bold flex items-center text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" /> E-Prescription Digitally Signed & Issued
            </div>
            <div className="text-slate-700 font-mono text-[11px] space-y-0.5">
              <div>Patient: {patientName} ({patientId})</div>
              <div>ICD-11 Code: {icdCode}</div>
              <div>Medication: {medication}</div>
              <div>Dosage: {dosage} (Refills: {refills})</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setIsIssued(false)} className="text-xs text-slate-500 hover:text-slate-900 pt-2">
              Issue Another Care Plan
            </Button>
          </div>
        ) : (
          <form onSubmit={handleIssue} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-medium">ICD-11 Diagnostic Code</label>
                <select
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                >
                  <option value="F41.1">F41.1 - Generalized Anxiety Disorder</option>
                  <option value="F32.1">F32.1 - Major Depressive Disorder</option>
                  <option value="F43.1">F43.1 - Post-Traumatic Stress Disorder</option>
                  <option value="F51.0">F51.0 - Primary Insomnia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-medium">Refills Allowed</label>
                <input
                  type="text"
                  value={refills}
                  onChange={(e) => setRefills(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium">Medication & Strength</label>
              <input
                type="text"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium">Dosage Schedule</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium">Care Plan Directives</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
              />
            </div>

            <Button type="submit" className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs py-2.5 shadow-md shadow-indigo-950/20">
              <ShieldCheck className="w-4 h-4 mr-1.5" /> Sign & Issue Digital E-Prescription
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
