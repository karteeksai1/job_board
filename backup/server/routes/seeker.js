const express = require('express');
const router = express.Router();
const prisma = require('../prisma/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/seeker/dashboard (Seeker only)
router.get(
  '/dashboard',
  authenticateToken,
  requireRole(['JOB_SEEKER']),
  async (req, res) => {
    try {
      const userId = req.user.id;

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

      res.json({
        applications,
        bookmarks,
      });
    } catch (error) {
      console.error('Fetch seeker dashboard error:', error);
      res.status(500).json({ error: 'Internal server error loading dashboard' });
    }
  }
);

// POST /api/seeker/bookmarks/:jobId (Seeker only, toggles bookmark)
router.post(
  '/bookmarks/:jobId',
  authenticateToken,
  requireRole(['JOB_SEEKER']),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Verify job exists
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
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
        return res.json({ bookmarked: false, message: 'Job bookmark removed' });
      } else {
        // Create it
        await prisma.bookmark.create({
          data: {
            userId,
            jobId,
          },
        });
        return res.json({ bookmarked: true, message: 'Job bookmarked successfully' });
      }
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      res.status(500).json({ error: 'Internal server error toggling bookmark' });
    }
  }
);

// PUT /api/seeker/profile (Seeker only, update profile)
router.put(
  '/profile',
  authenticateToken,
  requireRole(['JOB_SEEKER']),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, bio, title, skills } = req.body;

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

      res.json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (error) {
      console.error('Update seeker profile error:', error);
      res.status(500).json({ error: 'Internal server error updating profile' });
    }
  }
);

module.exports = router;
