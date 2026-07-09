import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const ACCESS_SECRET = process.env.JWT_SECRET || 'development-access-secret-1234567890-abcdef';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-1234567890-abcdef';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface UserTokenPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function signAccessToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as UserTokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return { expired: true } as any;
    }
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { id: string };
  } catch {
    return null;
  }
}

export async function setAuthCookies(user: { id: string; email: string; role: string; name: string }) {
  const cookieStore = await cookies();
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  const refreshToken = signRefreshToken({ id: user.id });

  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60,
    path: '/',
  });

  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

export async function getAuthenticatedUser(): Promise<UserTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  
  const decoded = verifyAccessToken(token);
  if (decoded && !(decoded as any).expired) {
    return decoded;
  }
  
  // Auto refresh token server-side if expired but refresh token exists
  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) return null;
  
  const decodedRefresh = verifyRefreshToken(refreshToken);
  if (!decodedRefresh) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: decodedRefresh.id },
    });
    if (!user) return null;
    
    // Automatically re-sign and reset cookies
    await setAuthCookies(user);
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  } catch {
    return null;
  }
}
