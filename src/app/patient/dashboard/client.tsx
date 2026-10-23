'use client'

import { useState, useRef } from 'react';
import { 
  Home, Video, Wind, FileText, Calendar, TrendingUp, Pill, 
  Settings, ShieldAlert, Sparkles, Activity, ShieldCheck 
} from 'lucide-react';
import { SidebarLayout, NavItem } from '@/components/layout/sidebar-layout';
import { PatientDashboardOverview } from '@/components/patient/patient-dashboard-overview';
import { ExpressCalibration } from '@/components/patient/express-calibration';
import { IntakeForms } from '@/components/patient/intake-forms';
import { HardwareDiagnostic } from '@/components/patient/hardware-diagnostic';
import { BoxBreathing } from '@/components/patient/box-breathing';
import { SensoryGrounding } from '@/components/patient/sensory-grounding';
import { EmergencySOSButton } from '@/components/patient/emergency-sos-button';
import { MoodJournal } from '@/components/patient/mood-journal';
import { PrescriptionViewer } from '@/components/patient/prescription-viewer';
import { XAITransparencyCard } from '@/components/patient/xai-transparency-card';
import { AppointmentScheduler } from '@/components/patient/appointment-scheduler';
import { UserProfileSettings } from '@/components/profile/user-profile-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PatientDashboardClient({ role, canViewPHR }: { role?: string; canViewPHR?: boolean }) {
  const [activeTab, setActiveTab] = useState('overview');
  const videoRef = useRef<HTMLVideoElement>(null);

  const patientNavItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: Home },
    { id: 'consultation', label: 'Tele-Consultation Room', icon: Video, badge: 'Live' },
    { id: 'waiting_room', label: 'Mindful Exercises', icon: Wind },
    { id: 'intake', label: 'Clinical Screener', icon: FileText },
    { id: 'scheduler', label: 'Appointment Scheduler', icon: Calendar },
    { id: 'journal', label: 'Mood & Telemetry', icon: TrendingUp },
    { id: 'prescriptions', label: 'Digital Prescriptions', icon: Pill },
  ];

  return (
    <SidebarLayout
      role="patient"
      userName="Sarah Jenkins"
      userSubtitle="Patient ID: PAT-90412"
      navItems={patientNavItems}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId)}
    >
      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'overview' && (
        <PatientDashboardOverview onNavigateTab={(tabId) => setActiveTab(tabId)} />
      )}

      {/* Tab 2: Tele-Consultation Video Room & Diagnostics */}
      {activeTab === 'consultation' && (
        <div className="space-y-8 max-w-5xl mx-auto font-sans">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                  <Video className="w-5 h-5 mr-2 text-teal-600" /> Active Tele-Consultation Room: call-room-90412
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Connected to Dr. Sarah Jenkins (NPI-84920)
                </CardDescription>
              </div>
              <Link href="/patient/consult/call-room-90412">
                <Button className="bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs py-2.5 shadow-md shadow-indigo-950/20">
                  Join HD Video Consultation Stream
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HardwareDiagnostic />
              <ExpressCalibration videoRef={videoRef} onCalibrated={() => {}} />
            </div>

            <EmergencySOSButton patientId="PAT-90412" patientName="Sarah Jenkins" />
          </Card>

          <XAITransparencyCard />
        </div>
      )}

      {/* Tab 3: Mindful Waiting Room & Exercises */}
      {activeTab === 'waiting_room' && (
        <div className="space-y-8 max-w-4xl mx-auto font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BoxBreathing />
            <SensoryGrounding />
          </div>
        </div>
      )}

      {/* Tab 4: Clinical Intake & Screener */}
      {activeTab === 'intake' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <IntakeForms />
        </div>
      )}

      {/* Tab 5: Appointment Scheduler */}
      {activeTab === 'scheduler' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <AppointmentScheduler />
        </div>
      )}

      {/* Tab 6: Mood & Telemetry Journal */}
      {activeTab === 'journal' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <MoodJournal />
        </div>
      )}

      {/* Tab 7: Digital Prescriptions & Care Plans */}
      {activeTab === 'prescriptions' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <PrescriptionViewer />
        </div>
      )}

      {/* Tab 8: User Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <UserProfileSettings role="patient" />
        </div>
      )}
    </SidebarLayout>
  );
}