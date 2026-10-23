import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const environmentMapping: Record<string, string> = {
  patient: '/patient',
  guardian: '/patient',
  medical_assistant: '/clinical',
  nurse: '/clinical',
  clinician: '/clinical',
  specialist: '/clinical',
  billing_admin: '/operations',
  clinic_manager: '/operations',
  it_support: '/admin',
  super_admin: '/admin',
}

const defaultDashboardMapping: Record<string, string> = {
  '/patient': '/patient/dashboard',
  '/clinical': '/clinical/queue',
  '/operations': '/operations/dashboard',
  '/admin': '/admin/dashboard',
}

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const userRole = request.cookies.get('user_role')?.value
  const pathname = request.nextUrl.pathname
  
  // Public routes that don't need auth checking
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/unauthorized') {
    return NextResponse.next()
  }

  // If not authenticated, redirect to login (unless already on login)
  if (!session || !userRole) {
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // User is authenticated
  const targetEnvironment = environmentMapping[userRole]

  // If role is invalid, redirect to unauthorized
  if (!targetEnvironment) {
    if (pathname !== '/login' && pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return NextResponse.next()
  }

  // If visiting /login or root /, redirect to their dashboard
  if (pathname === '/login' || pathname === '/') {
    const dashboardUrl = defaultDashboardMapping[targetEnvironment]
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // Check if they are accessing an environment path
  const isAccessingEnvironment = pathname.startsWith('/patient') || 
                                 pathname.startsWith('/clinical') || 
                                 pathname.startsWith('/operations') || 
                                 pathname.startsWith('/admin')

  // If accessing a protected environment that doesn't match their designated environment
  if (isAccessingEnvironment && !pathname.startsWith(targetEnvironment)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
