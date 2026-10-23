'use client'

import { AlertOctagon, PhoneCall, MapPin, User, ShieldAlert, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmergencyEscalationModalProps {
  patientName: string;
  patientPhone: string;
  emergencyContact: { name: string; relation: string; phone: string };
  locationAddress: string;
  onClose: () => void;
}

export function EmergencyEscalationModal({
  patientName,
  patientPhone,
  emergencyContact,
  locationAddress,
  onClose
}: EmergencyEscalationModalProps) {
  const handleDispatchEMS = () => {
    alert(`EMERGENCY DISPATCH INITIATED for ${patientName} at ${locationAddress}. Crisis response team notified.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-lg bg-white border-2 border-rose-500 text-slate-900 shadow-2xl shadow-rose-500/20">
        <CardHeader className="border-b border-slate-200 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-6 h-6 text-rose-600 animate-pulse" />
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-900">1-Click Crisis EMS Escalation</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Immediate emergency dispatch and crisis contact notification protocol.
                </CardDescription>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4 text-xs font-mono">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
            <div className="text-rose-900 font-bold flex items-center text-sm">
              <User className="w-4 h-4 mr-1.5 text-rose-600" /> Patient: {patientName}
            </div>
            <div className="text-rose-800">Direct Phone: {patientPhone}</div>
          </div>

          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
            <div className="text-rose-900 font-bold flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-1.5 text-rose-600" /> Verified GPS / Registered Address
            </div>
            <div className="text-rose-800">{locationAddress}</div>
          </div>

          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
            <div className="text-rose-900 font-bold flex items-center text-sm">
              <PhoneCall className="w-4 h-4 mr-1.5 text-rose-600" /> Primary Emergency Contact
            </div>
            <div className="text-rose-800">{emergencyContact.name} ({emergencyContact.relation}) - {emergencyContact.phone}</div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:text-slate-900">
              Cancel Protocol
            </Button>
            <Button onClick={handleDispatchEMS} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 shadow-lg shadow-rose-600/30">
              <ShieldAlert className="w-4 h-4 mr-1.5" /> Dispatch Emergency EMS Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
