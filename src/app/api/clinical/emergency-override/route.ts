import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifySignedSessionToken } from '@/lib/auth/session';
import { adminDb } from '@/lib/firebase/server';
import * as admin from 'firebase-admin';
import { logServerAudit } from '@/lib/telemetry/server-audit-logger';

const emergencyOverrideSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  targetOrgId: z.string().min(1, 'targetOrgId is required'),
  reason: z.string().min(10, 'A clinical or technical justification of at least 10 characters is required'),
  approverId: z.string().min(1).optional(),
  secondFactorConfirmed: z.boolean().optional(),
  durationMinutes: z.number().int().min(5).max(240).default(30),
}).refine(
  (data) => Boolean(data.approverId) || Boolean(data.secondFactorConfirmed),
  { message: 'Emergency break-glass requires either an approver ID or second-factor confirmation.' }
);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    const verified = await verifySignedSessionToken(sessionToken);
    if (!verified) {
      return NextResponse.json(
        { error: 'Unauthorized: Cryptographically verified session required.' },
        { status: 401 }
      );
    }

    if (verified.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Platform super_admin role required for emergency break-glass override.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = emergencyOverrideSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid break-glass payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const now = Date.now();
    const durationMs = data.durationMinutes * 60 * 1000;
    const expiresAt = new Date(now + durationMs);

    const overrideId = `${verified.uid}_${data.patientId}`;

    const overrideRecord = {
      overrideId,
      actorId: verified.uid,
      actorRole: 'super_admin',
      targetOrgId: data.targetOrgId,
      patientId: data.patientId,
      reason: data.reason,
      approverId: data.approverId || null,
      secondFactorConfirmed: Boolean(data.secondFactorConfirmed),
      createdAt: admin.firestore.Timestamp.fromMillis(now),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    };

    if (adminDb && process.env.NODE_ENV !== 'test') {
      await adminDb.collection('emergency_overrides').doc(overrideId).set(overrideRecord);
    }

    // Record immutable audit entry
    await logServerAudit({
      action: 'EMERGENCY_BREAK_GLASS_ACTIVATED',
      actorId: verified.uid,
      actorRole: 'super_admin',
      orgId: data.targetOrgId,
      patientId: data.patientId,
      details: {
        reason: data.reason,
        approverId: data.approverId || null,
        secondFactorConfirmed: Boolean(data.secondFactorConfirmed),
        durationMinutes: data.durationMinutes,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      overrideId,
      expiresAt: expiresAt.toISOString(),
      patientId: data.patientId,
      targetOrgId: data.targetOrgId,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown break-glass error';
    console.error('[Emergency Break-Glass API Error]:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
