const express = require('express');
const { body, validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/subjects
router.get('/', auth, async (req, res) => {
  try {
    const { department, year, semester } = req.query;
    const filter = {};
    if (department) filter.departmentId = department;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);

    const subjects = await Subject.find(filter)
      .populate('departmentId', 'name code')
      .populate('facultyId', 'fullName facultyId')
      .sort({ subjectCode: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/subjects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('facultyId', 'fullName facultyId');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/subjects
router.post('/', auth, isAdmin, [
  body('subjectCode').trim().notEmpty(),
  body('subjectName').trim().notEmpty(),
  body('departmentId').notEmpty(),
  body('year').isInt({ min: 1, max: 4 }),
  body('semester').isInt({ min: 1, max: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const subject = await Subject.create(req.body);
    const populated = await Subject.findById(subject._id)
      .populate('departmentId', 'name code')
      .populate('facultyId', 'fullName facultyId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/subjects/:id
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('departmentId', 'name code')
      .populate('facultyId', 'fullName facultyId');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
