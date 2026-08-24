const express = require('express');
const Settings = require('../models/Settings');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const settings = await Settings.find();
    const defaults = Settings.getDefaults();
    const result = { ...defaults };
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings
router.put('/', auth, isAdmin, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate(
        { key },
        { key, value, description: `Setting: ${key}` },
        { upsert: true, new: true }
      );
    }
    const settings = await Settings.find();
    const defaults = Settings.getDefaults();
    const result = { ...defaults };
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
