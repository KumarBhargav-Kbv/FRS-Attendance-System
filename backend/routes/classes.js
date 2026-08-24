const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/classes
router.get('/', auth, async (req, res) => {
  try {
    const { department, year, section, faculty } = req.query;
    const filter = {};
    if (department) filter.departmentId = department;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
    if (faculty) filter.facultyId = faculty;

    const classes = await Class.find(filter)
      .populate('departmentId', 'name code')
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName facultyId')
      .sort({ year: 1, section: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classes/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName facultyId');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classes
router.post('/', auth, isAdmin, [
  body('departmentId').notEmpty(),
  body('year').isInt({ min: 1, max: 4 }),
  body('section').trim().notEmpty(),
  body('subjectId').notEmpty(),
  body('facultyId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const cls = await Class.create(req.body);
    const populated = await Class.findById(cls._id)
      .populate('departmentId', 'name code')
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName facultyId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/classes/:id
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('departmentId', 'name code')
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName facultyId');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/classes/:id
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
