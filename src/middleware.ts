import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64url decoding
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isSeekerRoute = pathname.startsWith('/seeker');
  const isEmployerRoute = pathname.startsWith('/employer');

  if (isSeekerRoute || isEmployerRoute) {
    if (!accessToken && !refreshToken) {
      // Redirect to login if both tokens are missing
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Attempt to decode the token (or refresh payload if access token is missing but refresh token exists)
    const payload = accessToken ? decodeJwt(accessToken) : null;
    
    // Check if expired
    const isExpired = payload && payload.exp ? Date.now() >= payload.exp * 1000 : true;

    if ((!payload || isExpired) && refreshToken) {
      // Allow request to proceed. The page or layout server component will refresh the tokens and cookies!
      return NextResponse.next();
    }

    if (!payload || isExpired) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based routing restrictions
    if (isSeekerRoute && payload.role !== 'JOB_SEEKER') {
      const redirectUrl = payload.role === 'EMPLOYER' ? '/employer' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    if (isEmployerRoute && payload.role !== 'EMPLOYER') {
      const redirectUrl = payload.role === 'JOB_SEEKER' ? '/' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/seeker/:path*', '/employer/:path*'],
};
