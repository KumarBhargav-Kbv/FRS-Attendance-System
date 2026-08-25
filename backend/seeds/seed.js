require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Settings = require('../models/Settings');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Department.deleteMany({}),
      Subject.deleteMany({}),
      Class.deleteMany({}),
      Attendance.deleteMany({}),
      AttendanceSession.deleteMany({}),
      Settings.deleteMany({})
    ]);
    console.log('Cleared all existing data from MongoDB Atlas');

    // Create SVIET Department
    const department = await Department.create({
      name: 'Computer Science & Engineering (AIML)',
      code: 'CSE-AIML',
      description: 'Department of Computer Science and Engineering (Artificial Intelligence and Machine Learning)',
      hod: 'Dr. M. Nancharaiah'
    });
    console.log('Seeded Department: CSE-AIML');

    // Create default settings
    await Settings.create([
      { key: 'attendanceThreshold', value: 75, description: 'Minimum attendance percentage required' },
      { key: 'recognitionConfidenceThreshold', value: 60, description: 'Minimum face recognition confidence' },
      { key: 'instituteName', value: 'Sri Vasavi Institute of Engineering & Technology', description: 'Institute name' },
      { key: 'instituteCode', value: 'SVIET', description: 'Institute code' },
      { key: 'maxSessionDuration', value: 120, description: 'Max session duration in minutes' },
      { key: 'lateThresholdMinutes', value: 15, description: 'Late threshold in minutes' }
    ]);
    console.log('Seeded default application settings');

    // Create Admin Account with user's custom credentials
    await User.create({
      name: 'SVIET Admin',
      email: 'vasakumarbhargav2@gmail.com',
      password: '99519663@Kb',
      role: 'ADMIN'
    });
    console.log('Seeded primary admin user: vasakumarbhargav2@gmail.com');

    console.log('Database seeding successfully finished! Closed all demo students/faculty accounts.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
