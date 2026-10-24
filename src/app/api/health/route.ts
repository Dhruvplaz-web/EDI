import { NextResponse } from 'next/server';
import { getVerifiedSession } from '@/lib/auth/session';

export async function GET(_req?: Request) {
  const session = await getVerifiedSession();

  // Restrict detailed system diagnostic metrics to authenticated admins only (Section E)
  if (!session || !['super_admin', 'it_support'].includes(session.role)) {
    return NextResponse.json(
      { status: 'ok' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  // Full diagnostics for authenticated system administrators
  const startTime = Date.now();
  const uptime = process.uptime();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(uptime),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      nextjs: 'operational',
      database: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'fallback_mode',
      stripe: process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder') 
        ? 'live' 
        : 'sandbox_mode',
    },
    latencyMs: Date.now() - startTime,
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
