'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import { createSession } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ShieldCheck, Lock, UserCheck, Stethoscope, User, Building2, Terminal } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        throw new Error('User profile not found in database.')
      }

      const userData = userDoc.data()
      const role = userData.role

      if (!role) {
        throw new Error('User role is not assigned.')
      }

      const idToken = await user.getIdToken()
      const sessionResult = await createSession(idToken, role)

      if (!sessionResult.success) {
        throw new Error('Failed to create secure session')
      }

      window.location.href = '/'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during login.';
      setError(msg);
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = (role: 'patient' | 'clinician' | 'billing_admin' | 'admin') => {
    window.location.href = `/api/dev-login?role=${role}`
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-lg space-y-6">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#1E1B4B] flex items-center justify-center shadow-xl shadow-indigo-950/20">
            <Activity className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Praxis AI</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Clinical Tele-Psychiatry & Multimodal Decision-Support Portal</p>
          </div>
        </div>

        {/* Main Login Card */}
        <Card className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 text-center bg-slate-50/60 border-b border-slate-200/80 p-6">
            <CardTitle className="text-xl font-extrabold text-[#0F172A]">
              Secure Healthcare Access
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your clinical credentials or test with one-click role access
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 rounded font-mono">
                {error}
              </div>
            )}

            {/* Direct One-Click Demo Access Buttons */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Instant Demo Role Switcher
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDevLogin('patient')}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs transition-all shadow-sm active:scale-95"
                >
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDevLogin('clinician')}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-950/20 active:scale-95"
                >
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <span>Clinician</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDevLogin('billing_admin')}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs transition-all shadow-sm active:scale-95"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Operations</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDevLogin('admin')}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Admin Console</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest absolute">Or Standard EMR Auth</span>
            </div>

            {/* Standard Firebase Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="email">
                  Clinical Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@praxis.health"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-[#1E1B4B] rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-[#1E1B4B] rounded-xl text-xs"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1E1B4B] hover:bg-[#2E2A72] text-white font-bold py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-950/20"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In with Firebase Auth'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security & Compliance Badges Footer */}
        <div className="flex items-center justify-center space-x-6 text-[11px] font-mono text-slate-500">
          <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-600" /> HIPAA Compliant</span>
          <span className="flex items-center"><Lock className="w-3.5 h-3.5 mr-1 text-teal-600" /> 256-bit AES</span>
          <span className="flex items-center"><UserCheck className="w-3.5 h-3.5 mr-1 text-teal-600" /> Zero-Copy Edge Vision</span>
        </div>

      </div>
    </div>
  )
}
