import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth-helper';

export async function POST() {
  try {
    await clearAuthCookies();
    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error during logout' }, { status: 500 });
  }
}
