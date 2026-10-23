import { NextResponse } from 'next/server'
import { removeSession } from '@/app/actions/auth'

export async function GET(request: Request) {
  await removeSession()
  return NextResponse.redirect(new URL('/login', request.url))
}
