const express = require('express');
const router = express.Router();
const prisma = require('../prisma/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/analytics/employer (Employer only)
router.get(
  '/employer',
  authenticateToken,
  requireRole(['EMPLOYER']),
  async (req, res) => {
    try {
      const employerId = req.user.id;

      // Get all jobs posted by this employer
      const jobs = await prisma.job.findMany({
        where: { employerId },
        include: {
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate overall statistics
      let totalViews = 0;
      let totalApplications = 0;
      
      const jobAnalytics = jobs.map((job) => {
        totalViews += job.views;
        totalApplications += job._count.applications;
        return {
          id: job.id,
          title: job.title,
          location: job.location,
          jobType: job.jobType,
          views: job.views,
          applicantCount: job._count.applications,
          createdAt: job.createdAt,
        };
      });

      // Get pipeline breakdown
      const applications = await prisma.application.findMany({
        where: {
          job: {
            employerId,
          },
        },
        select: {
          status: true,
        },
      });

      const pipeline = {
        applied: 0,
        shortlisted: 0,
        rejected: 0,
        hired: 0,
      };

      applications.forEach((app) => {
        const status = app.status.toLowerCase();
        if (status === 'applied') pipeline.applied++;
        else if (status === 'shortlisted') pipeline.shortlisted++;
        else if (status === 'rejected') pipeline.rejected++;
        else if (status === 'hired') pipeline.hired++;
      });

      res.json({
        summary: {
          totalPostings: jobs.length,
          totalViews,
          totalApplications,
        },
        pipeline,
        jobAnalytics,
      });
    } catch (error) {
      console.error('Fetch employer analytics error:', error);
      res.status(500).json({ error: 'Internal server error fetching analytics' });
    }
  }
);

module.exports = router;
