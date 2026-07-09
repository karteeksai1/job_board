import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// GET /api/applications/employer (Employer only)
export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Unauthorized: Employer role required' }, { status: 403 });
    }

    const applications = await prisma.application.findMany({
      where: {
        job: {
          employerId: authUser.id,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
        seeker: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                skills: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Fetch employer applications error:', error);
    return NextResponse.json({ error: 'Internal server error fetching applications' }, { status: 500 });
  }
}
