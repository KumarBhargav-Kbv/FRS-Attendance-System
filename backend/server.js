require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Seeding function
async function autoSeed() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping auto-seeding.');
      return;
    }

    console.log('Database is empty! Starting auto-seeding with SVIET timetable dataset...');
    const Department = require('./models/Department');
    const Subject = require('./models/Subject');
    const Class = require('./models/Class');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const Settings = require('./models/Settings');
    const Attendance = require('./models/Attendance');
    const AttendanceSession = require('./models/AttendanceSession');

    const department = await Department.create({
      name: 'Computer Science & Engineering (AIML)',
      code: 'CSE-AIML',
      description: 'Department of Computer Science and Engineering (Artificial Intelligence and Machine Learning)',
      hod: 'Dr. M. Nancharaiah'
    });

    await Settings.create([
      { key: 'attendanceThreshold', value: 75, description: 'Minimum attendance percentage required' },
      { key: 'recognitionConfidenceThreshold', value: 60, description: 'Minimum face recognition confidence' },
      { key: 'instituteName', value: 'Sri Vasavi Institute of Engineering & Technology', description: 'Institute name' },
      { key: 'instituteCode', value: 'SVIET', description: 'Institute code' },
      { key: 'maxSessionDuration', value: 120, description: 'Max session duration in minutes' },
      { key: 'lateThresholdMinutes', value: 15, description: 'Late threshold in minutes' }
    ]);

    await User.create({
      name: 'SVIET Admin',
      email: 'admin@frscollege.com',
      password: 'Admin@123',
      role: 'ADMIN'
    });

    const facultyData = [
      { name: 'K. Venkateswara Rao', email: 'kvr@sviet.edu.in', id: 'FAC411', subCode: 'C411' },
      { name: 'A N V D Padmaja', email: 'anvd@sviet.edu.in', id: 'FAC412', subCode: 'C412' },
      { name: 'G. Nancharaiah', email: 'gn@sviet.edu.in', id: 'FAC414A', subCode: 'C414' },
      { name: 'Dr M. Nancharaiah', email: 'mn@sviet.edu.in', id: 'FAC414B', subCode: 'C414-ES' },
      { name: 'V. Bala Krishna', email: 'vbk@sviet.edu.in', id: 'FAC415', subCode: 'C415' },
      { name: 'K. Jhansi', email: 'kj@sviet.edu.in', id: 'FAC417', subCode: 'C417' },
      { name: 'N. Jagadeesh', email: 'nj@sviet.edu.in', id: 'FACCOUN', subCode: 'COUN' },
      { name: 'Faculty Team', email: 'faculty@frscollege.com', id: 'FACTEAM', subCode: 'CRTP' }
    ];

    const facultyProfiles = {};
    for (const f of facultyData) {
      const user = await User.create({
        name: f.name,
        email: f.email,
        password: 'Faculty@123',
        role: 'FACULTY'
      });
      const profile = await Faculty.create({
        userId: user._id,
        facultyId: f.id,
        fullName: f.name,
        email: f.email,
        phone: '9876543210',
        departmentId: department._id
      });
      facultyProfiles[f.subCode] = profile;
    }

    const subjectsList = [
      { code: 'C411', name: 'Reinforcement Learning', year: 4, semester: 1 },
      { code: 'C412', name: 'Human Resource and Project Management', year: 4, semester: 1 },
      { code: 'C414', name: 'Block Chain Technologies', year: 4, semester: 1 },
      { code: 'C414-ES', name: 'Embedded Systems', year: 4, semester: 1 },
      { code: 'C415', name: 'Environmental Impact Assessment', year: 4, semester: 1 },
      { code: 'C416', name: 'PROMPT ENGINEERING(SEC) LAB', year: 4, semester: 1 },
      { code: 'C417', name: 'Constitution of India', year: 4, semester: 1 },
      { code: 'COUN', name: 'Counseling', year: 4, semester: 1 },
      { code: 'CRTP', name: 'Campus Recruitment Training Program', year: 4, semester: 1 }
    ];

    const subjects = {};
    for (const s of subjectsList) {
      const matchedFaculty = facultyProfiles[s.code];
      const subject = await Subject.create({
        subjectCode: s.code,
        subjectName: s.name,
        departmentId: department._id,
        year: s.year,
        semester: s.semester,
        facultyId: matchedFaculty ? matchedFaculty._id : null
      });
      subjects[s.code] = subject;
      if (matchedFaculty) {
        await Faculty.findByIdAndUpdate(matchedFaculty._id, { $push: { subjects: subject._id } });
      }
    }

    const classesToCreate = [
      { day: 'Monday', period: 1, start: '09:00 AM', end: '09:50 AM', sub: 'CRTP', room: 'B1.308' },
      { day: 'Monday', period: 2, start: '09:50 AM', end: '10:40 AM', sub: 'CRTP', room: 'B1.308' },
      { day: 'Monday', period: 3, start: '11:00 AM', end: '11:50 AM', sub: 'C411', room: 'B1.308' },
      { day: 'Monday', period: 4, start: '11:50 AM', end: '12:40 PM', sub: 'C414-ES', room: 'B1.308' },
      { day: 'Monday', period: 5, start: '01:20 PM', end: '02:10 PM', sub: 'C415', room: 'B1.308' },
      { day: 'Monday', period: 6, start: '02:10 PM', end: '03:00 PM', sub: 'C414', room: 'B1.308' },
      { day: 'Monday', period: 7, start: '03:00 PM', end: '03:50 PM', sub: 'CRTP', room: 'B1.308' },
      { day: 'Friday', period: 1, start: '09:00 AM', end: '09:50 AM', sub: 'C411', room: 'B1.308' },
      { day: 'Friday', period: 2, start: '09:50 AM', end: '10:40 AM', sub: 'C412', room: 'B1.308' },
      { day: 'Friday', period: 3, start: '11:00 AM', end: '11:50 AM', sub: 'C414-ES', room: 'B1.308' },
      { day: 'Friday', period: 4, start: '11:50 AM', end: '12:40 PM', sub: 'C415', room: 'B1.308' },
      { day: 'Friday', period: 5, start: '01:20 PM', end: '02:10 PM', sub: 'C416', room: 'CSE Lab-2' },
      { day: 'Friday', period: 6, start: '02:10 PM', end: '03:00 PM', sub: 'C416', room: 'CSE Lab-2' },
      { day: 'Friday', period: 7, start: '03:00 PM', end: '03:50 PM', sub: 'C416', room: 'CSE Lab-2' }
    ];

    const classes = [];
    for (const c of classesToCreate) {
      const subject = subjects[c.sub];
      const faculty = facultyProfiles[c.sub];
      if (subject && faculty) {
        const cls = await Class.create({
          departmentId: department._id,
          year: 4,
          section: 'CSE-AIML',
          subjectId: subject._id,
          facultyId: faculty._id,
          room: c.room,
          schedule: {
            day: c.day,
            startTime: c.start,
            endTime: c.end,
            period: c.period
          }
        });
        classes.push(cls);
        await Faculty.findByIdAndUpdate(faculty._id, { $push: { assignedClasses: cls._id } });
      }
    }

    const studentUser = await User.create({
      name: 'Rahul Kumar',
      email: 'student@frscollege.com',
      password: 'Student@123',
      role: 'STUDENT'
    });

    const students = [];
    const studentNames = ['Rahul Kumar', 'Priya Sharma', 'Anil Reddy', 'Sneha Patel', 'Vikram Singh', 'Karthik Menon', 'Divya Rao', 'Sanjay Verma', 'Nisha Agarwal', 'Harish Kumar'];

    for (let i = 0; i < studentNames.length; i++) {
      let uId;
      if (i === 0) {
        uId = studentUser._id;
      } else {
        const user = await User.create({
          name: studentNames[i],
          email: `student${i+1}@sviet.edu.in`,
          password: 'Student@123',
          role: 'STUDENT'
        });
        uId = user._id;
      }

      const student = await Student.create({
        userId: uId,
        studentId: `24CS${String(i+1).padStart(3, '0')}`,
        rollNumber: `24A81A${String(i+1).padStart(3, '0')}`,
        fullName: studentNames[i],
        email: i === 0 ? 'student@frscollege.com' : `student${i+1}@sviet.edu.in`,
        phone: `98765${String(43210 + i)}`,
        departmentId: department._id,
        year: 4,
        section: 'CSE-AIML',
        batch: '2023-2027',
        faceRegistered: i < 5,
        status: 'ACTIVE'
      });
      students.push(student);
    }

    const attendanceRecords = [];
    for (let i = 10; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const cls of classes.slice(0, 4)) {
        const session = await AttendanceSession.create({
          facultyId: cls.facultyId,
          subjectId: cls.subjectId,
          classId: cls._id,
          date,
          startTime: cls.schedule.startTime,
          status: 'COMPLETED'
        });

        for (const student of students) {
          const isPresent = Math.random() > 0.15;
          attendanceRecords.push({
            studentId: student._id,
            facultyId: cls.facultyId,
            subjectId: cls.subjectId,
            classId: cls._id,
            date,
            time: isPresent ? '09:05 AM' : null,
            status: isPresent ? 'PRESENT' : 'ABSENT',
            recognitionConfidence: isPresent ? 85 + Math.floor(Math.random() * 15) : 0,
            recognitionMethod: 'FACE_RECOGNITION',
            sessionId: session._id
          });
        }
      }
    }

    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
    }

    console.log('✅ Auto-seeding completed successfully!');
  } catch (error) {
    console.error('Auto-seed error:', error);
  }
}

// Start database and server
async function startServer() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Atlas');
    await autoSeed();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (atlasError) {
    console.warn('⚠️ Atlas connection failed. Falling back to local in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log(`Connected to memory DB at: ${uri}`);
      await mongoose.connect(uri);
      console.log('✅ In-memory database connection successful!');
      await autoSeed();
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (In-Memory mode)`));
    } catch (memError) {
      console.error('❌ Could not start in-memory database:', memError.message);
      process.exit(1);
    }
  }
}

startServer();
