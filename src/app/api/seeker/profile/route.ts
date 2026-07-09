import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// PUT /api/seeker/profile (Seeker only, update profile)
export async function PUT(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== 'JOB_SEEKER') {
      return NextResponse.json({ error: 'Unauthorized: Seeker role required' }, { status: 403 });
    }

    const userId = authUser.id;
    const body = await request.json();
    const { name, bio, title, skills } = body;

    // Update name on the User model and bio, title, skills on the Profile model in a transaction
    await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({
          where: { id: userId },
          data: { name },
        });
      }

      await tx.profile.update({
        where: { userId },
        data: {
          bio: bio !== undefined ? bio : undefined,
          title: title !== undefined ? title : undefined,
          skills: skills !== undefined ? skills : undefined,
        },
      });
    });

    // Get updated profile details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profile: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update seeker profile error:', error);
    return NextResponse.json({ error: 'Internal server error updating profile' }, { status: 500 });
  }
}
