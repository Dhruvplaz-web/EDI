import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySignedSessionToken } from '@/lib/auth/session';

/**
 * Praxis AI - Active Consultation Session Heartbeat (Part E.2)
 * Dispatched every 5 minutes by the active consultation room.
 * Keeps the clinician/patient session alive during long clinical consultations.
 */
export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  const verified = await verifySignedSessionToken(sessionToken);
  if (!verified) {
    return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'alive',
    uid: verified.uid,
    role: verified.role,
    orgId: verified.orgId,
    timestamp: Date.now(),
  });
}
