'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import { createSession } from '@/app/actions/auth'
import { purgeAllSoapDraftsOnLogoutOrIdle } from '@/lib/clinical/soap-draft-storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ShieldCheck, Lock, UserCheck, Stethoscope, User, Building2, Terminal } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Ensure any clinical drafts are completely purged when landing on the login page
  useEffect(() => {
    purgeAllSoapDraftsOnLogoutOrIdle();
  }, []);

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
      const sessionResult = await createSession(idToken)

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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 font-sans text-[#09090B]">
      <div className="w-full max-w-md space-y-6">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#09090B] flex items-center justify-center text-white shadow-sm">
            <Activity className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#09090B] tracking-tight">Praxis AI</h1>
            <p className="text-xs text-[#71717A] mt-0.5">Clinical Tele-Psychiatry & Decision-Support Portal</p>
          </div>
        </div>

        {/* Main Login Card */}
        <Card className="bg-white/95 backdrop-blur-sm border border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_30px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 text-center bg-[#FAFAFA] border-b border-[#E4E4E7] p-5">
            <CardTitle className="text-base font-bold text-[#09090B]">
              Secure Clinical Sign In
            </CardTitle>
            <CardDescription className="text-xs text-[#71717A]">
              Choose a clinical role or enter your verified credentials
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5 text-left">
            {error && (
              <div className="bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 rounded-lg font-mono">
                {error}
              </div>
            )}

            {/* Direct One-Click Demo Access Buttons */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#71717A]">
                Instant Demo Access
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDevLogin('clinician')}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium text-xs rounded-lg transition-all shadow-sm active:scale-95"
                >
                  <Stethoscope className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Clinician (Primary)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDevLogin('patient')}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-[#27272A] font-medium text-xs transition-all shadow-sm active:scale-95"
                >
                  <User className="w-3.5 h-3.5 text-[#71717A]" strokeWidth={1.75} />
                  <span>Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDevLogin('billing_admin')}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg text-[#27272A] font-medium text-xs transition-all shadow-sm active:scale-95"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#71717A]" strokeWidth={1.75} />
                  <span>Operations</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDevLogin('admin')}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-[#18181B] hover:bg-[#27272A] text-white font-medium text-xs rounded-lg transition-all shadow-sm active:scale-95"
                >
                  <Terminal className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Admin Console</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#E4E4E7] w-full" />
              <span className="bg-white px-2.5 text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider absolute">Or Standard Account</span>
            </div>

            {/* Standard Firebase Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#27272A]" htmlFor="email">
                  Clinical Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="clinician@praxis.health"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-white border-[#E4E4E7] text-[#09090B] focus-visible:ring-[#0066FF] rounded-lg text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#27272A]" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-white border-[#E4E4E7] text-[#09090B] focus-visible:ring-[#0066FF] rounded-lg text-xs h-9"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#09090B] hover:bg-[#27272A] text-white font-medium py-2 rounded-lg transition-all text-xs shadow-sm h-9"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In with Email'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security & Compliance Badges Footer */}
        <div className="flex items-center justify-center space-x-5 text-[11px] font-mono text-[#71717A]">
          <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#0066FF]" strokeWidth={1.75} /> DPDP Protected (India)</span>
          <span className="flex items-center"><Lock className="w-3.5 h-3.5 mr-1 text-[#0066FF]" strokeWidth={1.75} /> 256-bit Encrypted</span>
          <span className="flex items-center"><UserCheck className="w-3.5 h-3.5 mr-1 text-[#0066FF]" strokeWidth={1.75} /> Client Signal DSP</span>
        </div>

      </div>
    </div>
  )
}
