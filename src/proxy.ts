import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { verifySignedSessionToken, createSignedSessionToken, type UserRole } from '@/lib/auth/session';

// Platform Super Admin policy: NO default PHI access (/clinical, /patient removed)
const environmentMapping: Record<UserRole, string[]> = {
  patient: ['/patient'],
  guardian: ['/patient'],
  medical_assistant: ['/clinical'],
  nurse: ['/clinical'],
  clinician: ['/clinical'],
  clinical_director: ['/clinical', '/operations'],
  specialist: ['/clinical'],
  operations: ['/operations'],
  billing_admin: ['/operations'],
  clinic_manager: ['/operations'],
  it_support: ['/admin', '/operations'],
  super_admin: ['/admin', '/operations'],
};

const defaultDashboardMapping: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  guardian: '/patient/dashboard',
  clinician: '/clinical/queue',
  clinical_director: '/clinical/queue',
  nurse: '/clinical/queue',
  medical_assistant: '/clinical/queue',
  specialist: '/clinical/queue',
  operations: '/operations/dashboard',
  billing_admin: '/operations/dashboard',
  clinic_manager: '/operations/dashboard',
  super_admin: '/admin/dashboard',
  it_support: '/admin/dashboard',
};

// Explicit public endpoints that do not require an active session
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/unauthorized',
  '/privacy',
  '/terms',
  '/compliance',
  '/crisis',
  '/subprocessors',
  '/troubleshoot/network',
  '/patient/intake',
  '/pricing',
  '/api/health',
  '/api/stripe/webhook',
  '/api/razorpay/webhook',
  '/api/dpdp/consent',
  '/api/dpdp/rights',
  '/api/dev-login', // dev-login internally rejects in production
];

// Validate that redirect URL is a strictly same-origin relative path
export function getSafeRedirectUrl(rawRedirect: string | null, fallback: string): string {
  if (!rawRedirect || typeof rawRedirect !== 'string') return fallback;
  const trimmed = rawRedirect.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes(':')
  ) {
    return trimmed;
  }
  return fallback;
}

/**
 * Builds the strict Content-Security-Policy header.
 * - Dynamic per-request cryptographic nonce for script-src
 * - 'wasm-unsafe-eval' preserved exclusively for MediaPipe WASM and AudioWorklet DSP
 * - No 'unsafe-eval' in production
 * - style-src retains 'unsafe-inline' for Next.js dynamic CSS prop hydration
 * - Exact connect-src hosts only (Firestore, Auth, Token, Stripe, Razorpay); zero wildcards; zero consumer Gemini
 */
