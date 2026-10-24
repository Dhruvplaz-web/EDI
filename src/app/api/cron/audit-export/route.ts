import { NextRequest, NextResponse } from 'next/server';
import { generateDailyAuditExport } from '@/lib/telemetry/server-audit-logger';

/**
 * Praxis AI - Daily Compliance Audit Export Cron Job (DPDP Act 2023 / CERT-In Directions)
 * 
 * Scheduled to run daily (e.g. 03:00 UTC) via Cloud Scheduler or Vercel Cron.
 * Authenticates via Authorization: Bearer ${CRON_SECRET}.
 * 
 * Verifies hash chain integrity across all audit records and produces
 * a tamper-evident, HMAC-signed compliance manifest bundle.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron authentication token.' },
        { status: 401 }
      );
    }
  }

  const orgId = req.nextUrl.searchParams.get('orgId') || undefined;

  try {
    const exportBundle = await generateDailyAuditExport(orgId);

    if (!exportBundle.chainIntegrityVerified) {
      console.error('[Audit Export Critical Alert] Hash chain integrity check FAILED during daily export!');
      return NextResponse.json(
        {
          error: 'CRITICAL_INTEGRITY_VIOLATION: Audit trail hash chain verification failed. Possible record tampering.',
          exportBundle,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exportBundle,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown export error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
