'use client'

import { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AppointmentScheduler() {
  const [selectedDate, setSelectedDate] = useState('2026-08-14');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [selectedSpecialist, setSelectedSpecialist] = useState('Dr. Sarah Jenkins (Psychiatrist - NPI 84920)');
  const [isBooked, setIsBooked] = useState(false);

  const timeSlots = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-teal-600" /> Appointment Scheduler & Tele-Consultation Booking
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Book upcoming tele-psychiatry consultations with verified specialists.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isBooked ? (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3 text-xs">
            <div className="text-teal-800 font-bold flex items-center text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" /> Tele-Consultation Confirmed!
            </div>
            <div className="text-slate-700 font-mono text-[11px] space-y-1">
              <div>Specialist: {selectedSpecialist}</div>
              <div>Date: {selectedDate}</div>
              <div>Time: {selectedTime}</div>
              <div>Encrypted Room Token: <span className="text-teal-700 font-bold">room-{selectedDate.replace(/-/g, '')}-1000</span></div>
            </div>

            <Button size="sm" variant="outline" onClick={() => setIsBooked(false)} className="border-slate-200 text-xs text-slate-700 hover:bg-slate-100 mt-1 shadow-sm">
              Book Another Appointment
            </Button>
          </div>
        ) : (
          <form onSubmit={handleBookAppointment} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium">Select Tele-Psychiatry Specialist</label>
              <select
                value={selectedSpecialist}
                onChange={(e) => setSelectedSpecialist(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono shadow-inner"
              >
                <option value="Dr. Sarah Jenkins (Psychiatrist - NPI 84920)">Dr. Sarah Jenkins (Adult Psychiatry - NPI 84920)</option>
                <option value="Dr. Michael Vance (Child & Adolescent - NPI 77102)">Dr. Michael Vance (Child & Adolescent Psychiatry - NPI 77102)</option>
                <option value="Dr. Elena Rostova (Neuro-Psychiatry - NPI 99310)">Dr. Elena Rostova (Neuro-Psychiatry - NPI 99310)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium">Consultation Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono shadow-inner"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium">Available Time Slot</label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 px-2 text-center rounded-xl border transition-all text-[11px] font-semibold ${
                      selectedTime === slot
                        ? 'bg-[#1E1B4B] border-[#1E1B4B] text-white shadow-md shadow-indigo-950/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs py-2.5 shadow-md shadow-indigo-950/20">
              <Video className="w-4 h-4 mr-1.5" /> Confirm & Schedule Tele-Consultation
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
