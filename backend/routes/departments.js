const express = require('express');
const { body, validationResult } = require('express-validator');
const Department = require('../models/Department');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/departments
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/departments
router.post('/', auth, isAdmin, [
  body('name').trim().notEmpty(),
  body('code').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const department = await Department.create(req.body);
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/departments/:id
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
