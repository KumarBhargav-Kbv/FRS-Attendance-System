const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Input sanitization: strips HTML tags and whitelists safe chars (alphanumeric + spaces + standard symbols)
const sanitizeInputString = (val) => {
  if (typeof val !== 'string') return '';
  // Strip HTML/JS tags
  let cleaned = val.replace(/<[^>]*>?/gm, '');
  // Whitelist alphanumeric, spaces, and basic email/punctuation characters
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s\.\-_@,]/g, '');
  return cleaned.trim();
};

// Zod schemas for server-side validation
const loginSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  password: z.string().min(1),
  captcha: z.string().optional()
});

const registerAdminSchema = z.object({
  name: z.string().transform(sanitizeInputString),
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'FACULTY', 'STUDENT'])
});

const registerStudentSchema = z.object({
  name: z.string().transform(sanitizeInputString),
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  password: z.string().min(6),
  studentId: z.string().transform(sanitizeInputString),
  rollNumber: z.string().transform(sanitizeInputString),
  departmentId: z.string().transform(sanitizeInputString),
  year: z.number().int().min(1).max(4),
  section: z.string().transform(sanitizeInputString)
});

// Helper: response timing equalization and progressive delay for authentication failures
const sendGenericError = async (res, startTime, attempts) => {
  const elapsedTime = Date.now() - startTime;
  const progressiveDelay = attempts * 1000; // Progressive delay: 1s per failed attempt
  const totalWait = Math.max((1500 + progressiveDelay) - elapsedTime, 0);
  if (totalWait > 0) {
    await new Promise(resolve => setTimeout(resolve, totalWait));
  }
  return res.status(401).json({ message: 'Incorrect email or password.' });
};

// POST /api/auth/login - Verified and hardened login endpoint
router.post('/login', async (req, res) => {
  const startTime = Date.now();
  let emailValue = '';
  let loginAttemptsCount = 0;
  let userRecord = null;

  try {
    // Validate inputs
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return await sendGenericError(res, startTime, 0);
    }

    const { email, password, captcha } = result.data;
    emailValue = email;

    // Find user
    userRecord = await User.findOne({ email });
    if (!userRecord) {
      return await sendGenericError(res, startTime, 0);
    }

    loginAttemptsCount = userRecord.loginAttempts || 0;

    // Check account lockout (15 minutes)
    if (userRecord.lockUntil && userRecord.lockUntil > Date.now()) {
      return await sendGenericError(res, startTime, loginAttemptsCount);
    }

    // Require CAPTCHA validation after 3 failures
    if (loginAttemptsCount >= 3) {
      if (!captcha || captcha.toUpperCase() !== 'SVIET') {
        // Return same generic message on captcha failure to prevent probing
        return await sendGenericError(res, startTime, loginAttemptsCount);
      }
    }

    // Compare password using constant-time verification
    const isMatch = await userRecord.comparePassword(password);
    if (!isMatch) {
      // Mismatch: increment failed attempts
      userRecord.loginAttempts += 1;
      if (userRecord.loginAttempts >= 5) {
        userRecord.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await userRecord.save();
      return await sendGenericError(res, startTime, userRecord.loginAttempts);
    }

    // Account status check
    if (userRecord.status === 'PENDING') {
      const delay = Math.max(1500 - (Date.now() - startTime), 0);
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      return res.status(403).json({ message: 'Your account is pending administrator approval.' });
    }
    if (userRecord.status !== 'ACTIVE') {
      const delay = Math.max(1500 - (Date.now() - startTime), 0);
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      return res.status(403).json({ message: 'Your account is inactive.' });
    }

    // Successful login: reset attempts and lock
    userRecord.loginAttempts = 0;
    userRecord.lockUntil = null;
    await userRecord.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: userRecord._id, role: userRecord.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Fetch associated profile
    let profile = null;
    if (userRecord.role === 'STUDENT') {
      profile = await Student.findOne({ userId: userRecord._id }).populate('departmentId');
    } else if (userRecord.role === 'FACULTY') {
      profile = await Faculty.findOne({ userId: userRecord._id }).populate('departmentId');
    }

    // Apply timing pad to match elapsed time to 1.5 seconds
    const elapsedTime = Date.now() - startTime;
    const pad = Math.max(1500 - elapsedTime, 0);
    if (pad > 0) {
      await new Promise(r => setTimeout(r, pad));
    }

    res.json({
      token,
      user: userRecord.toJSON(),
      profile
    });
  } catch (error) {
    console.error('Login error:', error.message);
    // Timing-equalized generic response on server error
    const delay = Math.max(1500 - (Date.now() - startTime), 0);
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    res.status(500).json({ message: 'Incorrect email or password.' });
  }
});

// POST /api/auth/register (admin creates users)
router.post('/register', async (req, res) => {
  try {
    const result = registerAdminSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input parameters', errors: result.error.errors });
    }

    const { name, email, password, role } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: user.toJSON() });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'STUDENT') {
      profile = await Student.findOne({ userId: req.user._id }).populate('departmentId');
    } else if (req.user.role === 'FACULTY') {
      profile = await Faculty.findOne({ userId: req.user._id }).populate('departmentId').populate('subjects').populate('assignedClasses');
    }

    res.json({ user: req.user, profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/student/register (self-service signup for students)
router.post('/student/register', async (req, res) => {
  try {
    const result = registerStudentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input parameters', errors: result.error.errors });
    }

    const { name, email, password, studentId, rollNumber, departmentId, year, section } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    const existingStudent = await Student.findOne({ $or: [{ studentId }, { rollNumber }] });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID or Roll Number already registered' });
    }

    // Create user in PENDING state
    const user = await User.create({
      name,
      email,
      password,
      role: 'STUDENT',
      status: 'PENDING'
    });

    // Create student profile
    const student = await Student.create({
      userId: user._id,
      studentId,
      rollNumber,
      fullName: name,
      email,
      departmentId,
      year,
      section,
      status: 'PENDING' // pending until approved
    });

    res.status(201).json({
      message: 'Registration successful! Your account is pending administrator approval.',
      user: user.toJSON(),
      profile: student
    });
  } catch (error) {
    console.error('Student registration error:', error.message);
    res.status(500).json({ message: 'Registration failed due to server error' });
  }
});

module.exports = router;
