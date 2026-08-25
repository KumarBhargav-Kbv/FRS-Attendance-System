const express = require('express');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/dashboard - Admin dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    const dayStart = new Date(today.setHours(0, 0, 0, 0));
    const dayEnd = new Date(today.setHours(23, 59, 59, 999));

    const [totalStudents, totalFaculty, totalDepts, totalClasses] = await Promise.all([
      Student.countDocuments({ status: 'ACTIVE' }),
      Faculty.countDocuments({ status: 'ACTIVE' }),
      Department.countDocuments(),
      Class.countDocuments()
    ]);

    // Today's attendance
    const todayRecords = await Attendance.find({
      date: { $gte: dayStart, $lte: dayEnd }
    });

    const todayPresent = todayRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const todayAbsent = todayRecords.filter(r => r.status === 'ABSENT').length;
    const todayTotal = todayRecords.length;
    const todayPercentage = todayTotal > 0 ? ((todayPresent / todayTotal) * 100).toFixed(1) : 0;

    // Weekly attendance (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStart = new Date(d.setHours(0, 0, 0, 0));
      const dEnd = new Date(d.setHours(23, 59, 59, 999));

      const dayRecords = await Attendance.find({ date: { $gte: dStart, $lte: dEnd } });
      const dayPresent = dayRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
      const dayTotal = dayRecords.length;

      weeklyData.push({
        date: dStart.toISOString().split('T')[0],
        day: dStart.toLocaleDateString('en-US', { weekday: 'short' }),
        total: dayTotal,
        present: dayPresent,
        absent: dayTotal - dayPresent,
        percentage: dayTotal > 0 ? parseFloat(((dayPresent / dayTotal) * 100).toFixed(1)) : 0
      });
    }

    // Department-wise stats
    const departments = await Department.find();
    const deptStats = [];
    for (const dept of departments) {
      const deptStudents = await Student.countDocuments({ departmentId: dept._id, status: 'ACTIVE' });
      const deptStudentIds = (await Student.find({ departmentId: dept._id })).map(s => s._id);
      const deptRecords = await Attendance.find({ studentId: { $in: deptStudentIds } });
      const deptPresent = deptRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

      deptStats.push({
        department: dept.name,
        code: dept.code,
        students: deptStudents,
        totalRecords: deptRecords.length,
        present: deptPresent,
        percentage: deptRecords.length > 0 ? parseFloat(((deptPresent / deptRecords.length) * 100).toFixed(1)) : 0
      });
    }

    // Recent sessions
    const recentSessions = await AttendanceSession.find()
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Face registration stats
    const faceRegistered = await Student.countDocuments({ faceRegistered: true, status: 'ACTIVE' });
    const faceNotRegistered = totalStudents - faceRegistered;

    res.json({
      stats: {
        totalStudents,
        totalFaculty,
        totalDepartments: totalDepts,
        totalClasses,
        todayPresent,
        todayAbsent,
        todayPercentage: parseFloat(todayPercentage),
        faceRegistered,
        faceNotRegistered
      },
      weeklyData,
      departmentStats: deptStats,
      recentSessions
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/faculty-dashboard - Faculty dashboard stats
router.get('/faculty-dashboard', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

    // Dynamically retrieve classes assigned to this faculty
    const classes = await Class.find({ facultyId: faculty._id })
      .populate('departmentId', 'name code')
      .populate('subjectId', 'subjectName subjectCode');

    // Extract subjects assigned to this faculty from classes
    const subjects = classes.map(c => c.subjectId).filter((val, idx, self) => self.findIndex(t => t?._id?.toString() === val?._id?.toString()) === idx);

    const today = new Date();
    const dayStart = new Date(today.setHours(0, 0, 0, 0));
    const dayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Today's sessions
    const todaySessions = await AttendanceSession.find({
      facultyId: faculty._id,
      date: { $gte: dayStart, $lte: dayEnd }
    }).populate('subjectId', 'subjectName subjectCode');

    // Today's attendance by this faculty
    const todayRecords = await Attendance.find({
      facultyId: faculty._id,
      date: { $gte: dayStart, $lte: dayEnd }
    });

    const todayPresent = todayRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const todayTotal = todayRecords.length;

    // Overall stats
    const allRecords = await Attendance.find({ facultyId: faculty._id });
    const allPresent = allRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

    const facultyObj = faculty.toObject();
    facultyObj.subjects = subjects;
    facultyObj.assignedClasses = classes;

    res.json({
      faculty: facultyObj,
      stats: {
        assignedClasses: classes.length,
        todayClasses: todaySessions.length,
        todayPresent,
        todayTotal,
        todayPercentage: todayTotal > 0 ? parseFloat(((todayPresent / todayTotal) * 100).toFixed(1)) : 0,
        averageAttendance: allRecords.length > 0 ? parseFloat(((allPresent / allRecords.length) * 100).toFixed(1)) : 0
      },
      todaySessions,
      classes: classes
    });
  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/student-dashboard - Student dashboard stats
router.get('/student-dashboard', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('departmentId', 'name code');
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const records = await Attendance.find({ studentId: student._id })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName')
      .sort({ date: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;

    // Subject-wise breakdown
    const subjectStats = {};
    records.forEach(r => {
      const key = r.subjectId?._id?.toString() || 'unknown';
      if (!subjectStats[key]) {
        subjectStats[key] = {
          subject: r.subjectId,
          total: 0, present: 0, absent: 0, late: 0
        };
      }
      subjectStats[key].total++;
      if (r.status === 'PRESENT') subjectStats[key].present++;
      else if (r.status === 'ABSENT') subjectStats[key].absent++;
      else subjectStats[key].late++;
    });

    Object.values(subjectStats).forEach(s => {
      s.percentage = s.total > 0 ? parseFloat((((s.present + s.late) / s.total) * 100).toFixed(1)) : 0;
    });

    // Monthly data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const mRecords = records.filter(r => r.date >= mStart && r.date <= mEnd);
      const mPresent = mRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

      monthlyData.push({
        month: mStart.toLocaleDateString('en-US', { month: 'short' }),
        year: mStart.getFullYear(),
        total: mRecords.length,
        present: mPresent,
        percentage: mRecords.length > 0 ? parseFloat(((mPresent / mRecords.length) * 100).toFixed(1)) : 0
      });
    }

    // Get attendance threshold
    const Settings = require('../models/Settings');
    const threshold = await Settings.getSetting('attendanceThreshold') || 75;

    res.json({
      student,
      stats: { total, present, absent, late, percentage: parseFloat(percentage) },
      subjectWise: Object.values(subjectStats),
      monthlyData,
      recentRecords: records.slice(0, 20),
      threshold,
      belowThreshold: parseFloat(percentage) < threshold
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
