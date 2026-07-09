import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// PATCH /api/applications/status/[id] (Employer only, update candidate status)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Unauthorized: Employer role required' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid application status' }, { status: 400 });
    }

    // Check application exists and belongs to employer's job
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.job.employerId !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this application status' }, { status: 403 });
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      message: `Application status updated to ${status}`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Internal server error updating application status' }, { status: 500 });
  }
}
