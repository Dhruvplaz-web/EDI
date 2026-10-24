import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as iceGET } from '@/app/api/webrtc/ice/route';
import { createSignedSessionToken } from '@/lib/auth/session';

let currentMockCookies: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = currentMockCookies[name];
      return val !== undefined ? { value: val } : undefined;
    },
    set: vi.fn(),
  }),
}));

describe('C.1: Authenticated WebRTC ICE / Short-Lived TURN Credential Endpoint', () => {
  beforeEach(() => {
    currentMockCookies = {};
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new NextRequest('https://praxis-ai.health/api/webrtc/ice');
    const res = await iceGET(req);
    expect(res.status).toBe(401);
  });

  it('returns short-lived HMAC TURN credentials for authenticated clinical session', async () => {
    process.env.TURN_SERVER_URL = 'turn.praxis-ai.health:3478';
    process.env.TURN_SHARED_SECRET = 'coturn_shared_secret_32bytes_min!!';

    const token = await createSignedSessionToken({
      uid: 'dr_verified_123',
      role: 'clinician',
      orgId: 'org_main_hospital',
    });
    currentMockCookies['session'] = token;

    const req = new NextRequest('https://praxis-ai.health/api/webrtc/ice');
    const res = await iceGET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.iceServers).toBeDefined();
    expect(data.iceServers.length).toBeGreaterThan(0);

    const turnServer = data.iceServers.find((s: { urls: string[] | string }) => 
      Array.isArray(s.urls) ? s.urls.some((u: string) => u.startsWith('turn:')) : s.urls.startsWith('turn:')
    );
    expect(turnServer).toBeDefined();
    expect(turnServer.username).toContain('dr_verified_123');
    expect(turnServer.credential).toBeTruthy();
  });
});
