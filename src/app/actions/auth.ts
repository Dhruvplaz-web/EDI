'use server'

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/server'
import { createSignedSessionToken, type VerifiedSessionPayload } from '@/lib/auth/session'

export async function createSession(idToken: string, clientRole?: string) {
  try {
    const expiresIn = 60 * 60 * 8 // 8 hours
    let uid = 'user_' + Date.now()
    let role: VerifiedSessionPayload['role'] = (clientRole as VerifiedSessionPayload['role']) || 'patient'
    let orgId = 'org_praxis_demo'

    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      uid = decoded.uid
      if (decoded.role) role = decoded.role as VerifiedSessionPayload['role']
      if (decoded.orgId) orgId = decoded.orgId as string
    } catch {
      // In development or when using mock/demo tokens, proceed with validated role
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid Firebase ID token in production')
      }
    }

    const sessionToken = await createSignedSessionToken({ uid, role, orgId }, expiresIn)
    const cookieStore = await cookies()
    
    cookieStore.set('session', sessionToken, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    cookieStore.set('user_role', role, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })
    
    return { success: true }
  } catch (error) {
    console.error('Session creation failed', error)
    return { success: false, error: 'Internal error' }
  }
}

export async function removeSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  cookieStore.delete('user_role')
}
