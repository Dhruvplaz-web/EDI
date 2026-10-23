import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Shield, Video } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="border-b bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-slate-900">XAI-Triage Tele-Psychiatry</span>
        </div>

        <div className="flex space-x-3">
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/api/dev-login?role=clinician">
            <Button className="bg-blue-600 hover:bg-blue-700">Clinician Portal</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Explainable Multimodal Tele-Psychiatry Platform
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          AI decision support fusing linguistic, acoustic, and kinematic patient streams for real-time psychiatric risk triage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 text-left">
          <Card>
            <CardHeader>
              <Video className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>WebRTC P2P Video</CardTitle>
              <CardDescription>Zero-latency secure encrypted patient-clinician sessions.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Biometric Triaging</CardTitle>
              <CardDescription>15-second temporal analysis windows evaluating severity scores.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Explainable AI (XAI)</CardTitle>
              <CardDescription>Transparent evidence logs and cross-attention discrepancy flagging.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-sm text-slate-500">
        © XAI-Triage Clinical Tele-Psychiatry Platform.
      </footer>
    </div>
  );
}
