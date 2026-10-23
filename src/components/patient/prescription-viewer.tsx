'use client'

import { Pill, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PrescriptionViewer() {
  const prescriptions = [
    {
      id: 'RX-90412',
      doctor: 'Dr. Sarah Jenkins (NPI-84920)',
      date: 'Aug 07, 2026',
      icd: 'F41.1 - Generalized Anxiety Disorder',
      medication: 'Sertraline HCI 50mg',
      dosage: '1 tablet daily after breakfast',
      refills: '2 remaining',
      directives: 'Daily 4-4-4-4 Box Breathing exercise.'
    }
  ];

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <Pill className="w-4 h-4 mr-2 text-teal-600" /> Digital E-Prescription & Care Plans
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          View doctor-issued prescriptions, ICD-11 diagnostic classifications, and care plans.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-xs font-mono">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-slate-900 font-bold text-sm">{rx.medication}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{rx.doctor} • Issued {rx.date}</div>
              </div>
              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold rounded-lg">
                Active Prescription
              </span>
            </div>

            <div className="text-slate-700 text-[11px] space-y-1 border-t border-slate-200 pt-2.5">
              <div>ICD-11 Code: <span className="font-bold text-slate-900">{rx.icd}</span></div>
              <div>Dosage: {rx.dosage} ({rx.refills})</div>
              <div>Directives: {rx.directives}</div>
            </div>

            <Button size="sm" variant="outline" onClick={() => alert("Downloading Digital E-Prescription PDF...")} className="w-full border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-100 mt-1 shadow-sm">
              <Download className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> Download Signed PDF Care Plan
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
