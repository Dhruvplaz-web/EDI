'use server'

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/server'

export async function createSession(idToken: string, role: string) {
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    const cookieStore = await cookies()
    
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    // Set a secondary cookie for Edge routing
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
