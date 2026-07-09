const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/db');
const { authenticateToken } = require('../middleware/auth');

const ACCESS_SECRET = process.env.JWT_SECRET || 'development-access-secret-1234567890-abcdef';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-1234567890-abcdef';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role, companyName } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields (email, password, name, role) are required' });
    }

    if (role !== 'JOB_SEEKER' && role !== 'EMPLOYER') {
      return res.status(400).json({ error: 'Invalid role. Must be JOB_SEEKER or EMPLOYER' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      });

      // Initialize profile
      await tx.profile.create({
        data: {
          userId: user.id,
          companyName: role === 'EMPLOYER' ? companyName || null : null,
        },
      });

      return user;
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.profile ? user.profile.companyName : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  jwt.verify(refreshToken, REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const accessToken = generateAccessToken(user);

      res.json({ accessToken });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error during token refresh' });
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            title: true,
            resumeUrl: true,
            skills: true,
            companyName: true,
            companyLogo: true,
            companyWebsite: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error fetching profile' });
  }
});

module.exports = router;
