import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that don't require authentication
const publicPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
  const cookieToken = request.cookies.get('token')?.value
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const token = cookieToken || headerToken || ''
  const currentPath = request.nextUrl.pathname

  // Allow access to public paths
  if (publicPaths.includes(currentPath)) {
    // If user is already logged in, redirect to home page
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Check if user is authenticated for protected routes
  if (!token) {
    // Redirect to login page if not authenticated
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', currentPath)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 