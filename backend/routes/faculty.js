const express = require('express');
const { body, validationResult } = require('express-validator');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/faculty
router.get('/', auth, async (req, res) => {
  try {
    const { department, search, status } = req.query;
    const filter = {};
    if (department) filter.departmentId = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const faculty = await Faculty.find(filter)
      .populate('departmentId', 'name code')
      .populate('subjects', 'subjectName subjectCode')
      .sort({ createdAt: -1 });

    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/faculty/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('subjects', 'subjectName subjectCode')
      .populate({
        path: 'assignedClasses',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'subjectId', select: 'subjectName subjectCode' }
        ]
      });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/faculty
router.post('/', auth, isAdmin, [
  body('facultyId').trim().notEmpty(),
  body('fullName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('departmentId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { facultyId, fullName, email, phone, departmentId } = req.body;

    const existing = await Faculty.findOne({ $or: [{ facultyId }, { email }] });
    if (existing) {
      return res.status(400).json({ message: 'Faculty ID or email already exists' });
    }

    // Create user account
    const user = await User.create({
      name: fullName,
      email,
      password: `Faculty@${facultyId}`,
      role: 'FACULTY'
    });

    const faculty = await Faculty.create({
      userId: user._id,
      facultyId, fullName, email, phone, departmentId
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_FACULTY',
      targetId: faculty._id,
      targetModel: 'Faculty',
      description: `Created faculty ${fullName} (${facultyId})`
    });

    const populated = await Faculty.findById(faculty._id).populate('departmentId', 'name code');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create faculty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/faculty/:id
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const allowedUpdates = ['fullName', 'phone', 'departmentId', 'subjects', 'assignedClasses', 'status'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Faculty.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('departmentId', 'name code');

    if (updates.fullName) {
      await User.findByIdAndUpdate(faculty.userId, { name: updates.fullName });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/faculty/:id
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await Faculty.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(faculty.userId);

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
