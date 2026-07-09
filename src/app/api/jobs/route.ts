import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// GET /api/jobs (Public with filters, search, sorting, and pagination)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const jobType = searchParams.get('jobType');
    const experienceLevel = searchParams.get('experienceLevel');
    const salaryMin = searchParams.get('salaryMin');
    const salaryMax = searchParams.get('salaryMax');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    // Build the query conditions
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      if (location.toLowerCase() === 'remote') {
        where.location = { contains: 'remote', mode: 'insensitive' };
      } else {
        where.location = { contains: location, mode: 'insensitive' };
      }
    }

    if (jobType) {
      const types = jobType.split(',');
      where.jobType = { in: types };
    }

    if (experienceLevel) {
      const levels = experienceLevel.split(',');
      where.experienceLevel = { in: levels };
    }

    if (salaryMin) {
      where.salaryMax = { gte: parseInt(salaryMin) };
    }

    if (salaryMax) {
      where.salaryMin = { lte: parseInt(salaryMax) };
    }

    // Determine Sorting
    let orderBy: any = {};
    if (sortBy === 'salary_high_low') {
      orderBy = { salaryMax: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    // Fetch jobs and total count
    const [jobs, totalCount] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: parsedLimit,
        include: {
          employer: {
            select: {
              name: true,
              profile: {
                select: {
                  companyLogo: true,
                },
              },
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        total: totalCount,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(totalCount / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Fetch jobs error:', error);
    return NextResponse.json({ error: 'Internal server error fetching jobs' }, { status: 500 });
  }
}

// POST /api/jobs (Employer only, create new job)
export async function POST(request: Request) {
  try {
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

    if (!title || !companyName || !location || !jobType || !experienceLevel || !description) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        employerId: authUser.id,
        title,
        companyName,
        companyLogo: companyLogo || null,
        location,
        jobType,
        experienceLevel,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        description,
        requirements: requirements || '',
        responsibilities: responsibilities || '',
      },
    });

    return NextResponse.json({
      message: 'Job posting created successfully',
      job,
    }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Internal server error creating job posting' }, { status: 500 });
  }
}
