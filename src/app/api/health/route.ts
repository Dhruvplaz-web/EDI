import { NextResponse } from 'next/server';

export async function GET() {
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
