"use client"

import { useState, useRef, useEffect } from "react"
import { Video, Mic, MicOff, VideoOff, PhoneOff, Settings, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useWebRTC } from "@/hooks/useWebRTC"

export function PatientConsultClient({ consultId }: { consultId: string }) {
  const [micOn, setMicOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)

  const { localStream, remoteStream, toggleAudio, toggleVideo } = useWebRTC(consultId, 'patient')
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  useEffect(() => {
    toggleAudio(micOn)
  }, [micOn, toggleAudio])

  useEffect(() => {
    toggleVideo(videoOn)
  }, [videoOn, toggleVideo])

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white overflow-hidden">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-gradient-to-b from-slate-900 to-transparent absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="font-medium">Secure Telehealth Session</span>
        </div>
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-300">
          Live
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
        {/* Doctor Feed */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 animate-pulse">
              <span className="text-slate-500 font-medium">Doctor</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-6 left-6 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-medium border border-white/10 shadow-lg">
          Clinician Feed
        </div>

        {/* Patient Self View (Picture-in-Picture) */}
        <div className="absolute top-20 right-6 w-32 md:w-48 aspect-video bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-24 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-6 px-6 relative z-20">
        <button 
          onClick={() => setMicOn(!micOn)}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}
        >
          {micOn ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <button 
          onClick={() => setVideoOn(!videoOn)}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${videoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}
        >
          {videoOn ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        
        <button className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-white hidden sm:flex">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="w-px h-8 bg-slate-800 mx-2" />
        
        <Link href="/patient/dashboard" className="w-16 h-12 sm:w-20 sm:h-14 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center transition-all shadow-lg shadow-rose-900/50 text-white">
          <PhoneOff className="w-6 h-6" />
        </Link>
      </div>
    </div>
  )
}
