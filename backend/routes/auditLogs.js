const express = require('express');
const AuditLog = require('../models/AuditLog');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit-logs
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { action, user, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (user) filter.userId = user;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
