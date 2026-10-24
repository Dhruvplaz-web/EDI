'use client';

import React from 'react';
import Link from 'next/link';
import { Wifi, PhoneCall, ArrowLeft, RefreshCw, AlertCircle, Signal } from 'lucide-react';

export default function NetworkTroubleshootPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Consult</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Signal className="w-4 h-4 text-emerald-400" />
            <span>Connection Guide</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs">
            <Wifi className="w-3.5 h-3.5" />
            <span>Low-Bandwidth Assistance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Call Quality & Internet Help</h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            If your video is freezing or the voice is robotic, follow these 3 quick steps to stabilize your consultation.
          </p>
        </div>

        {/* Step 1: Switch to Audio-Only Mode */}
        <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 flex items-center justify-center text-xs">
              1
            </div>
            <span>Switch to Audio-Only Mode (Recommended)</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Video uses 10× more data than voice. If your 4G connection is weak, turn off your camera in the call room. 
            The consultation will continue in crystal-clear audio mode without dropping.
          </p>
          <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audio-only mode requires only 40 kbps of data.</span>
          </div>
        </div>

        {/* Step 2: Cellular Data vs WiFi Check */}
        <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 flex items-center justify-center text-xs">
              2
            </div>
            <span>Quick Signal Adjustments</span>
          </div>
          <ul className="text-xs text-neutral-400 space-y-2 list-disc list-inside leading-relaxed">
            <li>Move closer to a window or an open area if using mobile data (Jio / Airtel / Vi).</li>
            <li>Disconnect other phones or streaming apps downloading on the same Wi-Fi.</li>
            <li>Close background browser tabs and apps to free up your phone memory.</li>
          </ul>
        </div>

        {/* Step 3: Reconnection */}
        <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 flex items-center justify-center text-xs">
              3
            </div>
            <span>If Disconnected: Refresh Page</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Our platform automatically saves your session token. Refreshing the browser page reconnects you to the same 
            consultation room in under 5 seconds.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Page Now</span>
          </button>
        </div>

        {/* Emergency Fallback Alert */}
        <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-800/40 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-200">In Urgent Crisis?</p>
            <p className="text-[11px] leading-relaxed text-red-300/90">
              If your internet fails completely and you are experiencing severe distress, call the Government of India Tele-MANAS helpline toll-free at <strong>14416</strong> or <strong>1800-891-4416</strong> immediately.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
