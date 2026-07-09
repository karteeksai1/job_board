const express = require('express');
const router = express.Router();
const prisma = require('../prisma/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/jobs (Public with filters, search, sorting, and pagination)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      sortBy = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    // Build the query conditions
    const where = {};

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
      // support comma-separated or single values
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
    let orderBy = {};
    if (sortBy === 'salary_high_low') {
      orderBy = { salaryMax: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else {
      // default: newest
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

    res.json({
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
    res.status(500).json({ error: 'Internal server error fetching jobs' });
  }
});

// GET /api/jobs/:id (Public, single job detail - increments view count)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
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

    res.json({ job, relatedJobs });
  } catch (error) {
    console.error('Fetch job details error:', error);
    res.status(500).json({ error: 'Internal server error fetching job details' });
  }
});

// POST /api/jobs (Employer only, create new job)
router.post('/', authenticateToken, requireRole(['EMPLOYER']), async (req, res) => {
  try {
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
    } = req.body;

    if (!title || !companyName || !location || !jobType || !experienceLevel || !description) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const job = await prisma.job.create({
      data: {
        employerId: req.user.id,
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

    res.status(201).json({
      message: 'Job posting created successfully',
      job,
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error creating job posting' });
  }
});

// PUT /api/jobs/:id (Employer only, update job)
router.put('/:id', authenticateToken, requireRole(['EMPLOYER']), async (req, res) => {
  try {
    const { id } = req.params;
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
    } = req.body;

    // Check ownership
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.employerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this job' });
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

    res.json({
      message: 'Job posting updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error updating job posting' });
  }
});

// DELETE /api/jobs/:id (Employer only, delete job)
router.delete('/:id', authenticateToken, requireRole(['EMPLOYER']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.employerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this job' });
    }

    await prisma.job.delete({
      where: { id },
    });

    res.json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error deleting job posting' });
  }
});

module.exports = router;
