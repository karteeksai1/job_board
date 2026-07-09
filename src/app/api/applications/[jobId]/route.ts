import { NextResponse } from 'next/server';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST /api/applications/[jobId] (Seeker only, apply to a job)
export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const authUser = await getAuthenticatedUser();

    if (!authUser || authUser.role !== 'JOB_SEEKER') {
      return NextResponse.json({ error: 'Unauthorized: Seeker role required' }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const resumeFile = formData.get('resume') as File | null;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if seeker has already applied to this job
    const existingApp = await prisma.application.findFirst({
      where: {
        jobId,
        seekerId: authUser.id,
      },
    });

    if (existingApp) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 });
    }

    let resumeUrl = '';

    // Handle resume file upload or use existing resume
    if (resumeFile && resumeFile.size > 0) {
      const bytes = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Ensure public/uploads directory exists
      const publicUploadsDir = join(process.cwd(), 'public', 'uploads');
      if (!existsSync(publicUploadsDir)) {
        await mkdir(publicUploadsDir, { recursive: true });
      }
      
      const filename = `${Date.now()}-${resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filepath = join(publicUploadsDir, filename);
      await writeFile(filepath, buffer);
      
      resumeUrl = `/uploads/${filename}`;
      
      // Update seeker's profile with this resume url
      await prisma.profile.update({
        where: { userId: authUser.id },
        data: { resumeUrl },
      });
    } else {
      // Look up user's profile to see if they have an existing resume
      const profile = await prisma.profile.findUnique({
        where: { userId: authUser.id },
      });

      if (profile && profile.resumeUrl) {
        resumeUrl = profile.resumeUrl;
      } else {
        return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
      }
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        jobId,
        seekerId: authUser.id,
        name,
        email,
        resumeUrl,
        coverLetter: coverLetter || null,
        status: 'APPLIED',
      },
    });

    return NextResponse.json({
      message: 'Application submitted successfully',
      application,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Apply to job error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error submitting application' }, { status: 500 });
  }
}
