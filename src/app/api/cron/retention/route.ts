import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredTelemetry, PurgeResult } from '@/lib/retention/policy';
import { adminDb } from '@/lib/firebase/server';
import { PlanTier } from '@/lib/stripe/plans';

/**
 * Praxis AI - Automated Nightly Telemetry Purge Scheduler (Part G.3)
 * Triggered by Vercel Cron or Google Cloud Scheduler (e.g. daily at 02:00 UTC).
 * 
 * Authenticates via Authorization: Bearer ${CRON_SECRET}.
 * Supports dry-run inspection via ?dryRun=true query parameter.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron authentication token.' }, { status: 401 });
    }
  }

  const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';
  const results: PurgeResult[] = [];

  if (adminDb && process.env.NODE_ENV !== 'test') {
    try {
      const orgsSnapshot = await adminDb.collection('organizations').get();
      for (const orgDoc of orgsSnapshot.docs) {
        const orgData = orgDoc.data();
        const tier: PlanTier = orgData.subscription?.tier || 'starter';
        const purgeRes = await purgeExpiredTelemetry(orgDoc.id, tier, dryRun);
        results.push(purgeRes);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown cron error';
      console.error('[Retention Cron Error]:', msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } else {
    // Demonstration/test execution for default demo organization
    const demoRes = await purgeExpiredTelemetry('org_praxis_demo', 'starter', dryRun);
    results.push(demoRes);
  }

  const totalPurged = results.reduce((acc, r) => acc + r.purgedRecordsCount, 0);

  return NextResponse.json({
    success: true,
    mode: dryRun ? 'dry_run' : 'live_execution',
    totalOrganizationsProcessed: results.length,
    totalRecordsPurged: totalPurged,
    results,
    timestamp: new Date().toISOString(),
  });
}