export function buildCspHeader(nonce: string, isDev: boolean = false): string {
  const scriptDirectives = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://challenges.cloudflare.com https://apis.google.com`
    : `'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://challenges.cloudflare.com https://apis.google.com`;

  const emulatorConnect = (isDev || process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true')
    ? " http://127.0.0.1:8080 http://127.0.0.1:9099 http://localhost:8080 http://localhost:9099 ws://127.0.0.1:8080"
    : "";

  return [
    "default-src 'self'",
    `script-src ${scriptDirectives}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    `connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.stripe.com https://api.razorpay.com https://lumberjack.razorpay.com https://challenges.cloudflare.com${emulatorConnect}`,
    "worker-src 'self' blob:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com https://apis.google.com https://praxis-ai-cdc46.firebaseapp.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';
  const csp = buildCspHeader(nonce, isDev);
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return response;
}

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const pathname = request.nextUrl.pathname;

  // Generate per-request cryptographic nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Strip any incoming x-verified-* spoof headers on EVERY request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-verified-uid');
  requestHeaders.delete('x-verified-role');
  requestHeaders.delete('x-verified-org');
  // Pass nonce downstream for Next.js script hydration
  requestHeaders.set('x-nonce', nonce);
  const cspValue = buildCspHeader(nonce, process.env.NODE_ENV === 'development');
  requestHeaders.set('Content-Security-Policy', cspValue);

  // Static Asset Bypass: Strictly require exact allowed directory prefixes with trailing slash
  const isStaticAsset =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/models/') ||
    pathname.startsWith('/worklets/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml';

  if (isStaticAsset) {
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return applySecurityHeaders(res, nonce);
  }

  const isPublicRoute = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));

  // Cryptographically verify session token (HMAC-SHA256 signature, expiration, and persistent revocation)
  const verifiedPayload = await verifySignedSessionToken(sessionCookie);

  if (!verifiedPayload) {
    if (!isPublicRoute) {
      if (pathname.startsWith('/api/')) {
        const res = NextResponse.json(
          { error: 'Unauthorized: Valid cryptographically signed session required.' },
          { status: 401 }
        );
        return applySecurityHeaders(res, nonce);
      }
      const loginUrl = new URL('/login', request.url);
      const safePath = getSafeRedirectUrl(pathname, '/');
      loginUrl.searchParams.set('redirect', safePath);
      const res = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(res, nonce);
    }
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return applySecurityHeaders(res, nonce);
  }

  // Derive role and orgId strictly from the cryptographically verified token
  const userRole = verifiedPayload.role;
  const orgId = verifiedPayload.orgId;
  const uid = verifiedPayload.uid;

  // Sliding idle timeout re-signing:
  // When lastActive is older than 60s and within 15min idle window, re-sign token preserving absolute exp
  const now = Math.floor(Date.now() / 1000);
  const lastActive = verifiedPayload.lastActive || verifiedPayload.iat;
  let renewedSessionToken: string | null = null;

  if (now - lastActive > 60 && now - lastActive <= 15 * 60) {
    const remainingLifetime = verifiedPayload.exp - now;
    if (remainingLifetime > 0) {
      renewedSessionToken = await createSignedSessionToken(
        {
          uid: verifiedPayload.uid,
          role: verifiedPayload.role,
          orgId: verifiedPayload.orgId,
          lastActive: now,
          sessionVersion: verifiedPayload.sessionVersion,
        },
        remainingLifetime
      );
    }
  }

  const attachRenewalCookie = (res: NextResponse) => {
    if (renewedSessionToken) {
      res.cookies.set('session', renewedSessionToken, {
        maxAge: verifiedPayload.exp - now,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });
    }
    return applySecurityHeaders(res, nonce);
  };

  // Authenticated user validation
  const allowedPrefixes = environmentMapping[userRole];

  if (!allowedPrefixes) {
    if (pathname.startsWith('/api/')) {
      return attachRenewalCookie(
        NextResponse.json({ error: 'Forbidden: Unrecognized role.' }, { status: 403 })
      );
    }
    if (pathname !== '/login' && pathname !== '/unauthorized') {
      return attachRenewalCookie(NextResponse.redirect(new URL('/unauthorized', request.url)));
    }
    return attachRenewalCookie(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Redirect authenticated user from /login to safe target or default dashboard
  if (pathname === '/login') {
    const rawRedirect = request.nextUrl.searchParams.get('redirect');
    const defaultDashboard = defaultDashboardMapping[userRole] || '/clinical/queue';
    const safeRedirect = getSafeRedirectUrl(rawRedirect, defaultDashboard);
    
    // Check if user has permission for the redirected path
    const hasPermissionForTarget = allowedPrefixes.some(prefix => safeRedirect.startsWith(prefix));
    const finalDestination = hasPermissionForTarget ? safeRedirect : defaultDashboard;
    return attachRenewalCookie(NextResponse.redirect(new URL(finalDestination, request.url)));
  }

  // Route boundary enforcement
  const isProtectedPortal = 
    pathname.startsWith('/patient') || 
    pathname.startsWith('/clinical') || 
    pathname.startsWith('/operations') || 
    pathname.startsWith('/admin');

  if (isProtectedPortal) {
    const isAllowed = allowedPrefixes.some(prefix => pathname.startsWith(prefix));
    if (!isAllowed) {
      return attachRenewalCookie(NextResponse.redirect(new URL('/unauthorized', request.url)));
    }
  }

  // API endpoint RBAC enforcement
  if (pathname.startsWith('/api/clinical/') && !['clinician', 'clinical_director', 'nurse', 'specialist', 'medical_assistant', 'super_admin'].includes(userRole)) {
    return attachRenewalCookie(NextResponse.json({ error: 'Forbidden: Clinical role required.' }, { status: 403 }));
  }

  if (pathname.startsWith('/api/admin/') && !['super_admin', 'it_support'].includes(userRole)) {
    return attachRenewalCookie(NextResponse.json({ error: 'Forbidden: Admin role required.' }, { status: 403 }));
  }

  // Gate Stripe checkout and customer portal to billing administrators
  if (
    (pathname.startsWith('/api/stripe/checkout') || pathname.startsWith('/api/stripe/portal')) &&
    !['billing_admin', 'clinic_manager', 'super_admin'].includes(userRole)
  ) {
    return attachRenewalCookie(NextResponse.json({ error: 'Forbidden: Billing administrative role required.' }, { status: 403 }));
  }

  // Forward verified identity headers for downstream server components and handlers
  requestHeaders.set('x-verified-uid', uid);
  requestHeaders.set('x-verified-role', userRole);
  requestHeaders.set('x-verified-org', orgId);

  // Return response WITHOUT leaking x-verified-* headers back to the client
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return attachRenewalCookie(res);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
