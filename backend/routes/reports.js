const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const AttendanceSession = require('../models/AttendanceSession');
const { auth, isAdmin, isFaculty } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/daily
router.get('/daily', auth, isFaculty, async (req, res) => {
  try {
    const { date, department, year, section } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const filter = { date: { $gte: dayStart, $lte: dayEnd } };

    const records = await Attendance.find(filter)
      .populate({ path: 'studentId', select: 'fullName studentId departmentId year section', populate: { path: 'departmentId', select: 'name code' }})
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName')
      .sort({ time: 1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;

    res.json({
      date: dayStart.toISOString().split('T')[0],
      records,
      summary: {
        total,
        present,
        absent,
        late,
        percentage: total > 0 ? ((present + late) / total * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/monthly
router.get('/monthly', auth, isFaculty, async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const filter = { date: { $gte: start, $lte: end } };

    const records = await Attendance.find(filter)
      .populate({ path: 'studentId', select: 'fullName studentId departmentId year section', populate: { path: 'departmentId', select: 'name code' }})
      .populate('subjectId', 'subjectName subjectCode');

    // Group by date
    const dailyStats = {};
    records.forEach(r => {
      const d = r.date.toISOString().split('T')[0];
      if (!dailyStats[d]) dailyStats[d] = { date: d, total: 0, present: 0, absent: 0, late: 0 };
      dailyStats[d].total++;
      if (r.status === 'PRESENT') dailyStats[d].present++;
      else if (r.status === 'ABSENT') dailyStats[d].absent++;
      else if (r.status === 'LATE') dailyStats[d].late++;
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;

    res.json({
      month: m,
      year: y,
      dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      summary: {
        total,
        present,
        absent: total - present,
        percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
        workingDays: Object.keys(dailyStats).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/student/:id
router.get('/student/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('departmentId', 'name code');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const records = await Attendance.find({ studentId: student._id })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName')
      .sort({ date: -1 });

    // Subject-wise breakdown
    const subjectStats = {};
    records.forEach(r => {
      const subId = r.subjectId?._id?.toString() || 'unknown';
      if (!subjectStats[subId]) {
        subjectStats[subId] = {
          subject: r.subjectId,
          total: 0, present: 0, absent: 0, late: 0
        };
      }
      subjectStats[subId].total++;
      if (r.status === 'PRESENT') subjectStats[subId].present++;
      else if (r.status === 'ABSENT') subjectStats[subId].absent++;
      else if (r.status === 'LATE') subjectStats[subId].late++;
    });

    Object.values(subjectStats).forEach(s => {
      s.percentage = s.total > 0 ? (((s.present + s.late) / s.total) * 100).toFixed(1) : 0;
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;

    res.json({
      student,
      records,
      subjectWise: Object.values(subjectStats),
      overall: {
        total,
        present,
        absent: records.filter(r => r.status === 'ABSENT').length,
        late,
        percentage: total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reports/department/:id
router.get('/department/:id', auth, isAdmin, async (req, res) => {
  try {
    const students = await Student.find({ departmentId: req.params.id, status: 'ACTIVE' });
    const studentIds = students.map(s => s._id);

    const records = await Attendance.find({ studentId: { $in: studentIds } })
      .populate('studentId', 'fullName studentId')
      .populate('subjectId', 'subjectName subjectCode');

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;

    res.json({
      totalStudents: students.length,
      totalRecords: total,
      present,
      absent: total - present,
      percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      records
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
