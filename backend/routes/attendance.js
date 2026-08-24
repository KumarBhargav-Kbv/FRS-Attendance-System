const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');
const { auth, isFaculty, isAdmin } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// POST /api/attendance/session - Start attendance session
router.post('/session', auth, isFaculty, [
  body('subjectId').notEmpty(),
  body('classId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

    // Check for active session
    const activeSession = await AttendanceSession.findOne({
      facultyId: faculty._id,
      status: 'ACTIVE'
    });
    if (activeSession) {
      return res.status(400).json({ message: 'You already have an active session', session: activeSession });
    }

    const now = new Date();
    const session = await AttendanceSession.create({
      facultyId: faculty._id,
      subjectId: req.body.subjectId,
      classId: req.body.classId,
      date: now,
      startTime: now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }),
      status: 'ACTIVE'
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/attendance/session/:id/end - End session
router.post('/session/:id/end', auth, isFaculty, async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'COMPLETED';
    session.endTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    await session.save();

    // Mark remaining students as absent
    const cls = await (require('../models/Class')).findById(session.classId);
    if (cls) {
      const students = await Student.find({
        departmentId: cls.departmentId,
        year: cls.year,
        section: cls.section,
        status: 'ACTIVE'
      });

      for (const student of students) {
        const existing = await Attendance.findOne({
          studentId: student._id,
          sessionId: session._id
        });
        if (!existing) {
          await Attendance.create({
            studentId: student._id,
            facultyId: session.facultyId,
            subjectId: session.subjectId,
            classId: session.classId,
            date: session.date,
            time: null,
            status: 'ABSENT',
            recognitionConfidence: 0,
            recognitionMethod: 'FACE_RECOGNITION',
            sessionId: session._id
          });
        }
      }
    }

    res.json(session);
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/attendance/recognize - Recognize face and mark attendance
router.post('/recognize', auth, isFaculty, async (req, res) => {
  try {
    const { sessionId, image } = req.body;
    if (!sessionId || !image) {
      return res.status(400).json({ message: 'Session ID and image required' });
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'No active session found' });
    }

    // Get all registered students for this class
    const cls = await (require('../models/Class')).findById(session.classId);
    const students = await Student.find({
      departmentId: cls.departmentId,
      year: cls.year,
      section: cls.section,
      faceRegistered: true,
      status: 'ACTIVE'
    });

    // Build embeddings map for AI service
    const registeredFaces = students.map(s => ({
      student_id: s.studentId,
      mongo_id: s._id.toString(),
      name: s.fullName,
      embedding: s.faceEmbedding
    }));

    // Send to Python AI service
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/face/recognize`, {
        image: image,
        registered_faces: registeredFaces
      }, { timeout: 10000 });

      if (aiResponse.data.recognized && aiResponse.data.confidence >= 60) {
        const student = await Student.findById(aiResponse.data.mongo_id);
        if (!student) {
          return res.json({ recognized: false, message: 'Student not found in database' });
        }

        // Check for duplicate attendance
        const existing = await Attendance.findOne({
          studentId: student._id,
          sessionId: session._id
        });

        if (existing) {
          return res.json({
            recognized: true,
            duplicate: true,
            student: { name: student.fullName, studentId: student.studentId },
            message: 'Attendance already marked'
          });
        }

        // Mark attendance
        const attendance = await Attendance.create({
          studentId: student._id,
          facultyId: session.facultyId,
          subjectId: session.subjectId,
          classId: session.classId,
          date: session.date,
          time: new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }),
          status: 'PRESENT',
          recognitionConfidence: aiResponse.data.confidence,
          recognitionMethod: 'FACE_RECOGNITION',
          sessionId: session._id
        });

        return res.json({
          recognized: true,
          duplicate: false,
          student: { name: student.fullName, studentId: student.studentId },
          confidence: aiResponse.data.confidence,
          attendance: attendance
        });
      } else {
        return res.json({
          recognized: false,
          confidence: aiResponse.data.confidence || 0,
          message: 'Face not recognized or confidence too low'
        });
      }
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      return res.status(503).json({ message: 'Face recognition service unavailable' });
    }
  } catch (error) {
    console.error('Recognize error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/attendance/mark - Manual attendance marking
router.post('/mark', auth, isFaculty, async (req, res) => {
  try {
    const { studentId, sessionId, status } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const faculty = await Faculty.findOne({ userId: req.user._id });

    // Check duplicate
    let attendance = await Attendance.findOne({ studentId, sessionId });
    if (attendance) {
      const previousStatus = attendance.status;
      attendance.status = status || 'PRESENT';
      attendance.recognitionMethod = 'MANUAL';
      attendance.time = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
      await attendance.save();

      await AuditLog.create({
        userId: req.user._id,
        action: 'MANUAL_ATTENDANCE_UPDATE',
        targetId: attendance._id,
        targetModel: 'Attendance',
        description: `Changed attendance from ${previousStatus} to ${status}`,
        previousValue: previousStatus,
        newValue: status
      });
    } else {
      attendance = await Attendance.create({
        studentId,
        facultyId: faculty._id,
        subjectId: session.subjectId,
        classId: session.classId,
        date: session.date,
        time: new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }),
        status: status || 'PRESENT',
        recognitionConfidence: 100,
        recognitionMethod: 'MANUAL',
        sessionId
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance - Get attendance records
router.get('/', auth, async (req, res) => {
  try {
    const { date, subject, student, department, status, sessionId, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (subject) filter.subjectId = subject;
    if (student) filter.studentId = student;
    if (status) filter.status = status;
    if (sessionId) filter.sessionId = sessionId;

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate({ path: 'studentId', select: 'fullName studentId rollNumber', populate: { path: 'departmentId', select: 'name code' }})
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName facultyId')
      .sort({ date: -1, time: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/student/:id - Get student attendance
router.get('/student/:id', auth, async (req, res) => {
  try {
    const { subject, month, year } = req.query;
    const filter = { studentId: req.params.id };
    if (subject) filter.subjectId = subject;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter)
      .populate('subjectId', 'subjectName subjectCode')
      .populate('facultyId', 'fullName')
      .sort({ date: -1, time: -1 });

    // Calculate stats
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    res.json({ records, stats: { total, present, absent, late, percentage: parseFloat(percentage) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/subject/:id - Get subject attendance
router.get('/subject/:id', auth, async (req, res) => {
  try {
    const { date, student } = req.query;
    const filter = { subjectId: req.params.id };
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (student) filter.studentId = student;

    const records = await Attendance.find(filter)
      .populate('studentId', 'fullName studentId rollNumber')
      .populate('facultyId', 'fullName')
      .sort({ date: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ records, stats: { total, present, absent: total - present, percentage: parseFloat(percentage) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/attendance/:id - Manual correction
router.put('/:id', auth, isFaculty, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Record not found' });

    const previousStatus = attendance.status;
    attendance.status = req.body.status;
    attendance.recognitionMethod = 'MANUAL';
    await attendance.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'ATTENDANCE_CORRECTION',
      targetId: attendance._id,
      targetModel: 'Attendance',
      description: `Corrected attendance from ${previousStatus} to ${req.body.status}`,
      previousValue: previousStatus,
      newValue: req.body.status
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/sessions - Get sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const { faculty, status, date } = req.query;
    const filter = {};
    if (faculty) filter.facultyId = faculty;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }

    const sessions = await AttendanceSession.find(filter)
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId')
      .populate('facultyId', 'fullName facultyId')
      .sort({ date: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
