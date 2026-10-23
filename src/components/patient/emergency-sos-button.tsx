'use client'

import { useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/client';
import { collection, addDoc } from 'firebase/firestore';

interface EmergencySOSButtonProps {
  patientId: string;
  patientName: string;
}

export function EmergencySOSButton({ patientId, patientName }: EmergencySOSButtonProps) {
  const [triggered, setTriggered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTriggerSOS = async () => {
    if (!confirm("Are you experiencing a severe mental health crisis? Clicking OK will immediately alert the clinical triage team.")) {
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'intakes'), {
        patientId,
        patientName,
        baselineSeverityScore: 10.0,
        symptoms: 'URGENT CRISIS SOS PANIC BUTTON TRIGGERED',
        medicationChanges: 'yes',
        submittedAt: new Date().toISOString()
      });
      setTriggered(true);
    } catch (err) {
      console.error("SOS trigger error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans">
      {triggered ? (
        <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl text-rose-900 text-xs font-mono space-y-1.5 shadow-xl shadow-rose-200/50">
          <div className="font-extrabold text-rose-800 flex items-center text-sm">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 animate-pulse" /> Urgent Crisis SOS Signal Broadcasted
          </div>
          <p className="font-sans text-slate-700">Your session has been elevated to Triage Index 10.0 (Top Priority). A clinician will connect immediately.</p>
        </div>
      ) : (
        <Button
          onClick={handleTriggerSOS}
          disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 py-3 rounded-xl tracking-wider uppercase"
        >
          <ShieldAlert className="w-4 h-4 mr-2" />
          {loading ? 'Broadcasting Crisis Signal...' : 'EMERGENCY CRISIS PANIC BUTTON (SOS)'}
        </Button>
      )}
    </div>
  );
}
