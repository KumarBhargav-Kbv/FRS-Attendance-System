const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const { auth, isAdmin, isFaculty } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// GET /api/students - Get all students
router.get('/', auth, async (req, res) => {
  try {
    const { department, year, section, search, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (department) filter.departmentId = department;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      students,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('userId', 'name email role status');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/students - Create student
router.post('/', auth, isAdmin, [
  body('studentId').trim().notEmpty(),
  body('rollNumber').trim().notEmpty(),
  body('fullName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('departmentId').notEmpty(),
  body('year').isInt({ min: 1, max: 4 }),
  body('section').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { studentId, rollNumber, fullName, email, phone, dateOfBirth, gender,
            departmentId, year, section, batch } = req.body;

    // Check duplicates
    const existing = await Student.findOne({ $or: [{ studentId }, { email }] });
    if (existing) {
      return res.status(400).json({ message: 'Student ID or email already exists' });
    }

    // Create user account
    const user = await User.create({
      name: fullName,
      email,
      password: `Student@${studentId}`,
      role: 'STUDENT'
    });

    // Create student record
    const student = await Student.create({
      userId: user._id,
      studentId, rollNumber, fullName, email, phone, dateOfBirth, gender,
      departmentId, year, section, batch
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_STUDENT',
      targetId: student._id,
      targetModel: 'Student',
      description: `Created student ${fullName} (${studentId})`
    });

    const populated = await Student.findById(student._id).populate('departmentId', 'name code');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const allowedUpdates = ['fullName', 'phone', 'dateOfBirth', 'gender', 'departmentId',
                            'year', 'section', 'batch', 'status', 'rollNumber'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Student.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('departmentId', 'name code');

    // Update associated user if name changed
    if (updates.fullName) {
      await User.findByIdAndUpdate(student.userId, { name: updates.fullName });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_STUDENT',
      targetId: student._id,
      targetModel: 'Student',
      description: `Updated student ${student.fullName}`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(student.userId);

    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE_STUDENT',
      targetId: student._id,
      targetModel: 'Student',
      description: `Deleted student ${student.fullName} (${student.studentId})`
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/students/:id/register-face - Register student face
router.post('/:id/register-face', auth, isFaculty, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { images } = req.body; // Array of base64 images
    if (!images || !images.length) {
      return res.status(400).json({ message: 'No face images provided' });
    }

    // Send to Python AI service
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/face/register`, {
        student_id: student.studentId,
        images: images
      }, { timeout: 30000 });

      if (aiResponse.data.success) {
        student.faceRegistered = true;
        student.faceEmbedding = aiResponse.data.embedding;
        await student.save();

        await AuditLog.create({
          userId: req.user._id,
          action: 'REGISTER_FACE',
          targetId: student._id,
          targetModel: 'Student',
          description: `Registered face for ${student.fullName} (${student.studentId})`
        });

        return res.json({
          success: true,
          message: 'Face registered successfully',
          qualityScore: aiResponse.data.quality_score
        });
      } else {
        return res.status(400).json({
          success: false,
          message: aiResponse.data.message || 'Face registration failed'
        });
      }
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'Face recognition service unavailable. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Register face error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/students/:id/approve - Approve a student registration
router.put('/:id/approve', [auth, isAdmin], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const user = await User.findById(student.userId);
    if (!user) {
      return res.status(404).json({ message: 'Associated student user account not found' });
    }

    // Set status to ACTIVE for both documents
    user.status = 'ACTIVE';
    student.status = 'ACTIVE';

    await user.save();
    await student.save();

    // Create Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'APPROVE_STUDENT',
      description: `Approved student account for ${student.fullName} (${student.studentId})`
    });

    res.json({
      success: true,
      message: `Successfully approved student ${student.fullName}!`,
      student
    });
  } catch (error) {
    console.error('Approve student error:', error);
    res.status(500).json({ message: 'Server error during approval' });
  }
});

module.exports = router;
