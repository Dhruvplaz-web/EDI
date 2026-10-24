import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const environmentMapping: Record<string, string[]> = {
  patient: ['/patient'],
  guardian: ['/patient'],
  medical_assistant: ['/clinical'],
  nurse: ['/clinical'],
  clinician: ['/clinical'],
  clinical_director: ['/clinical', '/operations'],
  specialist: ['/clinical'],
  billing_admin: ['/operations'],
  clinic_manager: ['/operations'],
  it_support: ['/admin', '/operations'],
  super_admin: ['/admin', '/clinical', '/operations', '/patient'],
};

const defaultDashboardMapping: Record<string, string> = {
  patient: '/patient/dashboard',
  clinician: '/clinical/queue',
  clinical_director: '/clinical/queue',
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
  '/patient/intake',
  '/api/health',
  '/api/stripe/webhook',
  '/api/dev-login', // dev-login internally rejects in production
];

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const pathname = request.nextUrl.pathname;

  // Ignore static assets and Next internal paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/worklets') ||
    pathname.startsWith('/models') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.task')
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));

  // If unauthenticated
  if (!session || !userRole) {
    if (!isPublicRoute) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Authenticated user validation
  const allowedPrefixes = environmentMapping[userRole];

  // If role is invalid/unknown
  if (!allowedPrefixes) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden: Unrecognized role.' }, { status: 403 });
    }
    if (pathname !== '/login' && pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // Redirect authenticated user from /login to their designated default dashboard
  if (pathname === '/login') {
    const defaultDashboard = defaultDashboardMapping[userRole] || '/clinical/queue';
    return NextResponse.redirect(new URL(defaultDashboard, request.url));
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
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // API endpoint RBAC enforcement
  if (pathname.startsWith('/api/clinical/') && !['clinician', 'clinical_director', 'nurse', 'super_admin'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: Clinical role required.' }, { status: 403 });
  }

  if (pathname.startsWith('/api/admin/') && !['super_admin', 'it_support'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: Admin role required.' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
