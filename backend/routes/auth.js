const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ message: 'Your account is pending administrator approval.' });
    }
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Your account is inactive.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get additional profile data
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await Student.findOne({ userId: user._id }).populate('departmentId');
    } else if (user.role === 'FACULTY') {
      profile = await Faculty.findOne({ userId: user._id }).populate('departmentId');
    }

    res.json({
      token,
      user: user.toJSON(),
      profile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register (admin only creates users)
router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['ADMIN', 'FACULTY', 'STUDENT'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

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
    console.error('Register error:', error);
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
router.post('/student/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('studentId').trim().notEmpty(),
  body('rollNumber').trim().notEmpty(),
  body('departmentId').trim().notEmpty(),
  body('year').isInt({ min: 1, max: 4 }),
  body('section').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input parameters', errors: errors.array() });
    }

    const { name, email, password, studentId, rollNumber, departmentId, year, section } = req.body;

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
      status: 'INACTIVE' // inactive until approved
    });

    res.status(201).json({
      message: 'Registration successful! Your account is pending administrator approval.',
      user: user.toJSON(),
      profile: student
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Registration failed due to server error' });
  }
});

module.exports = router;
