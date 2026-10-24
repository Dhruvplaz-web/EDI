import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVerifiedSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const turnServerUrl = process.env.TURN_SERVER_URL || process.env.NEXT_PUBLIC_TURN_SERVER_URL;
  const turnSharedSecret = process.env.TURN_SHARED_SECRET || 'dev_insecure_turn_secret_only';

  const iceServers: RTCIceServer[] = [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ];

  if (turnServerUrl) {
    // Generate coturn short-lived credentials (RFC 7635)
    // Lifetime: 1 hour (3600 seconds)
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const username = `${expiry}:${session.uid}`;
    const hmac = crypto.createHmac('sha1', turnSharedSecret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    iceServers.push({
      urls: [
        `turn:${turnServerUrl}?transport=udp`,
        `turn:${turnServerUrl}?transport=tcp`,
        `turns:${turnServerUrl}?transport=tcp`
      ],
      username,
      credential
    });
  }

  return NextResponse.json({
    iceServers,
    iceCandidatePoolSize: 10,
    expiresAt: Math.floor(Date.now() / 1000) + 3600
  });
}
