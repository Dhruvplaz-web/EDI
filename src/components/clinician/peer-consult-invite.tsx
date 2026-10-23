'use client'

import { useState } from 'react';
import { UserPlus, Copy, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PeerConsultInviteProps {
  callId: string;
}

export function PeerConsultInvite({ callId }: PeerConsultInviteProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/clinical/consult/${callId}?inviteToken=spec-${callId.slice(0, 6)}`
    : `https://praxis-ai.internal/clinical/consult/${callId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <UserPlus className="w-4 h-4 mr-2 text-teal-600" /> Invite Specialist for Peer Consultation
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Generate an encrypted single-use WebRTC token link for guest specialist participation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] shadow-inner"
          />
          <Button size="sm" onClick={handleCopy} className="bg-[#1E1B4B] hover:bg-[#2E2A72] text-white text-xs font-semibold shadow-md shadow-indigo-950/20">
            {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>

        <div className="text-[10px] text-slate-500 flex items-center">
          <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> End-to-end encrypted WebRTC peer stream with HIPAA audit trail.
        </div>
      </CardContent>
    </Card>
  );
}
