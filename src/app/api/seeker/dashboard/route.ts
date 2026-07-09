import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// GET /api/seeker/dashboard (Seeker only)
export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== 'JOB_SEEKER') {
      return NextResponse.json({ error: 'Unauthorized: Seeker role required' }, { status: 403 });
    }

    const userId = authUser.id;

    // Fetch applications submitted by the seeker
    const applications = await prisma.application.findMany({
      where: { seekerId: userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            companyLogo: true,
            location: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch bookmarked jobs by the seeker
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            companyLogo: true,
            location: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      applications,
      bookmarks,
    });
  } catch (error) {
    console.error('Fetch seeker dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error loading dashboard' }, { status: 500 });
  }
}
