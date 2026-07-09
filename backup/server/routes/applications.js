const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File Filter for PDFs and Docs
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .pdf, .doc, and .docx formats are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/applications/:jobId (Seeker only, apply to a job)
router.post(
  '/:jobId',
  authenticateToken,
  requireRole(['JOB_SEEKER']),
  upload.single('resume'),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { name, email, coverLetter } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check if job exists
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check if seeker has already applied to this job
      const existingApp = await prisma.application.findFirst({
        where: {
          jobId,
          seekerId: req.user.id,
        },
      });

      if (existingApp) {
        return res.status(400).json({ error: 'You have already applied to this job' });
      }

      let resumeUrl = null;

      // Handle resume file upload or use existing resume
      if (req.file) {
        resumeUrl = `/uploads/${req.file.filename}`;
        
        // Optionally update user's profile with this resume
        await prisma.profile.update({
          where: { userId: req.user.id },
          data: { resumeUrl },
        });
      } else {
        // Look up user's profile to see if they have an existing resume
        const profile = await prisma.profile.findUnique({
          where: { userId: req.user.id },
        });

        if (profile && profile.resumeUrl) {
          resumeUrl = profile.resumeUrl;
        } else {
          return res.status(400).json({ error: 'Resume file is required' });
        }
      }

      // Create the application
      const application = await prisma.application.create({
        data: {
          jobId,
          seekerId: req.user.id,
          name,
          email,
          resumeUrl,
          coverLetter: coverLetter || null,
          status: 'APPLIED',
        },
      });

      res.status(201).json({
        message: 'Application submitted successfully',
        application,
      });
    } catch (error) {
      console.error('Apply to job error:', error);
      res.status(500).json({ error: error.message || 'Internal server error submitting application' });
    }
  }
);

// GET /api/applications/employer (Employer only, list all applications for employer's jobs)
router.get(
  '/employer',
  authenticateToken,
  requireRole(['EMPLOYER']),
  async (req, res) => {
    try {
      const applications = await prisma.application.findMany({
        where: {
          job: {
            employerId: req.user.id,
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

      res.json({ applications });
    } catch (error) {
      console.error('Fetch employer applications error:', error);
      res.status(500).json({ error: 'Internal server error fetching applications' });
    }
  }
);

// PATCH /api/applications/:id/status (Employer only, update candidate status)
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole(['EMPLOYER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid application status' });
      }

      // Check application exists and belongs to employer's job
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          job: true,
        },
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.job.employerId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to modify this application status' });
      }

      const updatedApplication = await prisma.application.update({
        where: { id },
        data: { status },
      });

      res.json({
        message: `Application status updated to ${status}`,
        application: updatedApplication,
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Internal server error updating application status' });
    }
  }
);

module.exports = router;
