'use client'

import { useState, useEffect, useRef } from 'react';
import { Camera, Mic, CheckCircle2, Save, Settings, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserProfileSettingsProps {
  role: 'clinician' | 'patient';
}

export function UserProfileSettings({ role }: UserProfileSettingsProps) {
  // Clinician Fields
  const [npiNumber, setNpiNumber] = useState('849201938');
  const [medicalLicense, setMedicalLicense] = useState('MD-OR-90412');
  const [specialization, setSpecialization] = useState('Adult & Forensic Psychiatry');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('Oregon Health & Science Telehealth Center');

  // Patient Fields & Device Selectors
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [emergencyContactName, setEmergencyContactName] = useState('Robert Jenkins');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+1 (555) 019-9988');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Spouse');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const videoTestRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const cams = devices.filter(d => d.kind === 'videoinput');
        const mics = devices.filter(d => d.kind === 'audioinput');
        setVideoDevices(cams);
        setAudioDevices(mics);
        if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
        if (mics.length > 0) setSelectedMic(mics[0].deviceId);
      }).catch(err => console.warn("Device enumeration Error:", err));
    }
  }, []);

  const handleTestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: false
      });
      if (videoTestRef.current) {
        videoTestRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera test error:", err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <Settings className="w-4 h-4 mr-2 text-teal-600" />
          {role === 'clinician' ? 'Clinician Credentials & Medical Profile Settings' : 'Patient Profile & Hardware Device Settings'}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          {role === 'clinician' ? 'Manage medical license, NPI registration, and clinical threshold settings.' : 'Configure webcams, microphones, and emergency crisis contact info.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
          {role === 'clinician' ? (
            /* Clinician Profile Form */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-medium">NPI Registration Number</label>
                  <input
                    type="text"
                    value={npiNumber}
                    onChange={(e) => setNpiNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono shadow-inner"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-medium">Medical License Number</label>
                  <input
                    type="text"
                    value={medicalLicense}
                    onChange={(e) => setMedicalLicense(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-medium">Clinical Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono shadow-inner"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-medium">Hospital / Telehealth Center Affiliation</label>
                <input
                  type="text"
                  value={hospitalAffiliation}
                  onChange={(e) => setHospitalAffiliation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono shadow-inner"
                />
              </div>
            </div>
          ) : (
            /* Patient Profile & Hardware Test Form */
            <div className="space-y-4">
              {/* Hardware Camera & Mic Selectors */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-teal-700 font-bold text-[11px] flex items-center">
                  <Camera className="w-3.5 h-3.5 mr-1.5" /> Select & Test Camera Input
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Webcam Hardware Device</label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                    >
                      {videoDevices.length > 0 ? (
                        videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>)
                      ) : (
                        <option value="">Default System Webcam</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Microphone Device</label>
                    <select
                      value={selectedMic}
                      onChange={(e) => setSelectedMic(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                    >
                      {audioDevices.length > 0 ? (
                        audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</option>)
                      ) : (
                        <option value="">Default System Microphone</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Live Test Box */}
                <div className="flex items-center justify-between pt-1">
                  <Button type="button" size="sm" onClick={handleTestCamera} className="bg-slate-200 hover:bg-slate-300 text-xs text-slate-800 font-semibold">
                    Test Camera Device Stream
                  </Button>
                  <div className="w-24 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                    <video ref={videoTestRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Emergency Crisis Contact Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-rose-700 font-bold text-[11px] flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1.5" /> Emergency Crisis Contact Information
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Relationship</label>
                    <input
                      type="text"
                      value={emergencyContactRelation}
                      onChange={(e) => setEmergencyContactRelation(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Phone Number</label>
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {savedSuccess ? (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 flex items-center justify-between font-mono text-[11px]">
              <span className="flex items-center font-bold">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" /> Settings & Credentials Saved Successfully
              </span>
            </div>
          ) : (
            <Button type="submit" className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs py-2.5 shadow-md shadow-indigo-950/20">
              <Save className="w-4 h-4 mr-1.5" /> Save Profile & Device Preferences
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
