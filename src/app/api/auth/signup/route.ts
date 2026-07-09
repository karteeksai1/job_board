import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setAuthCookies } from '@/lib/auth-helper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, companyName } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'All fields (email, password, name, role) are required' }, { status: 400 });
    }

    if (role !== 'JOB_SEEKER' && role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Invalid role. Must be JOB_SEEKER or EMPLOYER' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      });

      // Initialize profile
      await tx.profile.create({
        data: {
          userId: user.id,
          companyName: role === 'EMPLOYER' ? companyName || null : null,
        },
      });

      return user;
    });

    // Set HTTP-Only cookies
    await setAuthCookies(newUser);

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error during signup' }, { status: 500 });
  }
}
