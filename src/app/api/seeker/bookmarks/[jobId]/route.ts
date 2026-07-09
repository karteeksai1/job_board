import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST /api/seeker/bookmarks/[jobId] (Seeker only, toggles bookmark)
export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== 'JOB_SEEKER') {
      return NextResponse.json({ error: 'Unauthorized: Seeker role required' }, { status: 403 });
    }

    const userId = authUser.id;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (existingBookmark) {
      // Remove it
      await prisma.bookmark.delete({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
      });
      return NextResponse.json({ bookmarked: false, message: 'Job bookmark removed' });
    } else {
      // Create it
      await prisma.bookmark.create({
        data: {
          userId,
          jobId,
        },
      });
      return NextResponse.json({ bookmarked: true, message: 'Job bookmarked successfully' });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    return NextResponse.json({ error: 'Internal server error toggling bookmark' }, { status: 500 });
  }
}
