import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// GET /api/jobs/[id] (Public, single job detail - increments view count)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Increment view count and return updated job
    const job = await prisma.job.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                companyName: true,
                companyLogo: true,
                companyWebsite: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    // Fetch related jobs (same job type or location or title match, excluding current job)
    const relatedJobs = await prisma.job.findMany({
      where: {
        id: { not: id },
        OR: [
          { jobType: job.jobType },
          { location: { contains: job.location, mode: 'insensitive' } },
        ],
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ job, relatedJobs });
  } catch (error) {
    console.error('Fetch job details error:', error);
    return NextResponse.json({ error: 'Internal server error fetching job details' }, { status: 500 });
  }
}

// PUT /api/jobs/[id] (Employer only, update job)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Unauthorized: Employer role required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      companyName,
      companyLogo,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      description,
      requirements,
      responsibilities,
    } = body;

    // Check ownership
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (existingJob.employerId !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this job' }, { status: 403 });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title,
        companyName,
        companyLogo: companyLogo !== undefined ? companyLogo : existingJob.companyLogo,
        location,
        jobType,
        experienceLevel,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        description,
        requirements,
        responsibilities,
      },
    });

    return NextResponse.json({
      message: 'Job posting updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: 'Internal server error updating job posting' }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] (Employer only, delete job)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Unauthorized: Employer role required' }, { status: 403 });
    }

    // Check ownership
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (existingJob.employerId !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this job' }, { status: 403 });
    }

    await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json({ error: 'Internal server error deleting job posting' }, { status: 500 });
  }
}
